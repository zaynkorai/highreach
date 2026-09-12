import { resend } from "@/lib/resend";
import { formatTemplate } from "../utils/helpers";
import { WorkflowNode } from "../types";
import { db } from "@/lib/db";
import { contacts, contactActivities, usageLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function handleSendEmail(
    node: WorkflowNode,
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    let to = triggerData.contact?.email || triggerData.email;
    let contactId = triggerData.contact?.id || triggerData.contact_id || triggerData.id;

    if (!to && contactId) {
        const [found] = await db
            .select({ email: contacts.email, id: contacts.id })
            .from(contacts)
            .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId)))
            .limit(1);
        if (found?.email) {
            to = found.email;
        }
    }

    if (!to) {
        throw new Error("No email address found for email destination");
    }

    const subject = formatTemplate(config.subject || "New Message", triggerData);
    const content = formatTemplate(config.template || config.content || "", triggerData);

    let providerId: string | undefined;
    const isApiKeyReal = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_placeholder");

    if (isApiKeyReal) {
        try {
            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'HighReach <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                text: content,
            });

            if (error) {
                console.warn("Resend email error in workflow action:", error.message);
            } else if (data?.id) {
                providerId = data.id;
            }
        } catch (err: any) {
            console.warn("Resend email exception in workflow action:", err.message);
        }
    } else {
        console.log(`[Simulated Email] To: ${to} Subject: "${subject}" Content: "${content}"`);
    }

    if (contactId) {
        await db.insert(contactActivities).values({
            contactId,
            tenantId,
            type: "email_sent",
            content: content,
            metadata: {
                provider: providerId ? "resend" : "simulated",
                provider_id: providerId,
                subject,
                workflow_node_id: node.id
            }
        });
    }

    await db.insert(usageLogs).values({
        tenantId,
        resourceType: "email",
        quantity: 1,
        metadata: { to, subject, node_id: node.id, simulated: !providerId }
    });
}
