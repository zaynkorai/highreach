import { inngest } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";
import { WorkflowNode, WorkflowEdge } from "./types";
import { getByDotNotation, evaluateCondition, convertToWaitTime } from "./utils/helpers";
import {
    handleSendSms,
    handleSendEmail,
    handleAddTag,
    handleUpdateOpportunity
} from "./actions";

// ============ GENERIC WORKFLOW ENGINE ============

// 1. Event Fan-out: Listens to core events and dispatches workflow executions
export const processEvent = inngest.createFunction(
    { id: "process-event-fanout" },
    [
        { event: "contact.created" },
        { event: "form.submitted" },
        { event: "appointment.booked" },
        { event: "call.missed" }
    ],
    async ({ event, step }) => {
        const supabase = createAdminClient();

        // Find all published workflows that match this trigger
        const workflows = await step.run("find-matching-workflows", async () => {
            const { data } = await supabase
                .from("workflows")
                .select("id, tenant_id")
                .eq("status", "published")
                .eq("trigger_type", event.name);

            if (!data) return [];

            // FETCH DEFINITIONS TO CHECK FILTERS (Smart Triggers)
            // Real production app would index filters, for now we filter in-memory for the matched set
            const workflowsWithFilters = await Promise.all(data.map(async (wf) => {
                const { data: version } = await supabase
                    .from("workflow_versions")
                    .select("definition")
                    .eq("workflow_id", wf.id)
                    .eq("is_published", true)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                return { ...wf, definition: version?.definition };
            }));

            return workflowsWithFilters.filter(wf => {
                if (!wf.definition) return false;
                const triggerNode = wf.definition.nodes?.find((n: WorkflowNode) => n.type === "trigger");
                const filter = triggerNode?.data?.filter || triggerNode?.filter; // Support both structures

                if (!filter) return true; // No filter = all pass

                // Evaluate filter (Simple key-value match for now)
                return Object.entries(filter).every(([key, val]) => {
                    const actualVal = getByDotNotation(event.data, key);
                    return String(actualVal) === String(val);
                });
            });
        });

        if (!workflows || workflows.length === 0) return { matched: 0 };

        // Trigger execution for each workflow
        const events = workflows.map(wf => ({
            name: "workflow.execute" as const,
            data: {
                workflow_id: wf.id,
                tenant_id: wf.tenant_id,
                original_event: event,
                trigger_data: event.data
            }
        }));

        await step.sendEvent("dispatch-executions", events);

        return { matched: workflows.length, workflow_ids: workflows.map(w => w.id) };
    }
);

// 2. Workflow Executor: The core interpreter
export const executeWorkflow = inngest.createFunction(
    { id: "workflow-executor", retries: 0 }, // Retries handled per step
    { event: "workflow.execute" },
    async ({ event, step }) => {
        const { workflow_id, tenant_id, trigger_data } = event.data;
        const supabase = createAdminClient();

        // Load the workflow definition (latest published version)
        const workflowData = await step.run("load-workflow-definition", async () => {
            const { data: version } = await supabase
                .from("workflow_versions")
                .select("id, definition")
                .eq("workflow_id", workflow_id)
                .eq("is_published", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (!version) throw new Error("No published version found");
            return { definition: version.definition, version_id: version.id };
        });

        if (!workflowData?.definition) return { error: "Definition not found" };

        const { definition, version_id } = workflowData;
        const nodes: WorkflowNode[] = definition.nodes || [];
        const edges: WorkflowEdge[] = definition.edges || [];

        // 3. Create Execution Record
        const execution_id = await step.run("create-execution-log", async () => {
            const { data } = await supabase
                .from("workflow_executions")
                .insert({
                    workflow_id,
                    version_id,
                    tenant_id,
                    trigger_data,
                    status: 'running'
                })
                .select('id')
                .single();
            return data?.id;
        });

        // Find Start Node (Trigger)
        const startNode = nodes.find(n => n.type === "trigger");
        if (!startNode) {
            if (execution_id) await supabase.from("workflow_executions").update({ status: 'failed', error_message: 'No trigger node' }).eq('id', execution_id);
            return { error: "No trigger node" };
        }

        let currentNode: WorkflowNode | undefined = startNode;

        // Traversal Loop (Simplified for linear paths, handle branching conceptually)
        // In Inngest, deep loops are risky, but for <50 steps it's fine.
        const maxSteps = 50;
        let stepCount = 0;

        while (currentNode && stepCount < maxSteps) {
            stepCount++;

            // Find next node(s)
            const outboundEdges = edges.filter(e => e.source === currentNode?.id);
            if (outboundEdges.length === 0) break; // End of path

            let nextEdge: WorkflowEdge | undefined = outboundEdges[0];

            // Move to Next Node
            const nextNodeId = nextEdge.target;
            const nextNode = nodes.find(n => n.id === nextNodeId);

            if (!nextNode) break;

            // HANDLE NODE TYPES
            if (nextNode.type === "action") {
                await step.run(`action-${nextNode.id}`, async () => {
                    await executeAction(nextNode, trigger_data, tenant_id);
                });
            } else if (nextNode.type === "wait") {
                const { duration, unit } = nextNode.data;
                const waitDuration = convertToWaitTime(duration, unit);
                await step.sleep(`wait-${nextNode.id}`, waitDuration);
            } else if (nextNode.type === "if_else") {
                const result = await step.run(`logic-${nextNode.id}`, async () => {
                    return evaluateCondition(nextNode.data, trigger_data);
                });

                const yesEdge = outboundEdges.find(e => e.sourceHandle === "yes");
                const noEdge = outboundEdges.find(e => e.sourceHandle === "no");
                nextEdge = result ? yesEdge : noEdge;

                if (!nextEdge) break;

                const branchTargetNode = nodes.find(n => n.id === nextEdge!.target);
                if (branchTargetNode) {
                    currentNode = branchTargetNode;
                    continue;
                } else {
                    break;
                }
            }

            currentNode = nextNode;
        }

        // Finalize Execution Record
        if (execution_id) {
            await step.run("finalize-execution", async () => {
                await supabase
                    .from("workflow_executions")
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', execution_id);
            });
        }

        return { status: "completed", steps_executed: stepCount, execution_id };
    }
);

// ============ ACTION HANDLERS ============

async function executeAction(node: WorkflowNode, triggerData: Record<string, any>, tenantId: string) {
    const supabase = createAdminClient();
    const actionId = node.data.actionId;
    const config = node.data;

    console.log(`Executing Action: ${actionId}`, config);

    switch (actionId) {
        case "send_sms":
            await handleSendSms(node, config, triggerData, tenantId, supabase);
            break;
        case "send_email":
            await handleSendEmail(node, config, triggerData, tenantId, supabase);
            break;
        case "add_tag":
            await handleAddTag(config, triggerData, tenantId, supabase);
            break;
        case "update_opportunity":
            await handleUpdateOpportunity(config, triggerData, tenantId, supabase);
            break;
        default:
            console.warn(`Action type ${actionId} not implemented yet`);
    }
}

export const functions = [processEvent, executeWorkflow];
