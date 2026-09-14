"use server";

import { requirePermission } from "@/lib/rbac/guard";
import { db, tenantMembers, tenantInvitations, tenants, users } from "@/lib/db";
import { eq, and, isNull, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { AppRole } from "@/lib/types/database";
import { resend } from "@/lib/resend";

/**
 * Invite a new team member by email.
 * Requires 'team.invite' permission (owner / admin only).
 */
export async function inviteTeamMember(data: {
    email: string;
    role: AppRole;
}) {
    const session = await requirePermission("team.invite");

    if (data.role === "owner") {
        return { success: false, error: "Cannot invite as owner" };
    }

    if (session.role === "admin" && data.role === "admin") {
        return { success: false, error: "Only owners can invite admins" };
    }

    try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const [invitation] = await db
            .insert(tenantInvitations)
            .values({
                tenantId: session.tenantId,
                email: data.email.toLowerCase().trim(),
                role: data.role,
                invitedBy: session.user.id,
                expiresAt,
            })
            .returning();

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        const inviteUrl = `${appUrl}/api/tenant/invite/accept?token=${invitation.token}`;

        // Attempt sending email via Resend if API key is configured
        if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_placeholder_for_build") {
            try {
                const [tenant] = await db
                    .select({ name: tenants.name })
                    .from(tenants)
                    .where(eq(tenants.id, session.tenantId))
                    .limit(1);

                const tenantName = tenant?.name || "Workspace";
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "HighReach <onboarding@resend.dev>",
                    to: data.email.toLowerCase().trim(),
                    subject: `You've been invited to join ${tenantName} on HighReach`,
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
                            <h2 style="color: #111; margin-bottom: 16px;">Join ${tenantName} on HighReach</h2>
                            <p style="color: #444; font-size: 15px; line-height: 1.5;">
                                You have been invited to join <strong>${tenantName}</strong> as a <strong>${data.role}</strong>.
                            </p>
                            <div style="margin: 28px 0;">
                                <a href="${inviteUrl}" style="background-color: #d94826; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                                    Accept Invitation
                                </a>
                            </div>
                            <p style="color: #888; font-size: 13px; line-height: 1.4;">
                                This link will expire in 7 days.<br/>
                                Link URL: <a href="${inviteUrl}" style="color: #d94826;">${inviteUrl}</a>
                            </p>
                        </div>
                    `,
                });
            } catch (emailErr) {
                console.warn("Could not dispatch invitation email via Resend:", emailErr);
            }
        }

        revalidatePath("/dashboard/settings/team");
        return { success: true, inviteUrl, token: invitation.token };
    } catch (error: any) {
        if (error.code === "23505") {
            return { success: false, error: "This email has already been invited" };
        }
        return { success: false, error: error.message };
    }
}

/**
 * Remove a team member from the tenant.
 * Requires 'team.remove' permission (owner only).
 */
export async function removeTeamMember(memberId: string) {
    const session = await requirePermission("team.remove");

    const [member] = await db
        .select()
        .from(tenantMembers)
        .where(
            and(
                eq(tenantMembers.id, memberId),
                eq(tenantMembers.tenantId, session.tenantId)
            )
        )
        .limit(1);

    if (!member) {
        return { success: false, error: "Member not found" };
    }

    if (member.userId === session.user.id) {
        return { success: false, error: "Cannot remove yourself" };
    }

    if (member.role === "owner") {
        return { success: false, error: "Cannot remove an owner" };
    }

    try {
        await db.transaction(async (tx) => {
            await tx.delete(tenantMembers).where(eq(tenantMembers.id, memberId));

            await tx
                .delete(users)
                .where(
                    and(
                        eq(users.id, member.userId),
                        eq(users.tenantId, session.tenantId)
                    )
                );
        });

        revalidatePath("/dashboard/settings/team");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Change a team member's role.
 * Requires 'team.change_role' permission (owner only).
 */
export async function changeTeamMemberRole(memberId: string, newRole: AppRole) {
    const session = await requirePermission("team.change_role");

    if (newRole === "owner") {
        return { success: false, error: "Cannot promote to owner" };
    }

    const [member] = await db
        .select()
        .from(tenantMembers)
        .where(
            and(
                eq(tenantMembers.id, memberId),
                eq(tenantMembers.tenantId, session.tenantId)
            )
        )
        .limit(1);

    if (!member) {
        return { success: false, error: "Member not found" };
    }

    if (member.role === "owner") {
        return { success: false, error: "Cannot change owner's role" };
    }

    try {
        await db.transaction(async (tx) => {
            await tx
                .update(tenantMembers)
                .set({ role: newRole, updatedAt: new Date() })
                .where(eq(tenantMembers.id, memberId));

            await tx
                .update(users)
                .set({ role: newRole, updatedAt: new Date() })
                .where(eq(users.id, member.userId));
        });

        revalidatePath("/dashboard/settings/team");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Revoke a pending invitation.
 * Requires 'team.invite' permission.
 */
export async function revokeInvitation(invitationId: string) {
    const session = await requirePermission("team.invite");

    try {
        await db
            .delete(tenantInvitations)
            .where(
                and(
                    eq(tenantInvitations.id, invitationId),
                    eq(tenantInvitations.tenantId, session.tenantId)
                )
            );

        revalidatePath("/dashboard/settings/team");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get all team members and pending invitations for the current tenant.
 */
export async function getTeamData() {
    const session = await requirePermission("team.read");

    const [membersRows, invitationsRows] = await Promise.all([
        db
            .select({
                member: tenantMembers,
                user: users,
            })
            .from(tenantMembers)
            .innerJoin(users, eq(tenantMembers.userId, users.id))
            .where(eq(tenantMembers.tenantId, session.tenantId))
            .orderBy(asc(tenantMembers.createdAt)),

        db
            .select()
            .from(tenantInvitations)
            .where(
                and(
                    eq(tenantInvitations.tenantId, session.tenantId),
                    isNull(tenantInvitations.acceptedAt)
                )
            )
            .orderBy(desc(tenantInvitations.createdAt)),
    ]);

    const members = membersRows.map(({ member, user }) => ({
        id: member.id,
        tenant_id: member.tenantId,
        user_id: member.userId,
        role: member.role as AppRole,
        invited_by: member.invitedBy,
        invited_at: member.invitedAt ? member.invitedAt.toISOString() : null,
        accepted_at: member.acceptedAt ? member.acceptedAt.toISOString() : null,
        created_at: member.createdAt.toISOString(),
        updated_at: member.updatedAt.toISOString(),
        users: {
            email: user.email,
            full_name: user.fullName,
        },
    }));

    const invitations = invitationsRows.map((inv) => ({
        id: inv.id,
        tenant_id: inv.tenantId,
        email: inv.email,
        role: inv.role as AppRole,
        token: inv.token,
        invited_by: inv.invitedBy,
        expires_at: inv.expiresAt.toISOString(),
        accepted_at: inv.acceptedAt ? inv.acceptedAt.toISOString() : null,
        created_at: inv.createdAt.toISOString(),
    }));

    return {
        members,
        invitations,
        currentUserId: session.user.id,
        currentRole: session.role,
    };
}
