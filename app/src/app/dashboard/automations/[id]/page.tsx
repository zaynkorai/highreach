import { getWorkflow } from "../actions";
import { WorkflowEditor } from "../components/workflow-editor";
import { redirect } from "next/navigation";

export default async function WorkflowEditorPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const workflow = await getWorkflow(id);

    if (!workflow) {
        // If not a real ID, maybe it's a legacy keys (like missed_call_sms)
        // For new system, we redirect or handle gracefully.
        // For now, redirect to automations list
        redirect("/dashboard/automations");
    }

    return (
        <WorkflowEditor
            workflowId={workflow.id}
            workflowName={workflow.name}
            initialDefinition={workflow.definition}
        />
    );
}
