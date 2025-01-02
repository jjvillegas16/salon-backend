import cors from "cors";
import express, { type Request } from "express";
import expressWs from "express-ws";
import helmet from "helmet";
import { pino } from "pino";
import type { WebSocket } from "ws";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { userRouter } from "@/api/user/userRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import { PhoneAgentWebSocketHandler } from "./api/phoneAgentWebSocket/phoneAgentWebsocketHandler";
import { webCallRouter } from "./api/webCall/webCallRouter";
import { OpenAIClient } from "./common/llms/openAiClient";

const logger = pino({ name: "server start" });

const expressApp = express();
const app = expressWs(expressApp).app;

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
app.ws("/llm-websocket/:call_id", async (webSocket: WebSocket, request: Request) => {
  // create an OpenAI client for our custom llm
  const llmClient = new OpenAIClient();

  // this webSocket handler will call the necessary functions when the webSocket
  // connection has been established
  const phoneAgentWebsocketHandler = new PhoneAgentWebSocketHandler(webSocket);
  await phoneAgentWebsocketHandler.handleConnect(request, llmClient);
});

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/web-calls", webCallRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
