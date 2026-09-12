import { inngest } from "./client";
import { WorkflowNode, WorkflowEdge } from "./types";
import { getByDotNotation, evaluateCondition, convertToWaitTime } from "./utils/helpers";
import {
    handleSendSms,
    handleSendEmail,
    handleAddTag,
    handleRemoveTag,
    handleUpdateOpportunity,
    handleCreateOpportunity,
    handleMovePipelineStage,
    handleUpdateContact,
    handleInternalNotification,
    handleCreateTask,
    handleWebhook,
} from "./actions";
import { db } from "@/lib/db";
import { workflows, workflowVersions, workflowExecutions, contacts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// ============ GENERIC WORKFLOW ENGINE ============

// 1. Event Fan-out: Listens to core events and dispatches workflow executions
export const processEvent = inngest.createFunction(
    { id: "process-event-fanout" },
    [
        { event: "contact.created" },
        { event: "form.submitted" },
        { event: "appointment.booked" },
        { event: "call.missed" },
        { event: "opportunity.created" },
        { event: "opportunity.stage_changed" },
        { event: "opportunity.status_changed" },
        { event: "contact.tag_added" },
        { event: "contact.tag_removed" },
    ],
    async ({ event, step }) => {
        const tenantId = (event.data as any)?.tenant_id;
        if (!tenantId) {
            return { matched: 0, reason: "no_tenant_id" };
        }

        // Find all published workflows for this tenant matching this trigger
        const matchedWorkflows = await step.run("find-matching-workflows", async () => {
            const list = await db
                .select({ id: workflows.id, tenantId: workflows.tenantId })
                .from(workflows)
                .where(
                    and(
                        eq(workflows.status, "published"),
                        eq(workflows.triggerType, event.name),
                        eq(workflows.tenantId, tenantId)
                    )
                );

            if (!list || list.length === 0) return [];

            // FETCH DEFINITIONS TO CHECK FILTERS (Smart Triggers)
            const workflowsWithFilters = await Promise.all(
                list.map(async (wf) => {
                    const [version] = await db
                        .select({ definition: workflowVersions.definition })
                        .from(workflowVersions)
                        .where(and(eq(workflowVersions.workflowId, wf.id), eq(workflowVersions.isPublished, true)))
                        .orderBy(desc(workflowVersions.createdAt))
                        .limit(1);

                    return { ...wf, definition: version?.definition as any };
                })
            );

            return workflowsWithFilters.filter((wf) => {
                if (!wf.definition) return false;
                const triggerNode = wf.definition.nodes?.find((n: WorkflowNode) => n.type === "trigger");
                const filter = triggerNode?.data?.filter || triggerNode?.filter; // Support both structures

                if (!filter) return true; // No filter = all pass

                // Evaluate filter (Key-value matching via dot notation)
                return Object.entries(filter).every(([key, val]) => {
                    const actualVal = getByDotNotation(event.data, key);
                    return String(actualVal).toLowerCase() === String(val).toLowerCase();
                });
            });
        });

        if (!matchedWorkflows || matchedWorkflows.length === 0) return { matched: 0 };

        // Trigger execution for each matched workflow
        const events = matchedWorkflows.map((wf) => ({
            name: "workflow.execute" as const,
            data: {
                workflow_id: wf.id,
                tenant_id: wf.tenantId,
                original_event: event,
                trigger_data: event.data,
            },
        }));

        await step.sendEvent("dispatch-executions", events);

        return { matched: matchedWorkflows.length, workflow_ids: matchedWorkflows.map((w) => w.id) };
    }
);

// 2. Workflow Executor: The core interpreter
export const executeWorkflow = inngest.createFunction(
    { id: "workflow-executor", retries: 0 },
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

        // 3. Hydrate trigger context (Contact info, synthetic variables)
        const contextData = await step.run("hydrate-trigger-context", async () => {
            const data = { ...trigger_data };
            const contactId = data.contact_id || data.contact?.id || data.id;

            if (contactId && (!data.contact || !data.contact.email || !data.contact.phone)) {
                const [contactRow] = await db
                    .select()
                    .from(contacts)
                    .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenant_id)))
                    .limit(1);

                if (contactRow) {
                    const first = contactRow.firstName || "";
                    const last = contactRow.lastName || "";
                    data.contact = {
                        id: contactRow.id,
                        first_name: first,
                        firstName: first,
                        last_name: last,
                        lastName: last,
                        name: [first, last].filter(Boolean).join(" ") || "Contact",
                        email: contactRow.email,
                        phone: contactRow.phone,
                        tags: contactRow.tags || [],
                        source: contactRow.source,
                    };
                    if (!data.email && contactRow.email) data.email = contactRow.email;
                    if (!data.phone && contactRow.phone) data.phone = contactRow.phone;
                }
            } else if (data.from_number && !data.contact) {
                const [contactByPhone] = await db
                    .select()
                    .from(contacts)
                    .where(and(eq(contacts.phone, data.from_number), eq(contacts.tenantId, tenant_id)))
                    .limit(1);

                if (contactByPhone) {
                    const first = contactByPhone.firstName || "";
                    const last = contactByPhone.lastName || "";
                    data.contact = {
                        id: contactByPhone.id,
                        first_name: first,
                        firstName: first,
                        last_name: last,
                        lastName: last,
                        name: [first, last].filter(Boolean).join(" ") || "Contact",
                        email: contactByPhone.email,
                        phone: contactByPhone.phone,
                        tags: contactByPhone.tags || [],
                        source: contactByPhone.source,
                    };
                    data.contact_id = contactByPhone.id;
                }
            }

            return data;
        });

        // 4. Create Execution Record
        const execution_id = await step.run("create-execution-log", async () => {
            const [record] = await db
                .insert(workflowExecutions)
                .values({
                    workflowId: workflow_id,
                    versionId: version_id,
                    tenantId: tenant_id,
                    triggerData: contextData,
                    status: "running",
                })
                .returning({ id: workflowExecutions.id });
            return record?.id;
        });

        // Find Start Node (Trigger)
        const startNode = nodes.find((n) => n.type === "trigger");
        if (!startNode) {
            if (execution_id) {
                await db
                    .update(workflowExecutions)
                    .set({ status: "failed", errorMessage: "No trigger node in definition", completedAt: new Date() })
                    .where(eq(workflowExecutions.id, execution_id));
            }
            return { error: "No trigger node" };
        }

        let currentNode: WorkflowNode | undefined = startNode;
        const maxSteps = 50;
        let stepCount = 0;

        try {
            while (currentNode && stepCount < maxSteps) {
                stepCount++;

                // Find outbound edges
                const outboundEdges = edges.filter((e) => e.source === currentNode?.id);
                if (outboundEdges.length === 0) break; // End of flow

                let nextEdge: WorkflowEdge | undefined = outboundEdges[0];

                // If current node was a branching node, nextEdge depends on logic evaluation
                if (currentNode.type === "if_else") {
                    const branchConfig = currentNode.data || {};
                    const conditionResult: boolean = await step.run(`logic-${currentNode.id}`, async (): Promise<boolean> => {
                        return evaluateCondition(branchConfig, contextData);
                    });

                    const yesEdge = outboundEdges.find(
                        (e) => e.sourceHandle === "yes" || e.label?.toLowerCase() === "yes" || (e as any).type === "yes"
                    );
                    const noEdge = outboundEdges.find(
                        (e) => e.sourceHandle === "no" || e.label?.toLowerCase() === "no" || (e as any).type === "no"
                    );

                    nextEdge = conditionResult ? yesEdge : noEdge;
                    if (!nextEdge) break; // Branch dead end
                }

                const nextNodeId: string = nextEdge.target;
                const nextNode: WorkflowNode | undefined = nodes.find((n: WorkflowNode) => n.id === nextNodeId);
                if (!nextNode) break;

                // Execute next node
                if (nextNode.type === "action") {
                    await step.run(`action-${nextNode.id}`, async () => {
                        await executeAction(nextNode, contextData, tenant_id);
                    });
                } else if (nextNode.type === "wait") {
                    const duration = nextNode.data?.duration || 1;
                    const unit = nextNode.data?.unit || "minutes";
                    const waitDuration = convertToWaitTime(duration, unit);
                    await step.sleep(`wait-${nextNode.id}`, waitDuration);
                } else if (nextNode.type === "end") {
                    break;
                }

                currentNode = nextNode;
            }

            // Finalize Execution Record
            if (execution_id) {
                await step.run("finalize-execution", async () => {
                    await db
                        .update(workflowExecutions)
                        .set({
                            status: "completed",
                            completedAt: new Date(),
                        })
                        .where(eq(workflowExecutions.id, execution_id));
                });
            }

            return { status: "completed", steps_executed: stepCount, execution_id };
        } catch (execError: any) {
            console.error("Workflow execution error:", execError);
            if (execution_id) {
                await db
                    .update(workflowExecutions)
                    .set({
                        status: "failed",
                        errorMessage: execError.message || "Execution failed",
                        completedAt: new Date(),
                    })
                    .where(eq(workflowExecutions.id, execution_id));
            }
            throw execError;
        }
    }
);

// ============ ACTION HANDLERS ============

async function executeAction(node: WorkflowNode, triggerData: Record<string, any>, tenantId: string) {
    const actionId = node.data?.actionId || (node as any).actionId;
    const config = node.data || {};

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
        case "remove_tag":
            await handleRemoveTag(config, triggerData, tenantId);
            break;
        case "update_contact":
            await handleUpdateContact(config, triggerData, tenantId);
            break;
        case "create_opportunity":
            await handleCreateOpportunity(config, triggerData, tenantId);
            break;
        case "update_opportunity":
            await handleUpdateOpportunity(config, triggerData, tenantId);
            break;
        case "move_pipeline_stage":
            await handleMovePipelineStage(config, triggerData, tenantId);
            break;
        case "internal_notification":
            await handleInternalNotification(config, triggerData, tenantId);
            break;
        case "create_task":
            await handleCreateTask(config, triggerData, tenantId);
            break;
        case "webhook":
            await handleWebhook(config, triggerData, tenantId);
            break;
        default:
            console.warn(`Action type "${actionId}" acknowledged (simulated/no-op)`);
    }
}

export const functions = [processEvent, executeWorkflow];

