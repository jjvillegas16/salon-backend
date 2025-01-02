import type { Request } from "express";
import type { RawData, WebSocket } from "ws";
import type { LlmClientInterface } from "../../common/llms/llmClientInterface";
import type { CustomLlmRequest, CustomLlmResponse, ResponseRequiredRequest } from "../../common/llms/types";

type HandleMessageParams = {
  data: RawData;
  isBinary: boolean;
  llmClient: LlmClientInterface;
};

const config: CustomLlmResponse = {
  response_type: "config",
  config: {
    auto_reconnect: true,
    call_details: true,
  },
};

export class PhoneAgentWebSocketHandler {
  protected webSocket: WebSocket;

  constructor(websocket: WebSocket) {
    this.webSocket = websocket;
  }

  // send stringified data to the websocket
  send = (data: any) => {
    this.webSocket.send(JSON.stringify(data));
  };

  // handles functions to be called when connected to websocket
  handleConnect = async (request: Request, llmClient: LlmClientInterface) => {
    try {
      const callId = request.params.call_id;

      // send config to Retell server
      this.send(config);

      // handle incoming messages
      this.webSocket.on("message", async (data: RawData, isBinary: boolean) => {
        this.handleMessage({ data, isBinary, llmClient });
      });

      // handle webSocket disconnection
      this.webSocket.on("close", () => {
        console.log(`Client disconnected: ${callId}`);
      });

      // handle errors
      this.webSocket.on("error", (err) => {
        console.error(`Error on websocket for ${callId}:`, err);
      });
    } catch (err) {
      this.webSocket.close(1011, `Encountered error: ${err}`);
    }
  };

  // handle the on "message" event
  handleMessage = async ({ data, isBinary, llmClient }: HandleMessageParams) => {
    if (isBinary) {
      console.error("Got binary message instead of text in websocket.");
      this.webSocket.close(1007, "Cannot find corresponding Retell LLM.");
    }
    const request: CustomLlmRequest = JSON.parse(data.toString());

    // there are 5 types of interaction_type: call_details, ping_pong, update_only,response_required, and reminder_required.
    // not all of them need to be handled, only response_required and reminder_required.
    if (request.interaction_type === "call_details") {
      // print call details
      console.log("call details: ", request.call);
      // send begin message to start the conversation
      const beginMessage = llmClient.getBeginMessage();
      this.send(beginMessage);
    } else if (request.interaction_type === "reminder_required" || request.interaction_type === "response_required") {
      console.clear();
      llmClient.draftResponse(request, this.send);
    } else if (request.interaction_type === "ping_pong") {
      // send back ping_pong to keep current connection alive
      const pingpongResponse: CustomLlmResponse = {
        response_type: "ping_pong",
        timestamp: request.timestamp,
      };
      this.webSocket.send(JSON.stringify(pingpongResponse));
    } else if (request.interaction_type === "update_only") {
      // process live transcript update if needed
    }
  };
}
