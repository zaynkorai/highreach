
import { inngest } from "@/lib/inngest/client";
import { getWorkflowSetting } from "../utils";
import { db, opportunities, contacts, contactActivities } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { resend } from "@/lib/resend";

export const dealWonNotification = inngest.createFunction(
    { id: "deal-won-notification" },
    { event: "opportunity.stage_changed" },
    async ({ event, step }) => {
        if (event.data.status !== "won") return { skipped: "not-won" };

        const { tenant_id, opportunity_id } = event.data;
        const setting = await step.run("check-settings", () =>
            getWorkflowSetting(tenant_id, "deal_won_notification")
        );

        if (!setting.enabled) return { skipped: true };

        const opp = await step.run("fetch-opportunity", async () => {
            const [data] = await db
                .select({
                    id: opportunities.id,
                    title: opportunities.title,
                    value: opportunities.value,
                    contactId: opportunities.contactId,
                })
                .from(opportunities)
                .where(and(eq(opportunities.id, opportunity_id), eq(opportunities.tenantId, tenant_id)))
                .limit(1);
            return data;
        });

        if (!opp) return { error: "Opportunity not found" };

        const contact = await step.run("fetch-contact", async () => {
            const [data] = await db
                .select()
                .from(contacts)
                .where(and(eq(contacts.id, opp.contactId), eq(contacts.tenantId, tenant_id)))
                .limit(1);
            return data;
        });

        const template = setting.config?.template || `Congratulations! The deal "${opp.title}" ($${opp.value}) has been marked as won!`;

        await step.run("send-notification", async () => {
            if (contact?.email && process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_placeholder")) {
                try {
                    await resend.emails.send({
                        from: process.env.RESEND_FROM_EMAIL || "HighReach <onboarding@resend.dev>",
                        to: [contact.email],
                        subject: `Deal Won: ${opp.title}`,
                        text: template,
                    });
                } catch (err: any) {
                    console.warn("Deal won email error:", err.message);
                }
            } else {
                console.log(`[Deal Won Notice] Tenant: ${tenant_id} Deal: ${opp.title} (${opp.value})`);
            }

            if (contact?.id) {
                await db.insert(contactActivities).values({
                    contactId: contact.id,
                    tenantId: tenant_id,
                    type: "deal_won",
                    content: `Deal "${opp.title}" won ($${opp.value}). Notice sent.`,
                    metadata: { opportunity_id: opp.id },
                });
            }
        });

        return { status: "deal_won_notified", opportunity_id: opp.id };
    }
);
