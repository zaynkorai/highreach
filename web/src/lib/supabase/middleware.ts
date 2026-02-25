import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { AppRole, AppPermission } from "@/lib/types/database";

/**
 * Route-level permission requirements.
 * If a route prefix is listed here, the user must have the specified
 * permission(s) to access it. If not listed, only authentication is required.
 */
const ROUTE_PERMISSIONS: Record<string, AppPermission> = {
    "/dashboard/settings/billing": "billing.read",
    "/dashboard/settings/team": "team.read",
};

/**
 * Routes that require specific roles (stricter than permissions).
 */
const ROUTE_ROLES: Record<string, AppRole[]> = {
    "/dashboard/settings/billing": ["owner", "admin"],
};

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return response;
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // No user and trying to access dashboard → redirect to login
    const pathname = request.nextUrl.pathname;
    if (!user && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If authenticated, enforce route-level permissions
    if (user && pathname.startsWith("/dashboard")) {
        const role = user.app_metadata?.role as AppRole | undefined;
        const tenantId = user.app_metadata?.tenant_id as string | undefined;

        // If no claims yet (new user mid-signup), let them through to onboarding
        if (!role || !tenantId) {
            if (!pathname.startsWith("/onboarding")) {
                // They need to complete signup/onboarding first
            }
        } else {
            // Check route-level permissions
            for (const [routePrefix, requiredPermission] of Object.entries(ROUTE_PERMISSIONS)) {
                if (pathname.startsWith(routePrefix)) {
                    // Check role-based access
                    const allowedRoles = ROUTE_ROLES[routePrefix];
                    if (allowedRoles && !allowedRoles.includes(role)) {
                        return NextResponse.redirect(new URL("/dashboard", request.url));
                    }
                    break;
                }
            }
        }
    }

    return response;
}
