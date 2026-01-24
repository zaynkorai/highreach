"use client";

import { useEffect } from "react";
import { PipelineWithStages, Opportunity } from "@/types/pipeline";
import { usePipelineActions } from "@/stores/pipeline-store";
import { KanbanBoard } from "./components/kanban-board";
import { Contact } from "@/types/contact";

interface PipelineClientProps {
    initialPipelines: PipelineWithStages[];
    initialOpportunities: Opportunity[];
    contacts: Contact[];
}

export function PipelineClient({ initialPipelines, initialOpportunities, contacts }: PipelineClientProps) {
    const { setPipelines, setOpportunities } = usePipelineActions();

    useEffect(() => {
        setPipelines(initialPipelines);
        setOpportunities(initialOpportunities);
    }, [initialPipelines, initialOpportunities, setPipelines, setOpportunities]);

    return (
        <div className="h-full p-6 bg-white dark:bg-zinc-950">
            <KanbanBoard contacts={contacts} />
        </div>
    );
}
