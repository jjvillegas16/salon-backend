import type { Request, RequestHandler, Response } from "express";

import { userService } from "@/api/user/userService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { webCallService } from "./webCallService";

class WebCallController {
  public createWebCall: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await webCallService.createWebCall();
    return handleServiceResponse(serviceResponse, res);
  };
}

export const webCallController = new WebCallController();
