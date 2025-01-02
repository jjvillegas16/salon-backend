import { Retell } from "retell-sdk";
import { env } from "../utils/envConfig";

export const retellClient = new Retell({
  apiKey: env.RETELL_API_KEY,
});
