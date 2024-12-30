import type { RetellRequest } from "./dummyClient";
import type { ReminderRequiredRequest, ResponseRequiredRequest } from "./types";

export interface LlmClientInterface {
  getBeginMessage(): string;
  draftResponse(request: ResponseRequiredRequest | ReminderRequiredRequest): Promise<string>;
}
