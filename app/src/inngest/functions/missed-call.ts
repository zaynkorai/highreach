
import { inngest } from "@/lib/inngest/client";
import { getWorkflowSetting } from "../utils";
import { telnyx } from "@/lib/telnyx";

export const missedCallAutomation = inngest.createFunction(
    { id: "missed-call-automation" },
    { event: "call.missed" },
    async ({ event, step }) => {
        const { tenant_id, from_number, to_number } = event.data;

        // 1. Check Settings
        const setting = await step.run("check-settings", () =>
            getWorkflowSetting(tenant_id, "missed_call_sms")
        );

        if (!setting.enabled) return { skipped: true, reason: "disabled" };

        const message = setting.config?.template || "Sorry we missed you! How can we help?";

        // 2. Wait a bit
        await step.sleep("natural-delay", "10s");

        // 3. Send SMS
        await step.run("send-sms", async () => {
            await (telnyx.messages as any).create({
                from: to_number,
                to: from_number,
                text: message
            });
        });

        return { success: true, message_sent: message };
    }
);
