import Telnyx from "telnyx";

if (!process.env.TELNYX_API_KEY) {
    throw new Error("Missing TELNYX_API_KEY environment variable");
}

// @ts-ignore
export const telnyx = new Telnyx(process.env.TELNYX_API_KEY);
