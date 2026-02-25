import Link from "next/link";
import Image from "next/image";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="relative z-10 w-full max-w-md">
                <Link href="/" className="flex items-center justify-center gap-2 mb-8 group/logo">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm shadow-primary/20 bg-background flex items-center justify-center p-0.5 border border-border">
                        <Image src="/icon.svg" alt="HighReach Logo" width={36} height={36} className="group-hover/logo:scale-110 transition-transform object-contain" />
                    </div>
                    <span className="text-2xl font-semibold text-foreground tracking-tight">
                        HighReach
                    </span>
                </Link>

                {/* Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-8 shadow-sm">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Create your account</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Start your 14-day free trial</p>
                    </div>

                    <SignupForm />

                    <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:text-primary/80 dark:hover:text-primary/80 font-medium">
                            Sign in
                        </Link>
                    </div>
                </div>

                <p className="text-center text-zinc-500 text-xs mt-6">
                    By signing up, you agree to our{" "}
                    <Link href="/terms" className="underline hover:text-zinc-400 dark:hover:text-zinc-300">Terms</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="underline hover:text-zinc-400 dark:hover:text-zinc-300">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}
