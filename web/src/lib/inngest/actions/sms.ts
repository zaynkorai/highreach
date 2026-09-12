import { telnyx } from "@/lib/telnyx";
import { formatTemplate } from "../utils/helpers";
import { WorkflowNode } from "../types";
import { db } from "@/lib/db";
import { tenants, contacts, contactActivities, usageLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function handleSendSms(
    node: WorkflowNode,
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    let to = triggerData.contact?.phone || triggerData.phone || triggerData.from_number;
    let contactId = triggerData.contact?.id || triggerData.contact_id || triggerData.id;

    if (!to && contactId) {
        const [found] = await db
            .select({ phone: contacts.phone, id: contacts.id })
            .from(contacts)
            .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId)))
            .limit(1);
        if (found?.phone) {
            to = found.phone;
        }
    }

    if (!to) {
        throw new Error("No phone number found for SMS destination");
    }

    const [tenant] = await db
        .select({ phoneNumber: tenants.phoneNumber })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

    const fromPhone = tenant?.phoneNumber || "+15550000000";
    const message = formatTemplate(config.template || config.message || "", triggerData);

    let providerId: string | undefined;

    if (telnyx && tenant?.phoneNumber) {
        try {
            const smsRes = await (telnyx.messages as any).create({
                from: fromPhone,
                to,
                text: message
            });
            providerId = smsRes?.data?.id;
        } catch (err: any) {
            console.warn("Telnyx send error in workflow action:", err.message);
        }
    } else {
        console.log(`[Simulated SMS] From: ${fromPhone} To: ${to} Message: ${message}`);
    }

    if (contactId) {
        await db.insert(contactActivities).values({
            contactId,
            tenantId,
            type: "sms_sent",
            content: message,
            metadata: {
                provider: providerId ? "telnyx" : "simulated",
                provider_id: providerId,
                workflow_node_id: node.id
            }
        });
    }

    await db.insert(usageLogs).values({
        tenantId,
        resourceType: "sms",
        quantity: 1,
        metadata: { to, node_id: node.id, simulated: !providerId }
    });
}
