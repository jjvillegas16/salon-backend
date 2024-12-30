class LlmWebSocketController {
  public getUsers = async (_req: Request, res: Response) => {
    // const serviceResponse = await userService.findAll();
    // return handleServiceResponse(serviceResponse, res);
  };

  //   public getUser: RequestHandler = async (req: Request, res: Response) => {
  //     const id = Number.parseInt(req.params.id as string, 10);
  //     const serviceResponse = await userService.findById(id);
  //     return handleServiceResponse(serviceResponse, res);
  //   };
}

export const llmWebSocketController = new LlmWebSocketController();
