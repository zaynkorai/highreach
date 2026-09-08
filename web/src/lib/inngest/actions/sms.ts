import { telnyx } from "@/lib/telnyx";
import { formatTemplate } from "../utils/helpers";
import { WorkflowNode } from "../types";
import { db } from "@/lib/db";
import { tenants, contactActivities, usageLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function handleSendSms(
    node: WorkflowNode,
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const to = triggerData.contact?.phone || triggerData.phone;
    if (!to) throw new Error("No phone number found for SMS");

    const [tenant] = await db
        .select({ phoneNumber: tenants.phoneNumber })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

    if (!tenant?.phoneNumber) throw new Error("Tenant has no phone number configured");

    const message = formatTemplate(config.template, triggerData);

    if (!telnyx) {
        throw new Error("TELNYX_API_KEY is not set. SMS cannot be sent.");
    }

    await (telnyx.messages as any).create({
        from: tenant.phoneNumber,
        to,
        text: message
    });

    if (triggerData.contact?.id) {
        await db.insert(contactActivities).values({
            contactId: triggerData.contact.id,
            tenantId: tenantId,
            type: "sms_sent",
            content: message,
            metadata: { provider: "telnyx", workflow_node_id: node.id }
        });
    }

    await db.insert(usageLogs).values({
        tenantId: tenantId,
        resourceType: "sms",
        quantity: 1,
        metadata: { to, node_id: node.id }
    });
}
