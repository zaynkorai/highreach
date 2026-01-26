"use client";

import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle, Sparkles, LayoutDashboard } from "lucide-react";

export function Step3({ onNext, isSubmitting }: { onNext: () => void, isSubmitting: boolean }) {
    return (
        <div className="space-y-8 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/40 rotate-12 group hover:rotate-0 transition-all">
                    <Rocket className="text-white w-12 h-12" />
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tight">You&apos;re all set!</h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Your personal Galaxy workspace is ready for liftoff.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-md mx-auto py-6">
                {[
                    { title: "Unified Inbox Configured", icon: CheckCircle },
                    { title: "Smart CRM Active", icon: CheckCircle },
                    { title: "Pipeline Ready", icon: CheckCircle },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-white/[0.05]">
                        <item.icon className="w-5 h-5 text-emerald-500" />
                        <span className="font-bold text-sm text-zinc-700 dark:text-zinc-300">{item.title}</span>
                    </div>
                ))}
            </div>

            <div className="pt-4">
                <Button
                    onClick={onNext}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black gap-3 text-base uppercase tracking-widest shadow-xl shadow-indigo-500/30 group relative overflow-hidden"
                    disabled={isSubmitting}
                >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 slant" />
                    <span className="relative z-10 flex items-center gap-3">
                        <LayoutDashboard className="w-5 h-5" />
                        Go to My Dashboard
                    </span>
                </Button>
                <p className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Taking you to the command center
                </p>
            </div>
        </div>
    );
}
