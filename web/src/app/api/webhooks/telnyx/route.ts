import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { db, tenants, contacts, conversations, messages } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { data } = body;
        const { event_type, payload } = data;

        // 1. Handle Inbound Messages
        if (event_type === "message.received") {
            const { from, to, text, direction } = payload;

            const toNumber = to[0]?.phone_number;
            const fromNumber = from?.phone_number;

            if (direction !== "inbound") {
                return NextResponse.json({ message: "Ignored outbound message" });
            }

            // A. Find Tenant by phone
            const [tenant] = await db
                .select({ id: tenants.id, name: tenants.name })
                .from(tenants)
                .where(
                    or(
                        eq(tenants.phoneNumber, toNumber),
                        eq(tenants.phoneNumber, toNumber?.replace("+1", ""))
                    )
                )
                .limit(1);

            if (!tenant) {
                console.error(`No tenant found for number ${toNumber}`);
                return NextResponse.json({ message: "No tenant found" }, { status: 200 });
            }

            // B. Find or Create Contact
            let contactId: string;
            const [existingContact] = await db
                .select({ id: contacts.id })
                .from(contacts)
                .where(
                    and(
                        eq(contacts.phone, fromNumber),
                        eq(contacts.tenantId, tenant.id)
                    )
                )
                .limit(1);

            if (existingContact) {
                contactId = existingContact.id;
            } else {
                const [newContact] = await db
                    .insert(contacts)
                    .values({
                        tenantId: tenant.id,
                        phone: fromNumber,
                        firstName: "Unknown",
                        lastName: "Sender",
                        source: "Inbound SMS",
                        tags: [],
                    })
                    .returning();
                contactId = newContact.id;
            }

            // C. Find or Create Conversation
            let conversationId: string;
            const [existingConv] = await db
                .select({ id: conversations.id })
                .from(conversations)
                .where(
                    and(
                        eq(conversations.contactId, contactId),
                        eq(conversations.tenantId, tenant.id)
                    )
                )
                .limit(1);

            if (existingConv) {
                conversationId = existingConv.id;
            } else {
                const [newConv] = await db
                    .insert(conversations)
                    .values({
                        tenantId: tenant.id,
                        contactId,
                        status: "open",
                    })
                    .returning();
                conversationId = newConv.id;
            }

            // D. Insert Message
            await db.insert(messages).values({
                tenantId: tenant.id,
                conversationId,
                direction: "inbound",
                channel: "sms",
                content: text,
            });

            // E. Update Conversation Metadata
            await db
                .update(conversations)
                .set({
                    lastMessageAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(conversations.id, conversationId));

            return NextResponse.json({ success: true });
        }

        // 2. Handle Missed Calls
        if (event_type === "call.hangup") {
            const { to, from, hangup_cause, direction } = payload;

            if (direction !== "incoming") {
                return NextResponse.json({ message: "Ignored outgoing call" });
            }

            if (hangup_cause === "normal_clearing") {
                return NextResponse.json({ message: "Call was answered (normal_clearing)" });
            }

            const [tenant] = await db
                .select({ id: tenants.id, name: tenants.name })
                .from(tenants)
                .where(
                    or(
                        eq(tenants.phoneNumber, to),
                        eq(tenants.phoneNumber, to?.replace("+1", ""))
                    )
                )
                .limit(1);

            if (!tenant) {
                console.error(`No tenant found for number ${to}`);
                return NextResponse.json({ message: "No tenant found" }, { status: 200 });
            }

            try {
                await inngest.send({
                    name: "call.missed",
                    data: {
                        call_control_id: payload.call_control_id,
                        from_number: from,
                        to_number: to,
                        tenant_id: tenant.id,
                        direction: direction,
                    },
                });
            } catch (err) {
                console.warn("Inngest send error:", err);
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ message: "Ignored event type" });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
