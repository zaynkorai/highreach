"use client";

import { Opportunity, OpportunityStatus } from "@/types/pipeline";
import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import {
    MoreVertical,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Edit3,
    Trash2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OpportunityCardProps {
    opportunity: Opportunity;
    index: number;
    onEdit?: (opportunity: Opportunity) => void;
    onDelete?: (opportunity: Opportunity) => void;
    onStatusChange?: (opportunity: Opportunity, status: OpportunityStatus) => void;
}

export function OpportunityCard({
    opportunity,
    index,
    onEdit,
    onDelete,
    onStatusChange,
}: OpportunityCardProps) {
    const initials = opportunity.contact
        ? (
              (opportunity.contact.first_name?.[0] || "") +
              (opportunity.contact.last_name?.[0] || "")
          ).toUpperCase() || "?"
        : "?";

    const isWon = opportunity.status === "won";
    const isLost = opportunity.status === "lost";

    return (
        <Draggable draggableId={opportunity.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onEdit?.(opportunity)}
                    className={cn(
                        "group bg-white dark:bg-white/[0.03] p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 mb-3 cursor-pointer",
                        snapshot.isDragging &&
                            "shadow-2xl border-zinc-400 dark:border-white/20 rotate-[1deg] scale-[1.02] z-50 bg-zinc-50 dark:bg-zinc-800",
                        isWon && "border-emerald-500/30 bg-emerald-500/[0.02]",
                        isLost && "border-zinc-300 dark:border-white/10 opacity-75"
                    )}
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-[11px] font-black border border-white/10 shadow-lg shrink-0">
                                {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">
                                    {opportunity.contact?.first_name} {opportunity.contact?.last_name}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium">Contact</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {isWon && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" /> Won
                                </span>
                            )}
                            {isLost && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                    <XCircle className="w-3 h-3" /> Lost
                                </span>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md transition-colors hover:bg-zinc-100 dark:hover:bg-white/10"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem onClick={() => onEdit?.(opportunity)} className="gap-2">
                                        <Edit3 className="w-4 h-4" /> Edit Deal
                                    </DropdownMenuItem>
                                    {!isWon && (
                                        <DropdownMenuItem
                                            onClick={() => onStatusChange?.(opportunity, "won")}
                                            className="gap-2 text-emerald-600 dark:text-emerald-400"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Mark as Won
                                        </DropdownMenuItem>
                                    )}
                                    {!isLost && (
                                        <DropdownMenuItem
                                            onClick={() => onStatusChange?.(opportunity, "lost")}
                                            className="gap-2 text-red-600 dark:text-red-400"
                                        >
                                            <XCircle className="w-4 h-4" /> Mark as Lost
                                        </DropdownMenuItem>
                                    )}
                                    {(isWon || isLost) && (
                                        <DropdownMenuItem
                                            onClick={() => onStatusChange?.(opportunity, "open")}
                                            className="gap-2 text-blue-600 dark:text-blue-400"
                                        >
                                            <RotateCcw className="w-4 h-4" /> Reopen Deal
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDelete?.(opportunity)}
                                        className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete Deal
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 leading-tight tracking-tight">
                        {opportunity.title}
                    </h4>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/[0.05]">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Value</span>
                            <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-black text-sm tabular-nums">
                                <span className="text-[10px]">$</span>
                                {Number(opportunity.value || 0).toLocaleString()}
                            </div>
                        </div>

                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {opportunity.contact?.tags?.slice(0, 2).map((tag, i) => (
                                <div
                                    key={tag}
                                    className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-normal border ring-2 ring-white dark:ring-zinc-900",
                                        i === 0
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
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

