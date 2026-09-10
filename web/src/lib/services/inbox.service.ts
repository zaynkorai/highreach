import { db, conversations, messages, contacts, tenants } from "@/lib/db";
import { eq, and, desc, asc } from "drizzle-orm";
import type { Conversation, Message, ChannelType } from "@/types/inbox";
import { telnyx } from "@/lib/telnyx";
import { resend } from "@/lib/resend";

export class InboxService {
    static async getConversations(tenantId: string): Promise<Conversation[]> {
        const rows = await db
            .select({
                conversation: conversations,
                contact: contacts,
            })
            .from(conversations)
            .innerJoin(contacts, eq(conversations.contactId, contacts.id))
            .where(eq(conversations.tenantId, tenantId))
            .orderBy(desc(conversations.lastMessageAt));

        return rows.map(({ conversation: c, contact: ct }) => ({
            id: c.id,
            tenant_id: c.tenantId,
            contact_id: c.contactId,
            channel: (c.channel || "sms") as ChannelType,
            status: (c.status || "open") as "open" | "closed",
            last_message_at: c.lastMessageAt ? c.lastMessageAt.toISOString() : c.createdAt.toISOString(),
            unread_count: 0,
            created_at: c.createdAt.toISOString(),
            updated_at: c.updatedAt.toISOString(),
            contact: {
                id: ct.id,
                first_name: ct.firstName,
                last_name: ct.lastName,
                phone: ct.phone,
                email: ct.email,
                tags: ct.tags || [],
            },
        }));
    }

    static async getMessages(tenantId: string, conversationId: string): Promise<Message[]> {
        const rows = await db
            .select()
            .from(messages)
            .where(
                and(
                    eq(messages.conversationId, conversationId),
                    eq(messages.tenantId, tenantId)
                )
            )
            .orderBy(asc(messages.createdAt));

        return rows.map((m) => ({
            id: m.id,
            tenant_id: m.tenantId,
            conversation_id: m.conversationId,
            direction: (m.direction || "inbound") as "inbound" | "outbound",
            channel: (m.channel || "sms") as ChannelType,
            content: m.content,
            metadata: (m.metadata || {}) as Record<string, unknown>,
            sent_at: m.sentAt ? m.sentAt.toISOString() : m.createdAt.toISOString(),
            created_at: m.createdAt.toISOString(),
        }));
    }

