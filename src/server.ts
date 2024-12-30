import cors from "cors";
import express, { type Express, type Request } from "express";
import expressWs from "express-ws";
import helmet from "helmet";
import { pino } from "pino";
import type { RawData, WebSocket } from "ws";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { userRouter } from "@/api/user/userRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import { llmWebSocketRouter } from "./api/llmWebSocket/llmWebSocketRouter";
import { DummyClient, type RetellRequest } from "./common/llms/dummyClient";
import { OpenAIClient } from "./common/llms/openAiClient";
import type { CustomLlmRequest, CustomLlmResponse } from "./common/llms/types";

const logger = pino({ name: "server start" });

const app = expressWs(express()).app;

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// start a webSocket server
app.ws("/llm-websocket/:call_id", async (ws: WebSocket, req: Request) => {
  // callId is a unique identifier of a call, containing all information about it
  const callId = req.params.call_id;

  // Send config to Retell server
  const config: CustomLlmResponse = {
    response_type: "config",
    config: {
      auto_reconnect: true,
      call_details: true,
    },
  };
  ws.send(JSON.stringify(config));

  const llmClient = new DummyClient();

  // You need to send the first message here, but for now let's skip that.
  ws.on("error", (err) => {
    console.error("Error received in LLM websocket client: ", err);
  });

  // Send Begin message
  const beginMessage = llmClient.getBeginMessage();
  ws.send(beginMessage);

  ws.on("message", async (data: RawData, isBinary: boolean) => {
    console.log("rawData===");
    console.log(data);

    if (isBinary) {
      console.error("Got binary message instead of text in websocket.");
      ws.close(1007, "Cannot find corresponding Retell LLM.");
    }
    const request: CustomLlmRequest = JSON.parse(data.toString());

    // There are 5 types of interaction_type: call_details, ping_pong, update_only,response_required, and reminder_required.
    // Not all of them need to be handled, only response_required and reminder_required.
    if (request.interaction_type === "call_details") {
      // print call details
      console.log("call details: ", request.call);
      // Send begin message to start the conversation
      const msg = llmClient.getBeginMessage();
      ws.send(msg);
    } else if (request.interaction_type === "reminder_required" || request.interaction_type === "response_required") {
      console.clear();
      console.log("req", request);
      const response = llmClient.draftResponse(request);
    } else if (request.interaction_type === "ping_pong") {
      const pingpongResponse: CustomLlmResponse = {
        response_type: "ping_pong",
        timestamp: request.timestamp,
      };
      ws.send(JSON.stringify(pingpongResponse));
    } else if (request.interaction_type === "update_only") {
      // process live transcript update if needed
    }
  });
});

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/users", userRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
