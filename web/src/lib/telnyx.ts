import Telnyx from "telnyx";

const apiKey = process.env.TELNYX_API_KEY;

if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
        console.warn("Missing TELNYX_API_KEY environment variable. SMS features will not work.");
    }
}

// @ts-expect-error -- Telnyx SDK types are not up to date
export const telnyx = apiKey ? new Telnyx(apiKey) : null;
