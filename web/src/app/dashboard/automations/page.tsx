import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkflowList } from "./components/workflow-list";
import { RecipeModal } from "./components/recipe-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function AutomationsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: userData } = await supabase.from("users").select("tenant_id").eq("id", user.id).single();
    if (!userData) redirect("/login");

    // Fetch real workflows
    const { data: workflows } = await supabase
        .from("workflows")
        .select("*")
        .eq("tenant_id", userData.tenant_id)
        .order("updated_at", { ascending: false });

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

            <WorkflowList initialWorkflows={workflows || []} />
        </div>
    );
}
