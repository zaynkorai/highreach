import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Accept a team invitation via token.
 * GET /api/tenant/invite/accept?token=<uuid>
 *
 * Flow:
 * 1. User clicks invite link → redirected here
 * 2. If not logged in → redirect to signup with redirect_to param
 * 3. If logged in → accept invitation, create membership, redirect to dashboard
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(new URL("/login?error=invalid_invite", request.url));
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Not logged in — redirect to signup with invite token preserved
        const signupUrl = new URL("/signup", request.url);
        signupUrl.searchParams.set("invite", token);
        return NextResponse.redirect(signupUrl);
    }

    // Use admin client for cross-tenant operations
    const admin = createAdminClient();

    // Look up the invitation
    const { data: invitation, error: invError } = await admin
        .from("tenant_invitations")
        .select("*")
        .eq("token", token)
        .is("accepted_at", null)
        .single();

    if (invError || !invitation) {
        return NextResponse.redirect(
            new URL("/login?error=invite_expired", request.url)
        );
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
        return NextResponse.redirect(
            new URL("/login?error=invite_expired", request.url)
        );
    }

    // Check if user is already a member of this tenant
    const { data: existingMember } = await admin
        .from("tenant_members")
        .select("id")
        .eq("tenant_id", invitation.tenant_id)
        .eq("user_id", user.id)
        .single();

    if (existingMember) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Create user profile in the tenant's users table (if not exists)
    await admin
        .from("users")
        .upsert({
            id: user.id,
            tenant_id: invitation.tenant_id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
            role: invitation.role,
            onboarding_completed: true,
        }, { onConflict: "id" });

    // Create tenant membership (triggers JWT claims sync)
    await admin
        .from("tenant_members")
        .insert({
            tenant_id: invitation.tenant_id,
            user_id: user.id,
            role: invitation.role,
            invited_by: invitation.invited_by,
            invited_at: invitation.created_at,
            accepted_at: new Date().toISOString(),
        });

    // Mark invitation as accepted
    await admin
        .from("tenant_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);

    return NextResponse.redirect(new URL("/dashboard", request.url));
}
