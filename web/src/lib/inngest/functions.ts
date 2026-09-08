import { inngest } from "./client";
import { WorkflowNode, WorkflowEdge } from "./types";
import { getByDotNotation, evaluateCondition, convertToWaitTime } from "./utils/helpers";
import {
    handleSendSms,
    handleSendEmail,
    handleAddTag,
    handleUpdateOpportunity
} from "./actions";
import { db } from "@/lib/db";
import { workflows, workflowVersions, workflowExecutions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

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
        // Find all published workflows that match this trigger
        const matchedWorkflows = await step.run("find-matching-workflows", async () => {
            const list = await db
                .select({ id: workflows.id, tenantId: workflows.tenantId })
                .from(workflows)
                .where(and(eq(workflows.status, "published"), eq(workflows.triggerType, event.name)));

            if (!list || list.length === 0) return [];

            // FETCH DEFINITIONS TO CHECK FILTERS (Smart Triggers)
            const workflowsWithFilters = await Promise.all(list.map(async (wf) => {
                const [version] = await db
                    .select({ definition: workflowVersions.definition })
                    .from(workflowVersions)
                    .where(and(eq(workflowVersions.workflowId, wf.id), eq(workflowVersions.isPublished, true)))
                    .orderBy(desc(workflowVersions.createdAt))
                    .limit(1);

                return { ...wf, definition: version?.definition as any };
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

        if (!matchedWorkflows || matchedWorkflows.length === 0) return { matched: 0 };

        // Trigger execution for each workflow
        const events = matchedWorkflows.map(wf => ({
            name: "workflow.execute" as const,
            data: {
                workflow_id: wf.id,
                tenant_id: wf.tenantId,
                original_event: event,
                trigger_data: event.data
            }
        }));

        await step.sendEvent("dispatch-executions", events);

        return { matched: matchedWorkflows.length, workflow_ids: matchedWorkflows.map(w => w.id) };
    }
);

// 2. Workflow Executor: The core interpreter
export const executeWorkflow = inngest.createFunction(
    { id: "workflow-executor", retries: 0 }, // Retries handled per step
    { event: "workflow.execute" },
    async ({ event, step }) => {
        const { workflow_id, tenant_id, trigger_data } = event.data;

        // Load the workflow definition (latest published version)
        const workflowData = await step.run("load-workflow-definition", async () => {
            const [version] = await db
                .select({ id: workflowVersions.id, definition: workflowVersions.definition })
                .from(workflowVersions)
                .where(and(eq(workflowVersions.workflowId, workflow_id), eq(workflowVersions.isPublished, true)))
                .orderBy(desc(workflowVersions.createdAt))
                .limit(1);

            if (!version) throw new Error("No published version found");
            return { definition: version.definition as any, version_id: version.id };
        });

        if (!workflowData?.definition) return { error: "Definition not found" };

        const { definition, version_id } = workflowData;
        const nodes: WorkflowNode[] = definition.nodes || [];
        const edges: WorkflowEdge[] = definition.edges || [];

        // 3. Create Execution Record
        const execution_id = await step.run("create-execution-log", async () => {
            const [record] = await db
                .insert(workflowExecutions)
                .values({
                    workflowId: workflow_id,
                    versionId: version_id,
                    tenantId: tenant_id,
                    triggerData: trigger_data,
                    status: 'running'
                })
                .returning({ id: workflowExecutions.id });
            return record?.id;
        });

        // Find Start Node (Trigger)
        const startNode = nodes.find(n => n.type === "trigger");
        if (!startNode) {
            if (execution_id) {
                await db
                    .update(workflowExecutions)
                    .set({ status: 'failed', errorMessage: 'No trigger node' })
                    .where(eq(workflowExecutions.id, execution_id));
            }
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
                await db
                    .update(workflowExecutions)
                    .set({
                        status: 'completed',
                        completedAt: new Date()
                    })
                    .where(eq(workflowExecutions.id, execution_id));
            });
        }

        return { status: "completed", steps_executed: stepCount, execution_id };
    }
);

// ============ ACTION HANDLERS ============

async function executeAction(node: WorkflowNode, triggerData: Record<string, any>, tenantId: string) {
    const actionId = node.data.actionId;
    const config = node.data;

    console.log(`Executing Action: ${actionId}`, config);

    switch (actionId) {
        case "send_sms":
            await handleSendSms(node, config, triggerData, tenantId);
            break;
        case "send_email":
            await handleSendEmail(node, config, triggerData, tenantId);
            break;
        case "add_tag":
            await handleAddTag(config, triggerData, tenantId);
            break;
        case "update_opportunity":
            await handleUpdateOpportunity(config, triggerData, tenantId);
            break;
        default:
            console.warn(`Action type ${actionId} not implemented yet`);
    }
}

export const functions = [processEvent, executeWorkflow];
