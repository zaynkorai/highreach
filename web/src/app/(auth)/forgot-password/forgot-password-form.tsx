"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const res = await requestPasswordResetAction(formData);

        if (!res.success) {
            setError(res.error || "Failed to send reset link");
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
        setIsSubmitted(true);
    }

    if (isSubmitted) {
        return (
            <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-foreground">Check your email</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        If an account exists with that email, we&apos;ve sent instructions to reset your password.
                    </p>
                </div>
                <div className="pt-2">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email Address
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl transition-all text-sm shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Sending link..." : "Send Reset Link"}
            </button>

            <div className="pt-2 text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Link>
            </div>
        </form>
    );
}
