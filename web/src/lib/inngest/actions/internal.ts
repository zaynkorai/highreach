import { db } from "@/lib/db";
import { contactActivities } from "@/lib/db/schema";
import { formatTemplate } from "../utils/helpers";

export async function handleInternalNotification(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const contactId = triggerData.contact?.id || triggerData.contact_id || triggerData.id;
    const message = formatTemplate(config.message || "Internal Notification triggered", triggerData);

    if (contactId) {
        await db.insert(contactActivities).values({
            contactId,
            tenantId,
            type: "internal_notification",
            content: message,
            metadata: {
                notification_channel: config.channel || "app",
                priority: config.priority || "normal",
            }
        });
    }

    console.log(`[Internal Notification] Tenant: ${tenantId} Message: ${message}`);
}

export async function handleCreateTask(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const contactId = triggerData.contact?.id || triggerData.contact_id || triggerData.id;
    const taskTitle = formatTemplate(config.taskTitle || config.title || "Follow-up Task", triggerData);
    const dueDate = config.dueDate || config.due_date || null;

    if (contactId) {
        await db.insert(contactActivities).values({
            contactId,
            tenantId,
            type: "task_created",
            content: `Task: ${taskTitle}`,
            metadata: {
                title: taskTitle,
                due_date: dueDate,
                status: "pending",
                assigned_to: config.assigned_to || null,
            }
        });
    }
}

export async function handleWebhook(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const targetUrl = config.url || config.webhook_url;
    if (!targetUrl) return;

    try {
        const payload = {
            tenant_id: tenantId,
            data: triggerData,
            timestamp: new Date().toISOString(),
        };

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "HighReach-Automations/1.0",
                ...(config.headers || {}),
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        const contactId = triggerData.contact?.id || triggerData.contact_id || triggerData.id;
        if (contactId) {
            await db.insert(contactActivities).values({
                contactId,
                tenantId,
                type: "webhook_sent",
                content: `Webhook sent to ${targetUrl} [${response.status}]`,
                metadata: {
                    url: targetUrl,
                    status_code: response.status,
                    ok: response.ok,
                }
            });
        }
    } catch (err: any) {
        console.warn("Webhook dispatch error in workflow:", err.message);
    }
}
