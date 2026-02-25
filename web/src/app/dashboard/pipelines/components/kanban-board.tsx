"use client";

import { useMemo } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { usePipelineStore, usePipelineActions } from "@/stores/pipeline-store";
import { OpportunityCard } from "./opportunity-card";
import { moveOpportunity } from "../actions";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpportunityModal } from "./opportunity-modal";
import { useState } from "react";
import { Opportunity } from "@/types/pipeline";
import { Contact } from "@/types/contact";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
    contacts: Contact[];
}

export function KanbanBoard({ contacts }: KanbanBoardProps) {
    const pipelines = usePipelineStore((state) => state.pipelines);
    const activePipelineId = usePipelineStore((state) => state.activePipelineId);
    const opportunities = usePipelineStore((state) => state.opportunities);
    const { updateOpportunity, setActivePipelineId, addOpportunity } = usePipelineActions();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStageId, setSelectedStageId] = useState<string | undefined>();

    const openModal = (stageId?: string) => {
        setSelectedStageId(stageId);
        setIsModalOpen(true);
    };

    const activePipeline = useMemo(() =>
        pipelines.find(p => p.id === activePipelineId),
        [pipelines, activePipelineId]);

    const stagesWithOpportunities = useMemo(() => {
        if (!activePipeline) return [];
        return activePipeline.stages.map(stage => ({
            ...stage,
            opportunities: opportunities
                .filter(o => o.pipeline_stage_id === stage.id)
                .sort((a, b) => a.order_index - b.order_index),
            totalValue: opportunities
                .filter(o => o.pipeline_stage_id === stage.id)
                .reduce((sum, o) => sum + Number(o.value), 0)
        }));
    }, [activePipeline, opportunities]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Optimistic update
        const originalStageId = source.droppableId;
        const newStageId = destination.droppableId;
        const newIndex = destination.index;

        updateOpportunity(draggableId, {
            pipeline_stage_id: newStageId,
            order_index: newIndex
        });

        try {
            const res = await moveOpportunity(draggableId, newStageId, newIndex);
            if (!res.success) {
                toast.error(res.error || "Failed to move opportunity");
                // Rollback would happen on next refresh/fetch, but for now we trust the server action
            }
        } catch (error) {
            toast.error("Failed to move opportunity");
        }
    };

    if (!activePipeline) return null;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header / Pipeline Switcher */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-100 dark:border-white/[0.05] shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Pipelines</h1>
                        <div className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase tracking-wider border border-brand-500/20 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-brand-500 animate-pulse" />
                            Live
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500">Manage and track your deals across custom stages.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-zinc-100 dark:bg-white/[0.03] p-1 rounded-xl border border-zinc-200 dark:border-white/[0.08]">
                        {pipelines.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActivePipelineId(p.id)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    activePipelineId === p.id
                                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-white/10"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                )}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>

                    <Button
                        onClick={() => openModal()}
                        className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity gap-2 h-10 px-5 rounded-xl shadow-xl shadow-zinc-500/10"
                    >
                        <Plus className="w-4 h-4" /> New Opportunity
                    </Button>
                </div>
            </div>

            {/* Opportunity Modal */}
            <OpportunityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                contacts={contacts}
                stages={activePipeline.stages}
                onSuccess={(newOp) => addOpportunity(newOp)}
                defaultStageId={selectedStageId}
            />

            {/* Board Container */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 flex gap-6 overflow-x-auto pb-8 custom-scrollbar -mx-8 px-8">
                    {stagesWithOpportunities.map((stage) => (
                        <div key={stage.id} className="w-80 shrink-0 flex flex-col">
                            {/* Stage Header */}
                            <div className="flex items-center justify-between mb-5 group h-10">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                                            {stage.name}
                                        </h3>
                                        <div className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 border border-zinc-200 dark:border-white/10">
                                            {stage.opportunities.length}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                                        ${stage.totalValue.toLocaleString()} Total
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Droppable Column */}
                            <Droppable droppableId={stage.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn(
                                            "flex-1 rounded-2xl p-3 transition-all duration-300 min-h-[50vh]",
                                            snapshot.isDraggingOver
                                                ? "bg-zinc-100/80 dark:bg-white/[0.04] ring-2 ring-zinc-200 dark:ring-white/10"
                                                : "bg-zinc-50/50 dark:bg-white/[0.02] border border-transparent hover:border-zinc-200 dark:hover:border-white/5"
                                        )}
                                    >
                                        <div className="space-y-3">
                                            {stage.opportunities.map((opportunity, index) => (
                                                <OpportunityCard
                                                    key={opportunity.id}
                                                    opportunity={opportunity}
                                                    index={index}
                                                />
                                            ))}
                                            {provided.placeholder}
                                        </div>

                                        {/* Quick Add Button */}
                                        <button
                                            onClick={() => openModal(stage.id)}
                                            className="w-full py-3 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-white/20 hover:bg-white dark:hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider mt-4"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Record Deal
                                        </button>
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
