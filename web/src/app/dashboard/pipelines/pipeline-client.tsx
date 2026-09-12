"use client";

import { useEffect } from "react";
import { PipelineWithStages, Opportunity } from "@/types/pipeline";
import { usePipelineActions } from "@/stores/pipeline-store";
import { KanbanBoard } from "./components/kanban-board";
import { Contact } from "@/types/contact";

interface PipelineClientProps {
    initialPipelines: PipelineWithStages[];
    initialActivePipelineId?: string;
    initialOpportunities: Opportunity[];
    contacts: Contact[];
}

export function PipelineClient({ initialPipelines, initialActivePipelineId, initialOpportunities, contacts }: PipelineClientProps) {
    const { setPipelines, setActivePipelineId, setOpportunities } = usePipelineActions();

    useEffect(() => {
        setPipelines(initialPipelines);
        if (initialActivePipelineId) {
            setActivePipelineId(initialActivePipelineId);
        }
        setOpportunities(initialOpportunities);
    }, [initialPipelines, initialActivePipelineId, initialOpportunities, setPipelines, setActivePipelineId, setOpportunities]);

    return (
        <div className="h-full w-full min-w-0 p-4 sm:p-6 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/[0.08]">
            <KanbanBoard contacts={contacts} />
        </div>
    );
}
