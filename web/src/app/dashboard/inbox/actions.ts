"use server";

import { getSessionWithRole } from "@/lib/auth/session";
import { db, conversations, messages, contacts } from "@/lib/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { Conversation, Message, ChannelType } from "@/types/inbox";
import { revalidatePath } from "next/cache";

export async function getConversations() {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const rows = await db
            .select({
                conversation: conversations,
                contact: contacts,
            })
            .from(conversations)
            .innerJoin(contacts, eq(conversations.contactId, contacts.id))
            .where(eq(conversations.tenantId, session.tenantId))
            .orderBy(desc(conversations.lastMessageAt));

        const formatted = rows.map(({ conversation: c, contact: ct }) => ({
            id: c.id,
            tenant_id: c.tenantId,
            contact_id: c.contactId,
            channel: c.channel as any,
            status: c.status as any,
            last_message_at: c.lastMessageAt ? c.lastMessageAt.toISOString() : c.createdAt.toISOString(),
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

        return {
            success: true,
            data: {
                conversations: formatted as unknown as Conversation[],
                tenantId: session.tenantId,
            },
        };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to fetch conversations" };
    }
}

export async function getMessages(conversationId: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const rows = await db
            .select()
            .from(messages)
            .where(
                and(
                    eq(messages.conversationId, conversationId),
                    eq(messages.tenantId, session.tenantId)
                )
            )
            .orderBy(asc(messages.createdAt));

        const formatted = rows.map((m) => ({
            id: m.id,
            tenant_id: m.tenantId,
            conversation_id: m.conversationId,
            direction: m.direction as any,
            channel: m.channel as any,
            content: m.content,
            metadata: m.metadata as any,
            sent_at: m.sentAt ? m.sentAt.toISOString() : m.createdAt.toISOString(),
            created_at: m.createdAt.toISOString(),
        }));

        return { success: true, data: formatted as unknown as Message[] };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to fetch messages" };
    }
}

export async function sendMessage(
    conversationId: string,
    content: string,
    channel: ChannelType = "sms",
    isInternal: boolean = false
) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        // Verify conversation belongs to this tenant
        const [conv] = await db
            .select({ id: conversations.id })
            .from(conversations)
            .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, session.tenantId)))
            .limit(1);

        if (!conv) {
            return { success: false, error: "Conversation not found or access denied" };
        }

        const [message] = await db
            .insert(messages)
            .values({
                tenantId: session.tenantId,
                conversationId,
                direction: "outbound",
                content,
                channel,
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
                    eq(conversations.tenantId, session.tenantId)
                )
            );

        revalidatePath("/dashboard/inbox");

        const formatted = {
            id: message.id,
            tenant_id: message.tenantId,
            conversation_id: message.conversationId,
            direction: message.direction as any,
            channel: message.channel as any,
            content: message.content,
            sent_at: message.sentAt ? message.sentAt.toISOString() : message.createdAt.toISOString(),
            created_at: message.createdAt.toISOString(),
        };

        return { success: true, data: formatted as unknown as Message };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to send message" };
    }
}

export async function createConversation(contactId: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        // Verify contact belongs to this tenant
        const [contact] = await db
            .select({ id: contacts.id })
            .from(contacts)
            .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, session.tenantId)))
            .limit(1);

        if (!contact) {
            return { success: false, error: "Contact not found or access denied" };
        }

        const [existing] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.contactId, contactId),
                    eq(conversations.tenantId, session.tenantId)
                )
            )
            .limit(1);

        if (existing) {
            return {
                success: true,
                data: {
                    id: existing.id,
                    tenant_id: existing.tenantId,
                    contact_id: existing.contactId,
                    status: existing.status,
                    last_message_at: existing.lastMessageAt ? existing.lastMessageAt.toISOString() : existing.createdAt.toISOString(),
                    created_at: existing.createdAt.toISOString(),
                    updated_at: existing.updatedAt.toISOString(),
                },
            };
        }

        const [created] = await db
            .insert(conversations)
            .values({
                tenantId: session.tenantId,
                contactId,
                status: "open",
            })
            .returning();

        revalidatePath("/dashboard/inbox");
        return {
            success: true,
            data: {
                id: created.id,
                tenant_id: created.tenantId,
                contact_id: created.contactId,
                status: created.status,
                last_message_at: created.lastMessageAt ? created.lastMessageAt.toISOString() : created.createdAt.toISOString(),
                created_at: created.createdAt.toISOString(),
                updated_at: created.updatedAt.toISOString(),
            },
        };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to create conversation" };
    }
}

export async function updateConversationStatus(conversationId: string, status: "open" | "closed") {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        await db
            .update(conversations)
            .set({ status, updatedAt: new Date() })
            .where(
                and(
                    eq(conversations.id, conversationId),
                    eq(conversations.tenantId, session.tenantId)
                )
            );

        revalidatePath("/dashboard/inbox");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to update status" };
    }
}
