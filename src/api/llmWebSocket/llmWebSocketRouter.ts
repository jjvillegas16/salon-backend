import express from "express";
import type { Router } from "express-ws";
import type { RawData } from "ws";
import { LlmDummyClient, type RetellRequest } from "../../common/llms/dummyClient";

export const llmWebSocketRouter: Router = express.Router();

llmWebSocketRouter.ws("/llm-websocket/:call_id", async (ws, req) => {
  // callId is a unique identifier of a call, containing all information about it
  const callId = req.params.call_id;

  const llmClient = new LlmDummyClient();

  // You need to send the first message here, but for now let's skip that.
  ws.on("error", (err) => {
    console.error("Error received in LLM websocket client: ", err);
  });

  // Send Begin message
  const beginMessage = llmClient.getBeginMessage();
  ws.send(beginMessage);

  ws.on("message", async (data: RawData, isBinary: boolean) => {
    // Retell server will send transcript from caller along with other information
    // You will be adding code to process and respond here
    console.log("data from ws", data);

    try {
      const request: RetellRequest = JSON.parse(data.toString());
      // LLM will think about a response
      llmClient.draftResponse(request);
    } catch (err) {
      console.error("Error in parsing LLM websocket message: ", err);
      ws.close(1002, "Cannot parse incoming message.");
    }
  });
});
