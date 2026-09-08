import { getSessionWithRole } from "@/lib/auth/session";
import { db, tenantInvitations, tenantMembers, users } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Accept a team invitation via token.
 * GET /api/tenant/invite/accept?token=<uuid>
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(new URL("/login?error=invalid_invite", request.url));
    }

    const session = await getSessionWithRole();

    if (!session) {
        // Not logged in — redirect to signup with invite token preserved
        const signupUrl = new URL("/signup", request.url);
        signupUrl.searchParams.set("invite", token);
        return NextResponse.redirect(signupUrl);
    }

    // Look up the invitation
    const [invitation] = await db
        .select()
        .from(tenantInvitations)
        .where(
            and(
                eq(tenantInvitations.token, token),
                isNull(tenantInvitations.acceptedAt)
            )
        )
        .limit(1);

    if (!invitation) {
        return NextResponse.redirect(new URL("/login?error=invite_expired", request.url));
    }

    // Check expiry
    if (new Date(invitation.expiresAt) < new Date()) {
        return NextResponse.redirect(new URL("/login?error=invite_expired", request.url));
    }

    // Check if user is already a member of this tenant
    const [existingMember] = await db
        .select({ id: tenantMembers.id })
        .from(tenantMembers)
        .where(
            and(
                eq(tenantMembers.tenantId, invitation.tenantId),
                eq(tenantMembers.userId, session.user.id)
            )
        )
        .limit(1);

    if (existingMember) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Update user profile tenant if needed
    await db
        .update(users)
        .set({
            tenantId: invitation.tenantId,
            role: invitation.role,
            onboardingCompleted: true,
            updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

    // Create tenant membership
    await db.insert(tenantMembers).values({
        tenantId: invitation.tenantId,
        userId: session.user.id,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.createdAt,
        acceptedAt: new Date(),
    });

    // Mark invitation as accepted
    await db
        .update(tenantInvitations)
        .set({ acceptedAt: new Date() })
        .where(eq(tenantInvitations.id, invitation.id));

    return NextResponse.redirect(new URL("/dashboard", request.url));
}
