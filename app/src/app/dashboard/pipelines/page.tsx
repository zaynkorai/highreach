import { createClient } from "@/lib/supabase/server";
import { getPipelines, getOpportunities } from "./actions";
import { PipelineClient } from "./pipeline-client";
import { PipelineWithStages } from "@/types/pipeline";
import { redirect } from "next/navigation";

export default async function PipelinesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. Fetch Pipelines (and stages)
    const pipelineRes = await getPipelines() as any;

    if (!pipelineRes.success || !pipelineRes.data) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Failed to load pipelines</h1>
                <p className="text-sm text-zinc-500 max-w-sm mb-6">
                    {pipelineRes.error || "There was a problem connecting to the server. Please try refreshing the page."}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium transition-transform hover:scale-105"
                >
                    Refresh Page
                </button>
            </div>
        );
    }

    const pipelines = pipelineRes.data as PipelineWithStages[];
    const activePipelineId = pipelines[0]?.id;

    // 2. Fetch Opportunities for the active pipeline
    const opportunitiesRes = await getOpportunities(activePipelineId);
    const opportunities = (opportunitiesRes.success && opportunitiesRes.data) ? opportunitiesRes.data : [];

    // 3. Fetch Contacts for the dropdowns
    const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .order("first_name", { ascending: true });

    return (
        <PipelineClient
            initialPipelines={pipelines}
            initialOpportunities={opportunities as any[]}
            contacts={(contacts || []) as any[]}
        />
    );
}
