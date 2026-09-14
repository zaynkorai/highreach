"use client";

import { useState } from "react";
import type { UserProfileData } from "../actions";
import { updateUserProfile, changeUserPassword } from "../actions";
import { toast } from "sonner";
import { User, Lock, Mail, Shield, Building, Calendar, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AccountClient({ initialUser }: { initialUser: UserProfileData }) {
    // Profile form state
    const [fullName, setFullName] = useState(initialUser.fullName || "");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) {
            toast.error("Full name cannot be empty");
            return;
        }

        setIsUpdatingProfile(true);
        try {
            const res = await updateUserProfile({ fullName });
            if (res.success) {
                toast.success("Personal profile updated successfully!");
            } else {
                toast.error(res.error || "Failed to update profile");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            toast.error("New password must be at least 8 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setIsChangingPassword(true);
        try {
            const res = await changeUserPassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });

            if (res.success) {
                toast.success("Password changed successfully!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast.error(res.error || "Failed to change password");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setIsChangingPassword(false);
        }
    };

    const roleBadgeStyles: Record<string, string> = {
        owner: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
        admin: "bg-brand-100 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-500/20",
        member: "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10",
    };

    return (
        <div className="space-y-6">
            {/* User Overview & Profile Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Personal Profile
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Manage your user account credentials and personal details.
                    </p>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    {/* User Identity Banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xl font-bold border border-brand-200/60 dark:border-brand-500/20">
                                {(fullName?.[0] || initialUser.email?.[0] || "U").toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-foreground text-base">
                                        {fullName || "Unnamed User"}
                                    </h3>
                                    <Badge variant="outline" className={`capitalize text-xs font-semibold px-2 py-0.5 ${roleBadgeStyles[initialUser.role] || roleBadgeStyles.member}`}>
                                        {initialUser.role}
                                    </Badge>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                    <Mail className="w-3.5 h-3.5" />
                                    {initialUser.email}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200/80 dark:border-white/10">
                                <Building className="w-3.5 h-3.5 text-zinc-400" />
                                <span>{initialUser.tenantName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200/80 dark:border-white/10">
                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Joined {new Date(initialUser.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Edit Profile Form */}
                    <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Your Full Name"
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Email Address (Login Identity)
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={initialUser.email}
                                    className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                                />
                                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                    Email address is locked to your organization account.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                disabled={isUpdatingProfile}
                                className="bg-primary hover:opacity-90 text-white shadow-sm shadow-primary/20"
                            >
                                {isUpdatingProfile ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-1.5" />
                                        Update Name
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Password & Security Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        Security & Password
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Ensure your account is protected with a secure password.
                    </p>
                </div>

                <div className="p-6 md:p-8">
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Current Password
                            </label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat new password"
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isChangingPassword}
                                variant="outline"
                                className="border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5"
                            >
                                {isChangingPassword ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Changing Password...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-1.5" />
                                        Update Password
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
