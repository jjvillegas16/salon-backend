import type { WebSocket } from "ws";
import type { LlmClientInterface } from "./llmClientInterface";
import type { CustomLlmResponse, ReminderRequiredRequest, ResponseRequiredRequest, RetellResponse } from "./types";

export class DummyClient implements LlmClientInterface {
  getBeginMessage(): RetellResponse {
    const response: RetellResponse = {
      response_id: 0,
      content: "How may I help you?",
      content_complete: true,
      end_call: false,
    };
    return response;
  }

  async draftResponse(
    request: ResponseRequiredRequest | ReminderRequiredRequest,
    onFinish: (response: CustomLlmResponse) => void,
  ) {
    try {
      const response: CustomLlmResponse = {
        response_type: "response",
        response_id: request.response_id,
        content: "I am sorry, can you say that again?",
        content_complete: false,
        end_call: false,
      };
      onFinish(response);
    } catch (err) {
      console.error("Error in gpt stream: ", err);
      throw err;
    }
  }
}
