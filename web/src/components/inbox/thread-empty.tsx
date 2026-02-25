import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreadEmptyProps {
    className?: string;
}

export function ThreadEmpty({ className }: ThreadEmptyProps) {
    return (
        <div className={cn(
            "flex-1 flex flex-col items-center justify-center text-zinc-400 gap-6 bg-zinc-50/10 dark:bg-zinc-950/20",
            className
        )}>
            <div className="relative">
                <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full" />
                <div className="relative p-10 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl">
                    <MessageSquare className="h-12 w-12 text-brand-500/40" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white uppercase">Unified Inbox</h3>
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Select lead to resume sync</p>
            </div>
        </div>
    );
}
