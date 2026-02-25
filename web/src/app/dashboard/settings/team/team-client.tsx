"use client";

import { useState } from "react";
import type { AppRole } from "@/lib/types/database";
import {
    inviteTeamMember,
    removeTeamMember,
    changeTeamMemberRole,
    revokeInvitation,
} from "./actions";

interface TeamMember {
    id: string;
    user_id: string;
    role: AppRole;
    created_at: string;
    users: {
        email: string;
        full_name: string | null;
    } | null;
}

interface Invitation {
    id: string;
    email: string;
    role: AppRole;
    expires_at: string;
    created_at: string;
}

interface TeamClientProps {
    members: TeamMember[];
    invitations: Invitation[];
    currentUserId: string;
    currentRole: AppRole;
}

const ROLE_LABELS: Record<AppRole, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
};

const ROLE_COLORS: Record<AppRole, string> = {
    owner: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
    admin: "bg-brand-100 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400",
    member: "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400",
};

export function TeamClient({ members, invitations, currentUserId, currentRole }: TeamClientProps) {
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<AppRole>("member");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    const canInvite = currentRole === "owner" || currentRole === "admin";
    const canManage = currentRole === "owner";

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading("invite");

        const result = await inviteTeamMember({ email: inviteEmail, role: inviteRole });
        if (!result.success) {
            setError(result.error || "Failed to send invitation");
        } else {
            setInviteEmail("");
            setIsInviting(false);
        }
        setLoading(null);
    }

    async function handleRemove(memberId: string) {
        if (!confirm("Are you sure you want to remove this team member?")) return;
        setLoading(memberId);
        const result = await removeTeamMember(memberId);
        if (!result.success) setError(result.error || "Failed to remove member");
        setLoading(null);
    }

    async function handleRoleChange(memberId: string, newRole: AppRole) {
        setLoading(memberId);
        const result = await changeTeamMemberRole(memberId, newRole);
        if (!result.success) setError(result.error || "Failed to change role");
        setLoading(null);
    }

    async function handleRevokeInvite(invitationId: string) {
        setLoading(invitationId);
        const result = await revokeInvitation(invitationId);
        if (!result.success) setError(result.error || "Failed to revoke invitation");
        setLoading(null);
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
                </div>
            )}

            {/* Invite Button */}
            {canInvite && !isInviting && (
                <button
                    onClick={() => setIsInviting(true)}
                    className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-primary/20 active:scale-95"
                >
                    Invite Team Member
                </button>
            )}

            {/* Invite Form */}
            {isInviting && (
                <form onSubmit={handleInvite} className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                            <input
                                type="email"
                                required
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="teammate@company.com"
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</label>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as AppRole)}
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option value="member">Member</option>
                                {currentRole === "owner" && <option value="admin">Admin</option>}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading === "invite"}
                            className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-primary/20 disabled:opacity-50"
                        >
                            {loading === "invite" ? "Sending..." : "Send Invite"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsInviting(false)}
                            className="px-4 py-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Members List */}
            <div className="space-y-1">
                {members.map((member) => {
                    const isCurrentUser = member.user_id === currentUserId;
                    const isOwner = member.role === "owner";

                    return (
                        <div
                            key={member.id}
                            className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center text-sm font-bold">
                                    {(member.users?.full_name?.[0] || member.users?.email?.[0] || "?").toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-foreground">
                                        {member.users?.full_name || "Unnamed"}
                                        {isCurrentUser && (
                                            <span className="ml-2 text-xs text-zinc-400">(you)</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {member.users?.email}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {canManage && !isOwner && !isCurrentUser ? (
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member.id, e.target.value as AppRole)}
                                        disabled={loading === member.id}
                                        className="bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                ) : (
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                                        {ROLE_LABELS[member.role]}
                                    </span>
                                )}

                                {canManage && !isOwner && !isCurrentUser && (
                                    <button
                                        onClick={() => handleRemove(member.id)}
                                        disabled={loading === member.id}
                                        className="text-red-500 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
                                        title="Remove member"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Pending Invitations
                    </h3>
                    {invitations.map((inv) => (
                        <div
                            key={inv.id}
                            className="flex items-center justify-between py-3 px-4 rounded-lg bg-zinc-50 dark:bg-white/[0.02] border border-dashed border-zinc-200 dark:border-white/[0.08]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-foreground">{inv.email}</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Invited as {ROLE_LABELS[inv.role]} · Expires {new Date(inv.expires_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            {canInvite && (
                                <button
                                    onClick={() => handleRevokeInvite(inv.id)}
                                    disabled={loading === inv.id}
                                    className="text-sm text-red-500 hover:text-red-600 underline disabled:opacity-50"
                                >
                                    Revoke
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
