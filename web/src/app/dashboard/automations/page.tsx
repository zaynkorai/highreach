import { getSessionWithRole } from "@/lib/auth/session";
import { db, workflows } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { WorkflowList } from "./components/workflow-list";
import { RecipeModal } from "./components/recipe-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function AutomationsPage() {
    const session = await getSessionWithRole();
    if (!session) redirect("/login");

    // Fetch workflows for this tenant
    const workflowList = await db
        .select()
        .from(workflows)
        .where(eq(workflows.tenantId, session.tenantId))
        .orderBy(desc(workflows.updatedAt));

    const formatted = workflowList.map((w) => ({
        id: w.id,
        tenant_id: w.tenantId,
        name: w.name,
        description: w.description,
        trigger_type: w.triggerType,
        status: w.status,
        created_at: w.createdAt.toISOString(),
        updated_at: w.updatedAt.toISOString(),
    }));

    return (
        <div className="space-y-6 container mx-auto max-w-6xl py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Workflows</h1>
                    <p className="text-muted-foreground mt-1">Manage your automated triggers and actions.</p>
                </div>
                <RecipeModal
                    trigger={
                        <Button className="gap-2 shadow-lg shadow-brand-500/20 bg-brand-600 hover:bg-brand-700 text-white">
                            <Plus className="w-4 h-4" />
                            Create Workflow
                        </Button>
                    }
                />
            </div>

            <WorkflowList initialWorkflows={formatted as any} />
        </div>
    );
}
