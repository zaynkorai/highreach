import { getSessionWithRole } from "@/lib/auth/session";
import { db, contacts } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { getPipelines, getOpportunities } from "./actions";
import { PipelineClient } from "./pipeline-client";
import { PipelineWithStages } from "@/types/pipeline";
import { redirect } from "next/navigation";

export default async function PipelinesPage() {
    const session = await getSessionWithRole();

    if (!session) {
        redirect("/login");
    }

    // 1. Fetch Pipelines (and stages)
    const pipelineRes = (await getPipelines()) as any;

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
            </div>
        );
    }

    const pipelinesList = pipelineRes.data as PipelineWithStages[];
    const activePipelineId = pipelinesList[0]?.id;

    // 2. Fetch Opportunities for the active pipeline
    const opportunitiesRes = await getOpportunities(activePipelineId);
    const opportunities = opportunitiesRes.success && opportunitiesRes.data ? opportunitiesRes.data : [];

    // 3. Fetch Contacts for the dropdowns
    const tenantContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.tenantId, session.tenantId))
        .orderBy(asc(contacts.firstName));

    const formattedContacts = tenantContacts.map((c) => ({
        id: c.id,
        tenant_id: c.tenantId,
        first_name: c.firstName,
        last_name: c.lastName,
        email: c.email,
        phone: c.phone,
        tags: c.tags || [],
        source: c.source,
        notes: c.notes,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
    }));

    return (
        <PipelineClient
            initialPipelines={pipelinesList}
            initialOpportunities={opportunities as any[]}
            contacts={formattedContacts as any[]}
        />
    );
}
