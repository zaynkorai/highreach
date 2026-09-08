import { inngest } from "@/lib/inngest/client";
import { getWorkflowSetting } from "../utils";
import { db, contacts, tenants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { telnyx } from "@/lib/telnyx";

export const newLeadWelcome = inngest.createFunction(
    { id: "new-lead-welcome" },
    { event: "contact.created" },
    async ({ event, step }) => {
        const { contact_id, tenant_id } = event.data;

        const setting = await step.run("check-settings", () =>
            getWorkflowSetting(tenant_id, "new_lead_sms")
        );

        if (!setting.enabled) return { skipped: true };
        const message = setting.config?.template || "Thanks for contacting us! We will be in touch shortly.";

        const contact = await step.run("fetch-contact", async () => {
            const [data] = await db
                .select({ phone: contacts.phone })
                .from(contacts)
                .where(eq(contacts.id, contact_id))
                .limit(1);
            return data;
        });

        if (!contact?.phone) return { skipped: "no-phone" };

        const tenant = await step.run("fetch-tenant-phone", async () => {
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
