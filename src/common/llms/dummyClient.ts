import type { WebSocket } from "ws";
import type { LlmClientInterface } from "./llmClientInterface";
import type { ReminderRequiredRequest, ResponseRequiredRequest } from "./types";

interface Utterance {
  role: "agent" | "user";
  content: string;
}

// LLM Websocket Request Object
export interface RetellRequest {
  response_id?: number;
  transcript: Utterance[];
  interaction_type: "update_only" | "response_required" | "reminder_required";
}

// LLM Websocket Response Object
export interface RetellResponse {
  response_id?: number;
  content: string;
  content_complete: boolean;
  end_call: boolean;
}

export class DummyClient implements LlmClientInterface {
  // constructor() {}

  getBeginMessage() {
    const res: RetellResponse = {
      response_id: 0,
      content: "How may I help you?",
      content_complete: true,
      end_call: false,
    };
    return JSON.stringify(res);
  }

  async draftResponse(request: ResponseRequiredRequest | ReminderRequiredRequest) {
    try {
      const res: RetellResponse = {
        response_id: request.response_id,
        content: "I am sorry, can you say that again?",
        content_complete: true,
        end_call: false,
      };
      return JSON.stringify(res);
    } catch (err) {
      console.error("Error in gpt stream: ", err);
      throw err;
    }
  }
}
