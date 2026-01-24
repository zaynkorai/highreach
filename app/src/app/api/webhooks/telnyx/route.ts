import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { data } = body;
        const { event_type, payload } = data;

        // 1. Handle Inbound Messages
        if (event_type === "message.received") {
            const { from, to, text, direction } = payload;

            // Telnyx 'to' is an array of objects
            const toNumber = to[0]?.phone_number;
            const fromNumber = from?.phone_number;

            if (direction !== "inbound") {
                return NextResponse.json({ message: "Ignored outbound message" });
            }

            const supabase = createAdminClient();

            // A. Find Tenant
            const { data: tenant, error: tenantError } = await supabase
                .from("tenants")
                .select("id, name")
                .eq("phone", toNumber)
                .single();

            if (tenantError || !tenant) {
                console.error(`No tenant found for number ${toNumber}`);
                return NextResponse.json({ message: "No tenant found" }, { status: 200 });
            }

            // B. Find or Create Contact
            let contactId;
            const { data: existingContact } = await supabase
                .from("contacts")
                .select("id")
                .eq("phone", fromNumber)
                .eq("tenant_id", tenant.id)
                .single();

            if (existingContact) {
                contactId = existingContact.id;
            } else {
                const { data: newContact, error: createContactError } = await supabase
                    .from("contacts")
                    .insert({
                        tenant_id: tenant.id,
                        phone: fromNumber,
                        first_name: "Unknown",
                        last_name: "Sender",
                        source: "Inbound SMS"
                    })
                    .select("id")
                    .single();

                if (createContactError) throw createContactError;
                contactId = newContact.id;
            }

            // C. Find or Create Conversation
            let conversationId;
            let currentUnreadCount = 0;
            const { data: existingConv } = await supabase
                .from("conversations")
                .select("id, unread_count")
                .eq("contact_id", contactId)
                .eq("tenant_id", tenant.id)
                .single();

            if (existingConv) {
                conversationId = existingConv.id;
                currentUnreadCount = existingConv.unread_count || 0;
            } else {
                const { data: newConv, error: createConvError } = await supabase
                    .from("conversations")
                    .insert({
                        tenant_id: tenant.id,
                        contact_id: contactId,
                        status: 'open',
                        unread_count: 0 // Will increment below
                    })
                    .select("id")
                    .single();

                if (createConvError) throw createConvError;
                conversationId = newConv.id;
            }

            // D. Insert Message
            const { error: msgError } = await supabase
                .from("messages")
                .insert({
                    tenant_id: tenant.id,
                    conversation_id: conversationId,
                    direction: 'inbound', // Standardize to 'inbound'
                    channel: 'sms',
                    content: text,
                });

            if (msgError) throw msgError;

            // E. Update Conversation Metadata
            await supabase
                .from("conversations")
                .update({
                    last_message_at: new Date().toISOString(),
                    last_message_preview: text,
                    unread_count: currentUnreadCount + 1
                })
                .eq("id", conversationId);

            return NextResponse.json({ success: true });
        }

        // 2. Handle Missed Calls
        if (event_type === "call.hangup") {
            const { to, from, hangup_cause, direction } = payload;

            // Only handle incoming calls
            if (direction !== "incoming") {
                return NextResponse.json({ message: "Ignored outgoing call" });
            }

            // Simple filter: invalid hangup causes for "missed" call logic
            if (hangup_cause === "normal_clearing") {
                return NextResponse.json({ message: "Call was answered (normal_clearing)" });
            }

            const supabase = createAdminClient();

            // Find tenant by phone number
            const { data: tenant, error } = await supabase
                .from("tenants")
                .select("id, name")
                .eq("phone", to)
                .single();

            if (error || !tenant) {
                console.error(`No tenant found for number ${to}: ${error?.message}`);
                return NextResponse.json({ message: "No tenant found" }, { status: 200 });
            }

            // Trigger Inngest event
            await inngest.send({
                name: "call/missed",
                data: {
                    tenant_id: tenant.id,
                    tenant_name: tenant.name,
                    from_number: from,
                    to_number: to,
                    hangup_cause,
                },
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ message: "Ignored event type" });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
