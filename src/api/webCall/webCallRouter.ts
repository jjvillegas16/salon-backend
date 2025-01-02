import express, { type Router } from "express";

import { webCallController } from "./webCallController";

export const webCallRouter: Router = express.Router();

webCallRouter.post("/", webCallController.createWebCall);
