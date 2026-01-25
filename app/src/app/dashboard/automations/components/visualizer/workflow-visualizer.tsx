
"use client";

import { MessageSquare, PhoneMissed, Star, Trophy, ArrowRight, Clock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowStep {
    id: string;
    type: "trigger" | "action" | "delay";
    label: string;
    icon: any;
    config?: Record<string, any>;
}

interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
}

// Helper to map string to icon
const getIconResult = (iconName: string) => {
    switch (iconName) {
        case "PhoneMissed": return <PhoneMissed className="w-4 h-4" />;
        case "MessageSquare": return <MessageSquare className="w-4 h-4" />;
        case "Clock": return <Clock className="w-4 h-4" />;
        case "Trophy": return <Trophy className="w-4 h-4" />;
        case "Mail": return <Mail className="w-4 h-4" />;
        case "Star": return <Star className="w-4 h-4" />;
        default: return <ArrowRight className="w-4 h-4" />;
    }
}

export function WorkflowVisualizer({ workflow }: { workflow: WorkflowDefinition }) {
    return (
        <div className="relative flex flex-col gap-4 p-8 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-white/5">
            <div className="absolute left-12 top-8 bottom-8 w-0.5 bg-zinc-200 dark:bg-white/10" />

            {workflow.steps.map((step, index) => (
                <div key={step.id} className="relative z-10 flex items-start gap-4 group">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm transition-all",
                        step.type === 'trigger'
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-400"
                            : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-white/10 dark:text-zinc-400"
                    )}>
                        {getIconResult(step.icon)}
                    </div>

                    <div className="flex-1 pt-1.5">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{step.type}</span>
                            {step.type === 'delay' && <span className="text-[10px] bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-foreground font-mono">{step.config?.duration}</span>}
                        </div>
                        <h4 className="text-sm font-medium text-foreground">{step.label}</h4>
                        {step.config?.template && (
                            <div className="mt-2 p-3 bg-white dark:bg-black/40 border border-zinc-100 dark:border-white/5 rounded-md text-xs text-muted-foreground font-mono">
                                {step.config.template}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
