
import { inngest } from "@/lib/inngest/client";
import { getWorkflowSetting } from "../utils";

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

        // Send Email stub - Resend not integrated yet
        await step.run("send-email-stub", async () => {
            console.log("Would send email for deal won", opportunity_id);
        });
    }
);
