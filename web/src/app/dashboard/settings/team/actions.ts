"use server";

import { requirePermission } from "@/lib/rbac/guard";
import { db, tenantMembers, tenantInvitations, users } from "@/lib/db";
import { eq, and, isNull, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { AppRole } from "@/lib/types/database";

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

        await db.insert(tenantInvitations).values({
            tenantId: session.tenantId,
            email: data.email.toLowerCase().trim(),
            role: data.role,
            invitedBy: session.user.id,
            expiresAt,
        });

        // TODO: Send invitation email via Resend

        revalidatePath("/dashboard/settings/team");
        return { success: true };
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
