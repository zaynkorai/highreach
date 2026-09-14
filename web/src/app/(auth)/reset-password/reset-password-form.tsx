"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/lib/auth/actions";
import { AlertCircle } from "lucide-react";

export function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-foreground">Missing Reset Token</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        The password reset link is invalid or incomplete.
                    </p>
                </div>
                <div className="pt-2">
                    <Link
                        href="/forgot-password"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        Request a new reset link
                    </Link>
                </div>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            setIsLoading(false);
            return;
        }

        const res = await resetPasswordAction(formData);

        if (!res.success) {
            setError(res.error || "Failed to reset password");
            setIsLoading(false);
            return;
        }

        // Hard redirect to dashboard to ensure cookies and fresh state are recognized
        window.location.href = "/dashboard";
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    New Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Confirm New Password
                </label>
                <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl transition-all text-sm shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Resetting password..." : "Set New Password"}
            </button>
        </form>
    );
}
