import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">


            <div className="relative z-10 w-full max-w-md">
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400 flex items-center justify-center">
                        <span className="text-black font-black text-lg">G</span>
                    </div>
                    <span className="text-xl font-semibold text-foreground">
                        GHL<span className="text-emerald-400">Lite</span>
                    </span>
                </Link>

                {/* Card */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm dark:shadow-none">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">Sign in to your account</p>
                    </div>

                    <LoginForm />

                    <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-400 dark:hover:text-emerald-300 font-medium">
                            Sign up free
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
