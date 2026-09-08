import { inngest } from "@/lib/inngest/client";
import { getWorkflowSetting } from "../utils";
import { db, opportunities, contacts, tenants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { telnyx } from "@/lib/telnyx";

export const reviewRequest = inngest.createFunction(
    { id: "review-request" },
    { event: "opportunity.stage_changed" },
    async ({ event, step }) => {
        if (event.data.status !== "won") return { skipped: "not-won" };

        const { tenant_id, opportunity_id } = event.data;
        const setting = await step.run("check-settings", () =>
            getWorkflowSetting(tenant_id, "review_request_sms")
        );

        if (!setting.enabled) return { skipped: true };

        const message = setting.config?.template || "Hi! Could you leave us a review? [Link]";

        // Wait 1 hour
        await step.sleep("wait-1-hour", "1h");

        // Fetch contact phone from opportunity
        const opportunity = await step.run("fetch-opportunity", async () => {
            const [data] = await db
                .select({ contactId: opportunities.contactId })
                .from(opportunities)
                .where(eq(opportunities.id, opportunity_id))
                .limit(1);
            return data;
        });

        if (!opportunity?.contactId) return { error: "no-contact" };

        const contact = await step.run("fetch-contact", async () => {
            const [data] = await db
                .select({ phone: contacts.phone })
                .from(contacts)
                .where(eq(contacts.id, opportunity.contactId))
                .limit(1);
            return data;
        });

        if (!contact?.phone) return { skipped: "no-phone" };

        const tenant = await step.run("fetch-tenant", async () => {
            const [data] = await db
                .select({ phone: tenants.phoneNumber })
                .from(tenants)
                .where(eq(tenants.id, tenant_id))
                .limit(1);
            return data;
        });

        if (!tenant?.phone) return { skipped: "no-tenant-phone" };

        await step.run("send-sms", async () => {
            if (!telnyx) {
                throw new Error("Telnyx client not initialized");
            }
            await (telnyx.messages as any).create({
                from: tenant.phone!,
                to: contact!.phone!,
                text: message,
            });
        });
    }
);
