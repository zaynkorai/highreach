import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { AppRole, AppPermission } from "@/lib/types/database";

const ROUTE_ROLES: Record<string, AppRole[]> = {
    "/dashboard/settings/billing": ["owner", "admin"],
};

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

export async function updateSession(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const token = request.cookies.get("highreach_session")?.value;
    const pathname = request.nextUrl.pathname;

    let sessionPayload: {
        userId: string;
        tenantId: string;
        role: AppRole;
    } | null = null;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, getJwtSecret());
            if (payload.userId && payload.tenantId && payload.role) {
                sessionPayload = {
                    userId: payload.userId as string,
                    tenantId: payload.tenantId as string,
                    role: payload.role as AppRole,
                };
            }
        } catch {
            sessionPayload = null;
        }
    }

    // Protect /dashboard routes
    if (pathname.startsWith("/dashboard")) {
        if (!sessionPayload) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Check role requirements
        for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_ROLES)) {
            if (pathname.startsWith(routePrefix)) {
                if (!allowedRoles.includes(sessionPayload.role)) {
                    return NextResponse.redirect(new URL("/dashboard", request.url));
                }
                break;
            }
        }
    }

    // If logged in and visiting /login or /signup, redirect to /dashboard
    if (sessionPayload && (pathname === "/login" || pathname === "/signup")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}
