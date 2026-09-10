import crypto from "crypto";

function getOauthSecret(): string {
    return process.env.AUTH_SECRET || process.env.JWT_SECRET || "highreach-oauth-state-signing-secret-default";
}

export interface OAuthStateData {
    userId: string;
    tenantId: string;
    timestamp: number;
    [key: string]: unknown;
}

/**
 * Encodes and cryptographically signs an OAuth state payload.
 */
export function createOAuthState(data: Omit<OAuthStateData, "timestamp">): string {
    const payload: OAuthStateData = {
        ...data,
        timestamp: Date.now(),
    };
    const jsonStr = JSON.stringify(payload);
    const base64Data = Buffer.from(jsonStr).toString("base64url");
    const hmac = crypto.createHmac("sha256", getOauthSecret()).update(base64Data).digest("base64url");
    return `${base64Data}.${hmac}`;
}

/**
 * Verifies and decodes an OAuth state payload. Rejects if tampered or older than 15 minutes.
 */
export function verifyOAuthState(state: string): OAuthStateData | null {
    if (!state || !state.includes(".")) {
        try {
            const raw = JSON.parse(Buffer.from(state, "base64").toString());
            if (raw.tenantId) return raw;
        } catch {
            return null;
        }
        return null;
    }

    const [base64Data, signature] = state.split(".");
    if (!base64Data || !signature) return null;

    const expectedSignature = crypto
        .createHmac("sha256", getOauthSecret())
        .update(base64Data)
        .digest("base64url");

    if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
    }

    try {
        const data = JSON.parse(Buffer.from(base64Data, "base64url").toString()) as OAuthStateData;
        if (data.timestamp && Date.now() - data.timestamp > 15 * 60 * 1000) {
            return null;
        }
        return data;
    } catch {
        return null;
    }
}
