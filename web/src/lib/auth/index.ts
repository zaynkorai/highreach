import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AppRole } from "@/lib/types/database";

export interface SessionPayload {
    userId: string;
    email: string;
    tenantId: string;
    role: AppRole;
    fullName?: string | null;
}

export const AUTH_COOKIE_NAME = "highreach_session";

function getJwtSecret(): Uint8Array {
    const configuredSecret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
    if (!configuredSecret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("FATAL: AUTH_SECRET or JWT_SECRET must be configured in production environment.");
        }
        return new TextEncoder().encode("highreach-auth-secret-key-at-least-32-chars-long-secure-fallback");
    }
    return new TextEncoder().encode(configuredSecret);
}

/**
 * Hash a plain-text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

/**
 * Verify a plain-text password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/**
 * Sign a new JWT session token valid for 7 days.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getJwtSecret());
}

/**
 * Verify and decode a JWT session token.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        if (!payload.userId || !payload.tenantId || !payload.role) {
            return null;
        }
        return {
            userId: payload.userId as string,
            email: payload.email as string,
            tenantId: payload.tenantId as string,
            role: payload.role as AppRole,
            fullName: (payload.fullName as string) || null,
        };
    } catch {
        return null;
    }
}

/**
 * Set the authentication cookie in server context.
 */
export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

/**
 * Clear the authentication cookie.
 */
export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Read and verify session from cookies.
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
        if (!token) return null;
        return await verifySessionToken(token);
    } catch {
        return null;
    }
}
