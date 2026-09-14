import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Reset Password | HighReach",
    description: "Create a new password for your HighReach account",
};

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="relative z-10 w-full max-w-md">
                <Link href="/" className="flex items-center justify-center gap-2 mb-8 group/logo">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm shadow-primary/20 bg-background flex items-center justify-center p-0.5 border border-border">
                        <Image src="/icon.svg" alt="HighReach Logo" width={36} height={36} className="group-hover/logo:scale-110 transition-transform object-contain" />
                    </div>
                    <span className="text-2xl font-extrabold text-foreground tracking-tight">
                        HighReach
                    </span>
                </Link>

                {/* Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-8 shadow-sm">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Create new password</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                            Enter your new password below
                        </p>
                    </div>

                    <Suspense fallback={<div className="h-48 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
