"use server";

import { requirePermission, requireAuth } from "@/lib/rbac/guard";
import { createAdminClient } from "@/lib/supabase/admin";
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

    // Owners cannot be bulk-invited
    if (data.role === "owner") {
        return { success: false, error: "Cannot invite as owner" };
    }

    // Admins can only invite members, not other admins
    if (session.role === "admin" && data.role === "admin") {
        return { success: false, error: "Only owners can invite admins" };
    }

    const { error } = await session.supabase
        .from("tenant_invitations")
        .insert({
            tenant_id: session.tenantId,
            email: data.email.toLowerCase().trim(),
            role: data.role,
            invited_by: session.user.id,
        });

    if (error) {
        if (error.code === "23505") {
            return { success: false, error: "This email has already been invited" };
        }
        return { success: false, error: error.message };
    }

    // TODO: Send invitation email via Resend

    revalidatePath("/dashboard/settings/team");
    return { success: true };
}

/**
 * Remove a team member from the tenant.
 * Requires 'team.remove' permission (owner only).
 */
export async function removeTeamMember(memberId: string) {
    const session = await requirePermission("team.remove");

    // Cannot remove yourself
    const { data: member } = await session.supabase
        .from("tenant_members")
        .select("user_id, role")
        .eq("id", memberId)
        .single();

    if (!member) {
        return { success: false, error: "Member not found" };
    }

    if (member.user_id === session.user.id) {
        return { success: false, error: "Cannot remove yourself" };
    }

    // Cannot remove another owner
    if (member.role === "owner") {
        return { success: false, error: "Cannot remove an owner" };
    }

    const { error } = await session.supabase
        .from("tenant_members")
        .delete()
        .eq("id", memberId);

    if (error) return { success: false, error: error.message };

    // Also remove from users table
    const adminClient = createAdminClient();
    await adminClient
        .from("users")
        .delete()
        .eq("id", member.user_id)
        .eq("tenant_id", session.tenantId);

    revalidatePath("/dashboard/settings/team");
    return { success: true };
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

    const { data: member } = await session.supabase
        .from("tenant_members")
        .select("user_id, role")
        .eq("id", memberId)
        .single();

    if (!member) {
        return { success: false, error: "Member not found" };
    }

    if (member.role === "owner") {
        return { success: false, error: "Cannot change owner's role" };
    }

    const { error } = await session.supabase
        .from("tenant_members")
        .update({ role: newRole })
        .eq("id", memberId);

    if (error) return { success: false, error: error.message };

    // Also update legacy users.role column
    await session.supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", member.user_id);

    revalidatePath("/dashboard/settings/team");
    return { success: true };
}

/**
 * Revoke a pending invitation.
 * Requires 'team.invite' permission.
 */
export async function revokeInvitation(invitationId: string) {
    const session = await requirePermission("team.invite");

    const { error } = await session.supabase
        .from("tenant_invitations")
        .delete()
        .eq("id", invitationId)
        .eq("tenant_id", session.tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/settings/team");
    return { success: true };
}

/**
 * Get all team members and pending invitations for the current tenant.
 */
export async function getTeamData() {
    const session = await requirePermission("team.read");

    const [membersResult, invitationsResult] = await Promise.all([
        session.supabase
            .from("tenant_members")
            .select("*, users(email, full_name)")
            .eq("tenant_id", session.tenantId)
            .order("created_at", { ascending: true }),
        session.supabase
            .from("tenant_invitations")
            .select("*")
            .eq("tenant_id", session.tenantId)
            .is("accepted_at", null)
            .order("created_at", { ascending: false }),
    ]);

    return {
        members: membersResult.data || [],
        invitations: invitationsResult.data || [],
        currentUserId: session.user.id,
        currentRole: session.role,
    };
}
