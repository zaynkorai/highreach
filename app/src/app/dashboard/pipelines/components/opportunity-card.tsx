"use client";

import { Opportunity } from "@/types/pipeline";
import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MessageSquare, MoreVertical, User } from "lucide-react";

interface OpportunityCardProps {
    opportunity: Opportunity;
    index: number;
}

export function OpportunityCard({ opportunity, index }: OpportunityCardProps) {
    const initials = opportunity.contact
        ? (opportunity.contact.first_name[0] + (opportunity.contact.last_name?.[0] || "")).toUpperCase()
        : "?";

    return (
        <Draggable draggableId={opportunity.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                        "group bg-white dark:bg-white/[0.03] p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 mb-3",
                        snapshot.isDragging && "shadow-2xl border-zinc-400 dark:border-white/20 rotate-[1deg] scale-[1.02] z-50 bg-zinc-50 dark:bg-zinc-800"
                    )}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-[11px] font-black border border-white/10 shadow-lg">
                                {initials}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                                    {opportunity.contact?.first_name} {opportunity.contact?.last_name}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium">Contact</span>
                            </div>
                        </div>
                        <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md transition-colors">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 leading-tight tracking-tight">
                        {opportunity.title}
                    </h4>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/[0.05]">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Value</span>
                            <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-black text-sm tabular-nums">
                                <span className="text-[10px]">$</span>
                                {opportunity.value.toLocaleString()}
                            </div>
                        </div>

                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {opportunity.contact?.tags?.slice(0, 2).map((tag, i) => (
                                <div
                                    key={tag}
                                    className={cn(
                                        "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ring-2 ring-white dark:ring-zinc-900",
                                        i === 0
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                    )}
                                >
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
