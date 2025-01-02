import axios from "axios";
import { ServiceResponse } from "../../common/models/serviceResponse";
import { retellClient } from "../../common/retell/retellClient";
import { env } from "../../common/utils/envConfig";

export class WebCallService {
  async createWebCall() {
    // const { agent_id, metadata, retell_llm_dynamic_variables } = params.body;

    // // Prepare the payload for the API request
    // const payload = { agent_id };

    // // Conditionally add optional fields if they are provided
    // if (metadata) {
    //   payload.metadata = metadata;
    // }

    // if (retell_llm_dynamic_variables) {
    //   payload.retell_llm_dynamic_variables = retell_llm_dynamic_variables;
    // }

    try {
      const response = await retellClient.call.createWebCall({ agent_id: env.RETELL_AGENT_ID });

      return ServiceResponse.success<{ accessToken: string }>("", { accessToken: response.access_token });
    } catch (error) {
      console.error("Error creating web call:", error.response?.data || error.message);
      throw new Error("Failed to create web call");
      // res.status(500).json({ error: "Failed to create web call" });
    }
  }
}

export const webCallService = new WebCallService();