    static async sendMessage(
        tenantId: string,
        conversationId: string,
        content: string,
        channel: ChannelType = "sms",
        isInternal: boolean = false
    ): Promise<Message> {
        // Verify conversation belongs to this tenant and fetch associated contact
        const [convData] = await db
            .select({
                conversation: conversations,
                contact: contacts,
            })
            .from(conversations)
            .innerJoin(contacts, eq(conversations.contactId, contacts.id))
            .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId)))
            .limit(1);

        if (!convData) {
            throw new Error("Conversation not found or access denied");
        }

        const metadata: Record<string, any> = isInternal ? { is_internal: true } : {};

        // Dispatch message to external provider if outbound non-internal message
        if (!isInternal) {
            if (channel === "sms") {
                const recipientPhone = convData.contact?.phone;
                if (!recipientPhone) {
                    throw new Error("Cannot send SMS: Contact does not have a phone number");
                }

                const [tenant] = await db
                    .select({ phoneNumber: tenants.phoneNumber, name: tenants.name })
                    .from(tenants)
                    .where(eq(tenants.id, tenantId))
                    .limit(1);

                const senderPhone = tenant?.phoneNumber;
                if (!senderPhone) {
                    throw new Error("Tenant does not have an outbound SMS phone number configured");
                }

                if (!telnyx) {
                    throw new Error("TELNYX_API_KEY is not configured on the server");
                }

                try {
                    const smsRes = await (telnyx.messages as any).create({
                        from: senderPhone,
                        to: recipientPhone,
                        text: content,
                    });
                    metadata.provider = "telnyx";
                    metadata.telnyx_id = smsRes?.data?.id;
                } catch (smsErr: any) {
                    console.error("Failed to send Telnyx SMS:", smsErr);
                    throw new Error(`Failed to send SMS: ${smsErr.message || "Unknown error"}`);
                }
            } else if (channel === "email") {
                const recipientEmail = convData.contact?.email;
                if (!recipientEmail) {
                    throw new Error("Cannot send email: Contact does not have an email address");
                }

                if (!process.env.RESEND_API_KEY) {
                    throw new Error("RESEND_API_KEY is not configured on the server");
                }

                try {
                    const { data: emailData, error: emailErr } = await resend.emails.send({
                        from: "HighReach <onboarding@resend.dev>",
                        to: [recipientEmail],
                        subject: `New message regarding your inquiry`,
                        text: content,
                    });
                    if (emailErr) {
                        throw new Error(emailErr.message);
                    }
                    metadata.provider = "resend";
                    metadata.resend_id = emailData?.id;
                } catch (emailErr: any) {
                    console.error("Failed to send Resend email:", emailErr);
                    throw new Error(`Failed to send email: ${emailErr.message || "Unknown error"}`);
                }
            }
        }

        const [message] = await db
            .insert(messages)
            .values({
                tenantId,
                conversationId,
                direction: "outbound",
                content,
                channel,
                metadata,
            })
            .returning();

        await db
            .update(conversations)
            .set({
                lastMessageAt: new Date(),
                status: "open",
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(conversations.id, conversationId),
                    eq(conversations.tenantId, tenantId)
                )
            );

        return {
            id: message.id,
            tenant_id: message.tenantId,
            conversation_id: message.conversationId,
            direction: (message.direction || "outbound") as "inbound" | "outbound",
            channel: (message.channel || channel) as ChannelType,
            content: message.content,
            is_internal: isInternal,
            metadata: (message.metadata || metadata) as Record<string, unknown>,
            sent_at: message.sentAt ? message.sentAt.toISOString() : message.createdAt.toISOString(),
            created_at: message.createdAt.toISOString(),
        };
    }

    static async createConversation(tenantId: string, contactId: string) {
        // Verify contact belongs to tenant
        const [contact] = await db
            .select({ id: contacts.id })
            .from(contacts)
            .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId)))
            .limit(1);

        if (!contact) {
            throw new Error("Contact not found or access denied");
        }

        const [existing] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.contactId, contactId),
                    eq(conversations.tenantId, tenantId)
                )
            )
            .limit(1);

        if (existing) {
            return {
                id: existing.id,
                tenant_id: existing.tenantId,
                contact_id: existing.contactId,
                status: existing.status,
                last_message_at: existing.lastMessageAt ? existing.lastMessageAt.toISOString() : existing.createdAt.toISOString(),
                created_at: existing.createdAt.toISOString(),
                updated_at: existing.updatedAt.toISOString(),
            };
        }

        const [created] = await db
            .insert(conversations)
            .values({
                tenantId,
                contactId,
                status: "open",
            })
            .returning();

        return {
            id: created.id,
            tenant_id: created.tenantId,
            contact_id: created.contactId,
            status: created.status,
            last_message_at: created.lastMessageAt ? created.lastMessageAt.toISOString() : created.createdAt.toISOString(),
            created_at: created.createdAt.toISOString(),
            updated_at: created.updatedAt.toISOString(),
        };
    }

    static async updateConversationStatus(
        tenantId: string,
        conversationId: string,
        status: "open" | "closed"
    ) {
        const [updated] = await db
            .update(conversations)
            .set({ status, updatedAt: new Date() })
            .where(
                and(
                    eq(conversations.id, conversationId),
                    eq(conversations.tenantId, tenantId)
                )
            )
            .returning({ id: conversations.id });

        if (!updated) {
            throw new Error("Conversation not found or access denied");
        }
    }
}
