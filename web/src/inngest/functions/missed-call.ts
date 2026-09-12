import { inngest } from "@/lib/inngest/client";
import { db, contacts, conversations, messages, contactActivities } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { telnyx } from "@/lib/telnyx";
import { assembleAgentContext } from "@/lib/ai/context";
import { getAgentPolicy } from "@/lib/ai/agent-policy";
import { runAgentDeliberation } from "@/lib/ai/agent-runner";
import { recordAgentRun } from "@/lib/ai/agent-audit";

export const missedCallAutomation = inngest.createFunction(
    { id: "missed-call-super-agent", retries: 2 },
    { event: "call.missed" },
    async ({ event, step }) => {
        const { tenant_id, from_number, to_number } = event.data;
        const contact_id = (event.data as Record<string, any>).contact_id as string | undefined;

        if (!tenant_id || !from_number) {
            return { skipped: true, reason: "missing_required_fields" };
        }

        // Step 1: Resolve or auto-create caller contact in CRM
        const contact = await step.run("resolve-or-create-contact", async () => {
            if (contact_id) {
                const [existing] = await db
                    .select()
                    .from(contacts)
                    .where(and(eq(contacts.id, contact_id), eq(contacts.tenantId, tenant_id)))
                    .limit(1);
                if (existing) return existing;
            }

            const [found] = await db
                .select()
                .from(contacts)
                .where(and(eq(contacts.phone, from_number), eq(contacts.tenantId, tenant_id)))
                .limit(1);

            if (found) return found;

            // Auto-create prospective contact for inbound missed caller
            const [created] = await db
                .insert(contacts)
                .values({
                    tenantId: tenant_id,
                    phone: from_number,
                    firstName: "Prospective",
                    lastName: "Lead",
                    source: "Missed Call",
                    tags: ["missed-call", "ai-inbound"],
                })
                .returning();

            return created;
        });

        // Step 2: Assemble 3-Pillar Context (Knowledge + CRM State + Thread)
        const context = await step.run("assemble-context", async () => {
            return await assembleAgentContext({
                tenantId: tenant_id,
                contactId: contact.id,
            });
        });

        // Step 3: Check Tenant Autonomy Policy
        const policy = await step.run("check-policy", async () => {
            return await getAgentPolicy(tenant_id, "lead_qualifier");
        });

        if (!policy.isActive) {
            return { skipped: true, reason: "agent_disabled" };
        }

        // Step 4: Run Agent Deliberation
        const agentResult = await step.run("deliberate-response", async () => {
            return await runAgentDeliberation({
                agentType: "lead_qualifier",
                triggerEvent: "call.missed",
                context,
                policy,
            });
        });

        // Step 5: Ensure Conversation Exists
        const conversationId = await step.run("ensure-conversation", async () => {
            const [existing] = await db
                .select({ id: conversations.id })
                .from(conversations)
                .where(and(eq(conversations.contactId, contact.id), eq(conversations.tenantId, tenant_id)))
                .limit(1);

            if (existing) return existing.id;

            const [created] = await db
                .insert(conversations)
                .values({
                    tenantId: tenant_id,
                    contactId: contact.id,
                    status: "open",
                })
                .returning({ id: conversations.id });

            return created.id;
        });

        // Step 6: Safety Boundary: Draft-Only vs. Autonomous Execution
        const isDraftOnly =
            policy.autonomyMode === "draft_only" ||
            agentResult.confidence < policy.confidenceThreshold;

        if (isDraftOnly) {
            // Save AI draft in Unified Inbox for human review
            await step.run("save-inbox-draft", async () => {
                await db.insert(messages).values({
                    tenantId: tenant_id,
                    conversationId,
                    direction: "outbound",
                    channel: "sms",
                    content: agentResult.generatedResponse,
                    metadata: {
                        is_draft: true,
                        confidence: agentResult.confidence,
                        reasoning: agentResult.reasoning,
                        model_used: agentResult.modelUsed,
                        trigger_event: "call.missed",
                    },
                });

                await recordAgentRun({
                    tenantId: tenant_id,
                    agentType: "lead_qualifier",
                    contactId: contact.id,
                    triggerEvent: "call.missed",
                    status: "draft_pending",
                    inputContext: {
                        contactId: contact.id,
                        phone: from_number,
                        autonomyMode: policy.autonomyMode,
                    },
                    reasoningSteps: agentResult.reasoning,
                    draftOutput: agentResult.generatedResponse,
                    actionsTaken: [{ action: "save_draft" }],
                });
            });

            return {
                status: "draft_created",
                confidence: agentResult.confidence,
                message: agentResult.generatedResponse,
                reasoning: agentResult.reasoning,
            };
        }

        // Step 7: Autonomous Execution (Auto-Pilot Mode)
        await step.sleep("natural-delay", "5s");

        const executionResult = await step.run("execute-autonomous-sms", async () => {
            const senderPhone = to_number || context.tenant.phoneNumber;
            let providerId: string | undefined;

            if (telnyx && senderPhone) {
                try {
                    const smsRes = await (telnyx.messages as any).create({
                        from: senderPhone,
                        to: from_number,
                        text: agentResult.generatedResponse,
                    });
                    providerId = smsRes?.data?.id;
                } catch (sendErr) {
                    console.warn("Telnyx dispatch error in missedCallAutomation:", sendErr);
                }
            }

            // Insert outbound message to thread
            await db.insert(messages).values({
                tenantId: tenant_id,
                conversationId,
                direction: "outbound",
                channel: "sms",
                content: agentResult.generatedResponse,
                metadata: {
                    is_draft: false,
                    autonomous: true,
                    provider: providerId ? "telnyx" : "simulated",
                    provider_id: providerId,
                    confidence: agentResult.confidence,
                    model_used: agentResult.modelUsed,
                },
            });

            // Update conversation timestamp
            await db
                .update(conversations)
                .set({ lastMessageAt: new Date(), updatedAt: new Date(), status: "open" })
                .where(eq(conversations.id, conversationId));

            // Log activity on Contact timeline
            await db.insert(contactActivities).values({
                tenantId: tenant_id,
                contactId: contact.id,
                type: "sms",
                content: `AI Super Agent sent missed-call text-back: "${agentResult.generatedResponse}"`,
                metadata: {
                    autonomous: true,
                    confidence: agentResult.confidence,
                    trigger: "call.missed",
                },
            });

            // Audit log
            await recordAgentRun({
                tenantId: tenant_id,
                agentType: "lead_qualifier",
                contactId: contact.id,
                triggerEvent: "call.missed",
                status: "completed",
                inputContext: {
                    contactId: contact.id,
                    phone: from_number,
                    autonomyMode: policy.autonomyMode,
                },
                reasoningSteps: agentResult.reasoning,
                draftOutput: agentResult.generatedResponse,
                actionsTaken: [{ action: "send_sms", to: from_number }],
            });

            return { dispatched: true, providerId };
        });

        return {
            status: "executed_autonomously",
            confidence: agentResult.confidence,
            message: agentResult.generatedResponse,
            execution: executionResult,
        };
    }
);
