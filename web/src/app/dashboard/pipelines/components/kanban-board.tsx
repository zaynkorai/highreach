"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { usePipelineStore, usePipelineActions } from "@/stores/pipeline-store";
import { OpportunityCard } from "./opportunity-card";
import {
    getOpportunities,
    moveOpportunity,
    updateOpportunityStatus,
    deleteOpportunity,
    deletePipeline,
    deleteStage,
} from "../actions";
import { toast } from "sonner";
import { Plus, MoreVertical, Edit2, Trash2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpportunityModal } from "./opportunity-modal";
import {
    CreatePipelineDialog,
    RenamePipelineDialog,
    CreateStageDialog,
    RenameStageDialog,
    ConfirmDeleteDialog,
} from "./pipeline-dialogs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Opportunity, OpportunityStatus, PipelineStage } from "@/types/pipeline";
import { Contact } from "@/types/contact";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
    contacts: Contact[];
}

type DeleteTarget =
    | { type: "opportunity"; id: string; name: string }
    | { type: "stage"; id: string; name: string }
    | { type: "pipeline"; id: string; name: string }
    | null;

export function KanbanBoard({ contacts }: KanbanBoardProps) {
    const router = useRouter();

    const pipelines = usePipelineStore((state) => state.pipelines);
    const activePipelineId = usePipelineStore((state) => state.activePipelineId);
    const opportunities = usePipelineStore((state) => state.opportunities);
    const {
        setActivePipelineId,
        setOpportunities,
        addOpportunity,
        updateOpportunity,
        removeOpportunity,
        moveOpportunityInStore,
        removePipeline,
        removeStage,
    } = usePipelineActions();

    // Dialog States
    const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
    const [selectedStageId, setSelectedStageId] = useState<string | undefined>();

    const [isCreatePipelineOpen, setIsCreatePipelineOpen] = useState(false);
    const [isRenamePipelineOpen, setIsRenamePipelineOpen] = useState(false);

    const [isCreateStageOpen, setIsCreateStageOpen] = useState(false);
    const [renameStageTarget, setRenameStageTarget] = useState<PipelineStage | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [isLoadingPipelineData, setIsLoadingPipelineData] = useState(false);

    const activePipeline = useMemo(
        () => pipelines.find((p) => p.id === activePipelineId) || pipelines[0],
        [pipelines, activePipelineId]
    );

    const stagesWithOpportunities = useMemo(() => {
        if (!activePipeline) return [];
        return activePipeline.stages.map((stage) => ({
            ...stage,
            opportunities: opportunities
                .filter((o) => o.pipeline_stage_id === stage.id)
                .sort((a, b) => a.order_index - b.order_index),
            totalValue: opportunities
                .filter((o) => o.pipeline_stage_id === stage.id)
                .reduce((sum, o) => sum + Number(o.value || 0), 0),
        }));
    }, [activePipeline, opportunities]);

    // Switch pipeline with data fetching
    const handleSwitchPipeline = async (pipelineId: string) => {
        if (pipelineId === activePipelineId) return;

        setActivePipelineId(pipelineId);
        router.replace(`/dashboard/pipelines?pipelineId=${pipelineId}`, { scroll: false });

        setIsLoadingPipelineData(true);
        try {
            const res = await getOpportunities(pipelineId);
            if (res.success) {
                setOpportunities(res.data as Opportunity[]);
            } else {
                toast.error(res.error || "Failed to load opportunities");
            }
        } catch {
            toast.error("Failed to load pipeline opportunities");
        } finally {
            setIsLoadingPipelineData(false);
        }
    };

    // Open Opportunity Modal for Create or Edit
    const handleOpenOpportunityModal = (opp?: Opportunity, stageId?: string) => {
        if (opp) {
            setEditingOpportunity(opp);
            setSelectedStageId(opp.pipeline_stage_id);
        } else {
            setEditingOpportunity(null);
            setSelectedStageId(stageId);
        }
        setIsOpportunityModalOpen(true);
    };

    const handleOpportunitySuccess = (savedOpp: Opportunity) => {
        if (editingOpportunity) {
            updateOpportunity(savedOpp.id, savedOpp);
        } else {
            addOpportunity(savedOpp);
        }
    };

    // Status change quick action
    const handleStatusChange = async (opp: Opportunity, status: OpportunityStatus) => {
        const prevStatus = opp.status;
        updateOpportunity(opp.id, { status });

        try {
            const res = await updateOpportunityStatus(opp.id, status);
            if (res.success) {
                toast.success(`Deal marked as ${status === "won" ? "Closed Won" : status === "lost" ? "Closed Lost" : "Open"}`);
            } else {
                updateOpportunity(opp.id, { status: prevStatus });
                toast.error(res.error || "Failed to update deal status");
            }
        } catch {
            updateOpportunity(opp.id, { status: prevStatus });
            toast.error("Failed to update deal status");
        }
    };

    // Drag & Drop
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStageId = destination.droppableId;
        const newIndex = destination.index;

        // Optimistic store update
        moveOpportunityInStore(draggableId, newStageId, newIndex);

        try {
            const res = await moveOpportunity(draggableId, newStageId, newIndex);
            if (!res.success) {
                toast.error(res.error || "Failed to move opportunity");
                if (activePipeline) {
                    const reload = await getOpportunities(activePipeline.id);
                    if (reload.success) setOpportunities(reload.data as Opportunity[]);
                }
            }
        } catch {
            toast.error("Failed to move opportunity");
            if (activePipeline) {
                const reload = await getOpportunities(activePipeline.id);
                if (reload.success) setOpportunities(reload.data as Opportunity[]);
            }
        }
    };

    // Confirm Delete Execution
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === "opportunity") {
            try {
                const res = await deleteOpportunity(deleteTarget.id);
                if (res.success) {
                    removeOpportunity(deleteTarget.id);
                    toast.success("Deal deleted");
                } else {
                    toast.error(res.error || "Failed to delete deal");
                }
            } catch {
                toast.error("Failed to delete deal");
            }
        } else if (deleteTarget.type === "stage" && activePipeline) {
            try {
                const res = await deleteStage(deleteTarget.id);
                if (res.success) {
                    removeStage(activePipeline.id, deleteTarget.id);
                    toast.success("Stage deleted");
                } else {
                    toast.error(res.error || "Failed to delete stage");
                }
            } catch (err: any) {
                toast.error(err?.message || "Failed to delete stage");
            }
        } else if (deleteTarget.type === "pipeline") {
            if (pipelines.length <= 1) {
                toast.error("Cannot delete the only pipeline in your workspace.");
                return;
            }
            try {
                const res = await deletePipeline(deleteTarget.id);
                if (res.success) {
                    removePipeline(deleteTarget.id);
                    toast.success("Pipeline deleted");
                    const remaining = pipelines.filter((p) => p.id !== deleteTarget.id);
                    if (remaining[0]) {
                        handleSwitchPipeline(remaining[0].id);
                    }
                } else {
                    toast.error(res.error || "Failed to delete pipeline");
                }
            } catch {
                toast.error("Failed to delete pipeline");
            }
        }
    };

    if (!activePipeline) return null;

    return (
        <div className="flex flex-col h-full w-full min-w-0">
            {/* Header / Pipeline Switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-100 dark:border-white/[0.05] shrink-0 w-full min-w-0">
                <div className="flex flex-col gap-1 shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Pipelines</h1>
                    </div>
                    <p className="text-sm text-zinc-500">Manage and track your deals across custom stages.</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full lg:w-auto min-w-0">
                    {/* Pipeline Tabs */}
                    <div className="flex items-center overflow-x-auto min-w-0 max-w-full bg-zinc-100 dark:bg-white/[0.03] p-1 rounded-xl border border-zinc-200 dark:border-white/[0.08] custom-scrollbar">
                        {pipelines.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => handleSwitchPipeline(p.id)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0",
                                    activePipeline.id === p.id
                                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-white/10"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                )}
                            >
                                {p.name}
                            </button>
                        ))}

                        {/* Active Pipeline Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors shrink-0"
                                >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => setIsRenamePipelineOpen(true)} className="gap-2">
                                    <Edit2 className="w-4 h-4" /> Rename Pipeline
                                </DropdownMenuItem>
                                {pipelines.length > 1 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setDeleteTarget({
                                                    type: "pipeline",
                                                    id: activePipeline.id,
                                                    name: activePipeline.name,
                                                })
                                            }
                                            className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete Pipeline
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* New Pipeline Button */}
                        <button
                            type="button"
                            onClick={() => setIsCreatePipelineOpen(true)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors ml-1 shrink-0"
                            title="New Pipeline"
                        >
                            <FolderPlus className="w-4 h-4" />
                        </button>
                    </div>

                    <Button
                        onClick={() => handleOpenOpportunityModal()}
                        className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity gap-2 h-10 px-5 rounded-xl shadow-xl shadow-zinc-500/10 shrink-0 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" /> New Opportunity
                    </Button>
                </div>
            </div>

            {/* Opportunity Modal (Create / Edit) */}
            <OpportunityModal
                isOpen={isOpportunityModalOpen}
                onClose={() => {
                    setIsOpportunityModalOpen(false);
                    setEditingOpportunity(null);
                }}
                contacts={contacts}
                stages={activePipeline.stages}
                onSuccess={handleOpportunitySuccess}
                defaultStageId={selectedStageId}
                opportunity={editingOpportunity}
            />

            {/* Pipeline Dialogs */}
            <CreatePipelineDialog
                isOpen={isCreatePipelineOpen}
                onClose={() => setIsCreatePipelineOpen(false)}
                onSuccess={(newId) => handleSwitchPipeline(newId)}
            />

            <RenamePipelineDialog
                isOpen={isRenamePipelineOpen}
                onClose={() => setIsRenamePipelineOpen(false)}
                pipelineId={activePipeline.id}
                currentName={activePipeline.name}
            />

            <CreateStageDialog
                isOpen={isCreateStageOpen}
                onClose={() => setIsCreateStageOpen(false)}
                pipelineId={activePipeline.id}
            />

            {renameStageTarget && (
                <RenameStageDialog
                    isOpen={Boolean(renameStageTarget)}
                    onClose={() => setRenameStageTarget(null)}
                    stageId={renameStageTarget.id}
                    currentName={renameStageTarget.name}
                />
            )}

            {deleteTarget && (
                <ConfirmDeleteDialog
                    isOpen={Boolean(deleteTarget)}
                    onClose={() => setDeleteTarget(null)}
                    title={`Delete ${deleteTarget.type === "opportunity" ? "Deal" : deleteTarget.type === "stage" ? "Stage" : "Pipeline"}`}
                    description={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
                    onConfirm={handleConfirmDelete}
                />
            )}

            {/* Board Container */}
            <div className={cn("flex-1 flex gap-6 overflow-x-auto pb-8 custom-scrollbar w-full min-w-0", isLoadingPipelineData && "opacity-50 pointer-events-none")}>
                <DragDropContext onDragEnd={onDragEnd}>
                    {stagesWithOpportunities.map((stage) => (
                        <div key={stage.id} className="w-80 shrink-0 flex flex-col">
                            {/* Stage Header */}
                            <div className="flex items-center justify-between mb-5 group h-10">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest truncate max-w-[170px]">
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

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleOpenOpportunityModal(undefined, stage.id)}
                                        className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                        title="Add deal to this stage"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem
                                                onClick={() => setRenameStageTarget(stage)}
                                                className="gap-2"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" /> Rename Stage
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setDeleteTarget({
                                                        type: "stage",
                                                        id: stage.id,
                                                        name: stage.name,
                                                    })
                                                }
                                                className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Delete Stage
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
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
                                                    onEdit={(opp) => handleOpenOpportunityModal(opp)}
                                                    onDelete={(opp) =>
                                                        setDeleteTarget({
                                                            type: "opportunity",
                                                            id: opp.id,
                                                            name: opp.title,
                                                        })
                                                    }
                                                    onStatusChange={handleStatusChange}
                                                />
                                            ))}
                                            {provided.placeholder}
                                        </div>

                                        {/* Quick Add Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleOpenOpportunityModal(undefined, stage.id)}
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
                </DragDropContext>

                {/* Add Stage Column */}
                <div className="w-80 shrink-0 flex flex-col pt-15">
                    <button
                        type="button"
                        onClick={() => setIsCreateStageOpen(true)}
                        className="h-44 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-white/20 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center gap-2 font-bold text-sm"
                    >
                        <Plus className="w-6 h-6" />
                        <span>Add Stage</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

