import type { CustomLlmResponse, ReminderRequiredRequest, ResponseRequiredRequest, RetellResponse } from "./types";

export interface LlmClientInterface {
  getBeginMessage(): RetellResponse;
  draftResponse(
    request: ResponseRequiredRequest | ReminderRequiredRequest,
    onFinish: (response: CustomLlmResponse) => void,
  ): Promise<void>;
}
