"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Map Supabase error messages to user-friendly messages
function getReadableError(message: string): string {
    const errorMap: Record<string, string> = {
        "Invalid login credentials": "Incorrect email or password",
        "Email not confirmed": "Please check your email to confirm your account",
        "invalid_credentials": "Incorrect email or password",
    };

    for (const [key, value] of Object.entries(errorMap)) {
        if (message.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    if (message.toLowerCase().includes("rate limit")) {
        return "Too many attempts. Please wait a few minutes and try again.";
    }

    return message;
}

export function LoginForm() {
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

        const supabase = createClient();

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(getReadableError(authError.message));
            setIsLoading(false);
            return;
        }

        router.push("/dashboard");
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
                    {error}
                </div>
            )}

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
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Signing in..." : "Sign In"}
            </button>
        </form>
    );
}
