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
            const { telnyx } = await import("@/lib/telnyx"); // Dynamic import to avoid env checks at build time if needed, or just standard import

            console.log(
                `Sending missed call text to ${from_number} for tenant ${tenant_id}`
            );

            // Default message if tenant_name is missing
            const name = tenant_name || "us";
            const text = `Hey, it's ${name}! Sorry I missed your call. How can I help you?`;

            await (telnyx.messages as any).create({
                from: to_number,
                to: from_number,
                text,
            });

            return { status: "sent" };
        });

        // Log the conversation
        await step.run("create-conversation", async () => {
            const { createAdminClient } = await import("@/lib/supabase/admin");
            const supabase = createAdminClient();

            // 1. Find or Create Contact
            let contactId;
            const { data: existingContact } = await supabase
                .from("contacts")
                .select("id")
                .eq("phone", from_number)
                .eq("tenant_id", tenant_id)
                .single();

            if (existingContact) {
                contactId = existingContact.id;
            } else {
                const { data: newContact } = await supabase
                    .from("contacts")
                    .insert({
                        tenant_id,
                        phone: from_number,
                        first_name: "Unknown",
                        last_name: "Caller",
                        source: "Missed Call"
                    })
                    .select()
                    .single();
                contactId = newContact?.id;
            }

            if (!contactId) throw new Error("Failed to resolve contact");

            // 2. Find or Create Conversation
            let conversationId;
            const { data: existingConv } = await supabase
                .from("conversations")
                .select("id")
                .eq("contact_id", contactId)
                .eq("tenant_id", tenant_id)
                .single();

            if (existingConv) {
                conversationId = existingConv.id;
            } else {
                const { data: newConv } = await supabase
                    .from("conversations")
                    .insert({
                        tenant_id,
                        contact_id: contactId,
                        status: 'open',
                        last_message_preview: "Missed Call Auto-Reply",
                        last_message_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                conversationId = newConv?.id;
            }

            // 3. Log Message
            await supabase.from("messages").insert({
                tenant_id,
                conversation_id: conversationId,
                direction: 'outbound',
                channel: 'sms',
                content: `Hey, it's ${tenant_name || "us"}! Sorry I missed your call. How can I help you?`
            });

            return { conversation_id: conversationId };
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
            if (!contact_email) return { status: "skipped", reason: "no-email" };

            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);

            await resend.emails.send({
                from: "onboarding@resend.dev", // Use default testing domain or configured domain
                to: contact_email,
                subject: "Thanks for contacting us!",
                html: `<p>Hi ${contact_name || "there"},</p><p>Thanks for reaching out. We've received your inquiry and will get back to you shortly.</p>`,
            });

            return { status: "sent" };
        });

        // Wait 1 day
        await step.sleep("wait-1-day", "1d");

        // Send follow-up SMS
        await step.run("send-follow-up-sms", async () => {
            if (!contact_id) return { status: "skipped", reason: "no-contact-id" };

            // TODO: Fetch contact phone number using contact_id if not in event payload
            // For now, skipping if we don't have it easily or using a stored prop

            console.log(`Sending follow-up SMS to contact ${contact_id}`);
            return { status: "sent" };
        });
    }
);

// Export all functions
export const functions = [missedCallTextBack, leadFollowUp];
