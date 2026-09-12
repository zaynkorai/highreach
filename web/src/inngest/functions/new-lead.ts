import { inngest } from "@/lib/inngest/client";
import { db, contacts, conversations, messages, contactActivities } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { telnyx } from "@/lib/telnyx";
import { assembleAgentContext } from "@/lib/ai/context";
import { getAgentPolicy } from "@/lib/ai/agent-policy";
import { runAgentDeliberation } from "@/lib/ai/agent-runner";
import { recordAgentRun } from "@/lib/ai/agent-audit";

export const newLeadWelcome = inngest.createFunction(
    { id: "speed-to-lead-super-agent", retries: 2 },
    { event: "contact.created" },
    async ({ event, step }) => {
        const { contact_id, tenant_id } = event.data;

        if (!contact_id || !tenant_id) {
            return { skipped: true, reason: "missing_required_fields" };
        }

        // Step 1: Assemble 3-Pillar Context (Knowledge + Lead State + Thread)
        const context = await step.run("assemble-context", async () => {
            return await assembleAgentContext({
                tenantId: tenant_id,
                contactId: contact_id,
            });
        });

        const recipientPhone = context.contact.profile?.phone;
        if (!recipientPhone) {
            return { skipped: true, reason: "no_phone_number" };
        }

        // Step 2: Check Tenant Autonomy Policy
        const policy = await step.run("check-policy", async () => {
            return await getAgentPolicy(tenant_id, "lead_qualifier");
        });

        if (!policy.isActive) {
            return { skipped: true, reason: "agent_disabled" };
        }

        // Step 3: Run Agent Deliberation
        const agentResult = await step.run("deliberate-response", async () => {
            return await runAgentDeliberation({
                agentType: "lead_qualifier",
                triggerEvent: "contact.created",
                context,
                policy,
            });
        });

        // Step 4: Ensure Conversation Exists
        const conversationId = await step.run("ensure-conversation", async () => {
            const [existing] = await db
                .select({ id: conversations.id })
                .from(conversations)
                .where(and(eq(conversations.contactId, contact_id), eq(conversations.tenantId, tenant_id)))
                .limit(1);

            if (existing) return existing.id;

            const [created] = await db
                .insert(conversations)
                .values({
                    tenantId: tenant_id,
                    contactId: contact_id,
                    status: "open",
                })
                .returning({ id: conversations.id });

            return created.id;
        });

        // Step 5: Safety Boundary: Draft-Only vs Autonomous Execution
        const isDraftOnly =
            policy.autonomyMode === "draft_only" ||
            agentResult.confidence < policy.confidenceThreshold;

        if (isDraftOnly) {
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
                        trigger_event: "contact.created",
                    },
                });

                await recordAgentRun({
                    tenantId: tenant_id,
                    agentType: "lead_qualifier",
                    contactId: contact_id,
                    triggerEvent: "contact.created",
                    status: "draft_pending",
                    inputContext: {
                        contactId: contact_id,
                        phone: recipientPhone,
                        source: context.contact.profile?.source,
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

        // Step 6: Autonomous Execution (Auto-Pilot Mode)
        await step.sleep("natural-delay", "5s");

        const executionResult = await step.run("execute-speed-to-lead-sms", async () => {
            const senderPhone = context.tenant.phoneNumber;
            let providerId: string | undefined;

            if (telnyx && senderPhone) {
                try {
                    const smsRes = await (telnyx.messages as any).create({
                        from: senderPhone,
                        to: recipientPhone,
                        text: agentResult.generatedResponse,
                    });
                    providerId = smsRes?.data?.id;
                } catch (sendErr) {
                    console.warn("Telnyx dispatch error in newLeadWelcome:", sendErr);
                }
            }

            // Record message in thread
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

            // Update conversation
            await db
                .update(conversations)
                .set({ lastMessageAt: new Date(), updatedAt: new Date(), status: "open" })
                .where(eq(conversations.id, conversationId));

            // Log activity
            await db.insert(contactActivities).values({
                tenantId: tenant_id,
                contactId: contact_id,
                type: "sms",
                content: `AI Super Agent sent speed-to-lead welcome: "${agentResult.generatedResponse}"`,
                metadata: {
                    autonomous: true,
                    confidence: agentResult.confidence,
                    trigger: "contact.created",
                },
            });

            // Audit run
            await recordAgentRun({
                tenantId: tenant_id,
                agentType: "lead_qualifier",
                contactId: contact_id,
                triggerEvent: "contact.created",
                status: "completed",
                inputContext: {
                    contactId: contact_id,
                    phone: recipientPhone,
                    source: context.contact.profile?.source,
                },
                reasoningSteps: agentResult.reasoning,
                draftOutput: agentResult.generatedResponse,
                actionsTaken: [{ action: "send_sms", to: recipientPhone }],
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
