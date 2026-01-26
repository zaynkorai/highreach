import Telnyx from "telnyx";

if (!process.env.TELNYX_API_KEY) {
    throw new Error("Missing TELNYX_API_KEY environment variable");
}

// @ts-expect-error -- Telnyx SDK types are not up to date
export const telnyx = new Telnyx(process.env.TELNYX_API_KEY);
