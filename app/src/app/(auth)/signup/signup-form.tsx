"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Map Supabase error messages to user-friendly messages
function getReadableError(message: string): string {
    const errorMap: Record<string, string> = {
        "Invalid login credentials": "Incorrect email or password",
        "Email not confirmed": "Please check your email to confirm your account",
        "User already registered": "An account with this email already exists",
        "Password should be at least 6 characters": "Password must be at least 8 characters",
        "Unable to validate email address: invalid format": "Please enter a valid email address",
        "Email rate limit exceeded": "Too many attempts. Please wait a few minutes and try again.",
        "over_email_send_rate_limit": "Too many attempts. Please wait a few minutes and try again.",
        "Signup requires a valid password": "Please enter a password",
        "Anonymous sign-ins are disabled": "Please enter your email and password",
    };

    // Check for partial matches
    for (const [key, value] of Object.entries(errorMap)) {
        if (message.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    // Check for rate limit
    if (message.toLowerCase().includes("rate limit")) {
        return "Too many attempts. Please wait a few minutes and try again.";
    }

    // Check for invalid email
    if (message.toLowerCase().includes("invalid") && message.toLowerCase().includes("email")) {
        return "Please enter a valid email address (e.g., name@company.com)";
    }

    return message;
}

export function SignupForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const businessName = formData.get("businessName") as string;

        const supabase = createClient();

        // 1. Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    business_name: businessName,
                },
            },
        });

        if (authError) {
            setError(getReadableError(authError.message));
            setIsLoading(false);
            return;
        }

        if (!authData.user) {
            setError("Failed to create account");
            setIsLoading(false);
            return;
        }

        // Auto-login to ensure session is active before tenant creation
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (loginError) {
            // If auto-login fails, they might need email confirmation
            setError("Please check your email to confirm your account");
            setIsLoading(false);
            return;
        }

        // 2. Create tenant and profile in one transaction
        const { error: rpcError } = await supabase.rpc("create_tenant_and_user", {
            business_name: businessName,
            full_name: businessName,
        });

        if (rpcError) {
            console.error("Setup error:", rpcError);
            setError(`Failed to create organization: ${rpcError.message}`);
            setIsLoading(false);
            return;
        }

        // Success - hard redirect to ensure cookies are set
        window.location.href = "/dashboard";
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Business Name
                </label>
                <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    placeholder="Mike's Plumbing"
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-foreground dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-foreground dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-foreground dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                />
                <p className="text-zinc-500 text-xs mt-1">Minimum 8 characters</p>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Creating account..." : "Start Free Trial"}
            </button>
        </form>
    );
}
