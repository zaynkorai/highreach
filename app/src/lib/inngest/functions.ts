import { inngest } from "./client";

// Missed Call Text-Back Workflow
export const missedCallTextBack = inngest.createFunction(
    { id: "missed-call-text-back", retries: 3 },
    { event: "call/missed" },
    async ({ event, step }) => {
        const { tenant_id, from_number, to_number, tenant_name } = event.data;

        // Wait 30 seconds before sending (in case they call back)
        await step.sleep("wait-before-text", "30s");

        // Send SMS via Telnyx
        await step.run("send-sms", async () => {
            // TODO: Implement Telnyx SMS send
            console.log(
                `Sending missed call text to ${from_number} for tenant ${tenant_id}`
            );

            // const response = await telnyx.messages.create({
            //   from: to_number,
            //   to: from_number,
            //   text: `Hey, it's ${tenant_name}! Sorry I missed your call. How can I help you?`,
            // });

            return { status: "sent" };
        });

        // Log the conversation
        await step.run("create-conversation", async () => {
            // TODO: Create conversation in database
            console.log(`Creating conversation for ${from_number}`);
            return { conversation_id: "new-conversation" };
        });
    }
);

// Lead Follow-Up Workflow
export const leadFollowUp = inngest.createFunction(
    { id: "lead-follow-up", retries: 3 },
    { event: "form/submitted" },
    async ({ event, step }) => {
        const { tenant_id, contact_id, contact_email, contact_name } = event.data;

        // Wait 2 minutes
        await step.sleep("wait-2-min", "2m");

        // Send welcome email
        await step.run("send-welcome-email", async () => {
            // TODO: Implement Resend email
            console.log(`Sending welcome email to ${contact_email}`);
            return { status: "sent" };
        });

        // Wait 1 day
        await step.sleep("wait-1-day", "1d");

        // Send follow-up SMS
        await step.run("send-follow-up-sms", async () => {
            // TODO: Implement Telnyx SMS
            console.log(`Sending follow-up SMS to contact ${contact_id}`);
            return { status: "sent" };
        });
    }
);

// Export all functions
export const functions = [missedCallTextBack, leadFollowUp];
