import OpenAI from "openai";
import { agentGreetingMsg, agentPrompt } from "./constants";
import type { LlmClientInterface } from "./llmClientInterface";
import type {
  CustomLlmResponse,
  ReminderRequiredRequest,
  ResponseRequiredRequest,
  RetellResponse,
  Utterance,
} from "./types";

export class OpenAIClient implements LlmClientInterface {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_APIKEY,
      organization: process.env.OPENAI_ORGANIZATION_ID,
    });
  }

  getBeginMessage(): RetellResponse {
    const response: RetellResponse = {
      response_id: 0,
      content: agentGreetingMsg,
      content_complete: true,
      end_call: false,
    };
    return response;
  }

  private ConversationToChatRequestMessages(conversation: Utterance[]) {
    const result: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    for (const turn of conversation) {
      result.push({
        role: turn.role === "agent" ? "assistant" : "user",
        content: turn.content,
      });
    }
    return result;
  }

  private preparePrompt(request: ResponseRequiredRequest | ReminderRequiredRequest) {
    const transcript = this.ConversationToChatRequestMessages(request.transcript);

    const requestMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        // This is the prompt that we add to make the AI speak more like a human
        content: agentPrompt,
      },
    ];
    for (const message of transcript) {
      requestMessages.push(message);
    }
    if (request.interaction_type === "reminder_required") {
      // Change this content if you want a different reminder message
      requestMessages.push({
        role: "user",
        content: "(Now the user has not responded in a while, you would say:)",
      });
    }
    return requestMessages;
  }

  async draftResponse(
    request: ResponseRequiredRequest | ReminderRequiredRequest,
    onFinish: (response: CustomLlmResponse) => void,
  ): Promise<void> {
    const requestMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = this.preparePrompt(request);

    try {
      const events = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: requestMessages,
        stream: true,
        temperature: 0.3,
        frequency_penalty: 1,
        max_tokens: 200,
      });

      for await (const event of events) {
        console.log("event", event);
        if (event.choices.length >= 1) {
          const delta = event.choices[0].delta;

          if (!delta || !delta.content) {
            continue;
          }

          const response: CustomLlmResponse = {
            response_type: "response",
            response_id: request.response_id,
            content: delta.content,
            content_complete: false,
            end_call: false,
          };
          onFinish(response);
        }
      }
    } catch (err) {
      console.error("Error in gpt stream: ", err);
    } finally {
      const response: CustomLlmResponse = {
        response_type: "response",
        response_id: request.response_id,
        content: "",
        content_complete: true,
        end_call: false,
      };
      onFinish(response);
    }
  }
}
