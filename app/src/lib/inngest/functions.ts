import { inngest } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";
import { telnyx } from "@/lib/telnyx";
import { resend } from "@/lib/resend";

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
                const triggerNode = wf.definition.nodes?.find((n: any) => n.type === "trigger");
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
            // Get latest published version
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
        const { nodes, edges } = definition;

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
        const startNode = nodes.find((n: any) => n.type === "trigger");
        if (!startNode) {
            if (execution_id) await supabase.from("workflow_executions").update({ status: 'failed', error_message: 'No trigger node' }).eq('id', execution_id);
            return { error: "No trigger node" };
        }

        let currentNode = startNode;

        // Traversal Loop (Simplified for linear paths, handle branching conceptually)
        // In Inngest, deep loops are risky, but for <50 steps it's fine.
        // For distinct steps, we wrap logic in step.run()
        const maxSteps = 50;
        let stepCount = 0;

        while (currentNode && stepCount < maxSteps) {
            stepCount++;

            // Find next node(s)
            const outboundEdges = edges.filter((e: any) => e.source === currentNode.id);
            if (outboundEdges.length === 0) break; // End of path

            // Default: Take the first edge (unless branching)
            let nextEdge = outboundEdges[0];

            // EXECUTE CURRENT NODE LOGIC
            // (We skip trigger execution as it already happened)

            // Move to Next Node
            const nextNodeId = nextEdge.target;
            const nextNode = nodes.find((n: any) => n.id === nextNodeId);

            if (!nextNode) break;

            // HANDLE NODE TYPES
            if (nextNode.type === "action") {
                await step.run(`action-${nextNode.id}`, async () => {
                    await executeAction(nextNode, trigger_data, tenant_id);
                });
            } else if (nextNode.type === "wait") {
                // Wait step logic
                const { duration, unit } = nextNode.data;
                const ms = convertToMs(duration, unit);
                await step.sleep(`wait-${nextNode.id}`, ms); // e.g. "30s"
            } else if (nextNode.type === "if_else") {
                // Evaluate condition
                const result = await step.run(`logic-${nextNode.id}`, async () => {
                    return evaluateCondition(nextNode.data, trigger_data);
                });

                // Choose edge based on result
                const yesEdge = outboundEdges.find((e: any) => e.sourceHandle === "yes");
                const noEdge = outboundEdges.find((e: any) => e.sourceHandle === "no");
                nextEdge = result ? yesEdge : noEdge;

                // Stop if branch leads nowhere
                if (!nextEdge) break;

                const branchTargetNode = nodes.find((n: any) => n.id === nextEdge.target);
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

// Helpers
async function executeAction(node: any, triggerData: any, tenantId: string) {
    const supabase = createAdminClient();
    const actionId = node.data.actionId;
    const config = node.data;

    console.log(`Executing Action: ${actionId}`, config);

    switch (actionId) {
        case "send_sms": {
            const to = triggerData.contact?.phone || triggerData.phone;
            if (!to) throw new Error("No phone number found for SMS");

            // 1. Get Tenant SMS Config (The source number)
            const { data: tenant } = await supabase.from("tenants").select("sms_number").eq("id", tenantId).single();
            if (!tenant?.sms_number) throw new Error("Tenant has no SMS number configured");

            // 2. Format Template
            const message = formatTemplate(config.template, triggerData);

            // 3. Send via Telnyx
            await (telnyx.messages as any).create({
                from: tenant.sms_number,
                to,
                text: message
            });

            // 4. Log Communication
            if (triggerData.contact?.id) {
                await supabase.from("contact_activities").insert({
                    contact_id: triggerData.contact.id,
                    tenant_id: tenantId,
                    type: "sms_sent",
                    content: message,
                    metadata: { provider: "telnyx", workflow_node_id: node.id }
                });
            }
            break;
        }

        case "send_email": {
            const to = triggerData.contact?.email || triggerData.email;
            if (!to) throw new Error("No email address found for communication");

            // 1. Format Template & Subject
            const subject = formatTemplate(config.subject || "New Message", triggerData);
            const content = formatTemplate(config.template, triggerData);

            // 2. Send via Resend
            const { error } = await resend.emails.send({
                from: 'Galaxy CRM <onboarding@resend.dev>', // In production use tenant verified domain
                to: [to],
                subject: subject,
                text: content,
            });

            if (error) throw new Error(`Resend Error: ${error.message}`);

            // 3. Log Communication
            if (triggerData.contact?.id) {
                await supabase.from("contact_activities").insert({
                    contact_id: triggerData.contact.id,
                    tenant_id: tenantId,
                    type: "email_sent",
                    content: content,
                    metadata: { provider: "resend", subject, workflow_node_id: node.id }
                });
            }
            break;
        }

        case "add_tag": {
            const contactId = triggerData.contact?.id || triggerData.id;
            const newTag = config.tag;
            if (!contactId || !newTag) return;

            const { data: contact } = await supabase.from("contacts").select("tags").eq("id", contactId).single();
            const currentTags = Array.isArray(contact?.tags) ? contact.tags : [];

            if (!currentTags.includes(newTag)) {
                await supabase.from("contacts")
                    .update({ tags: [...currentTags, newTag] })
                    .eq("id", contactId);
            }
            break;
        }

        case "update_opportunity": {
            const opportunityId = triggerData.opportunity?.id || triggerData.id;
            if (!opportunityId) return;

            const updates: any = {};
            if (config.status) updates.status = config.status;
            if (config.pipeline_stage_id) updates.pipeline_stage_id = config.pipeline_stage_id;

            await supabase.from("opportunities")
                .update(updates)
                .eq("id", opportunityId);
            break;
        }

        default:
            console.warn(`Action type ${actionId} not implemented yet`);
    }
}

function getByDotNotation(obj: any, path: string) {
    return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
}

function formatTemplate(template: string, data: any) {
    if (!template) return "";
    return template.replace(/\{\{(.*?)\}\}/g, (match, path) => {
        const value = getByDotNotation(data, path.trim());
        return value !== undefined ? String(value) : match;
    });
}

function evaluateCondition(config: any, data: any): boolean {
    const { field, operator, value } = config;
    if (!field || !operator) return false;

    // 1. Get raw value from data using dot-notation (e.g. contact.email)
    // The data usually comes in as { contact: { ... }, event: { ... } } or just flat
    const parts = field.split('.');
    let actualValue: any = data;
    for (const part of parts) {
        actualValue = actualValue?.[part];
    }

    const strValue = String(actualValue || "").toLowerCase();
    const compareValue = String(value || "").toLowerCase();

    // 2. Evaluate based on operator
    switch (operator) {
        case "equals": return strValue === compareValue;
        case "not_equals": return strValue !== compareValue;
        case "contains": return strValue.includes(compareValue);
        case "does_not_contain": return !strValue.includes(compareValue);
        case "starts_with": return strValue.startsWith(compareValue);
        case "is_empty": return !actualValue || strValue.trim() === "";
        case "is_not_empty": return !!actualValue && strValue.trim() !== "";
        default: return false;
    }
}

function convertToMs(duration: number, unit: string) {
    // Inngest sleep accepts strings like "1h", "30s"
    // We'll return that string format
    const u = unit === "minutes" ? "m" : unit === "seconds" ? "s" : unit === "hours" ? "h" : "d";
    return `${duration}${u}`;
}

export const functions = [processEvent, executeWorkflow];
