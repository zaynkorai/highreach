"use server";

import { withPermission } from "@/lib/actions/action-handler";
import { InboxService } from "@/lib/services/inbox.service";
import { ContactService } from "@/lib/services/contact.service";
import { revalidatePath } from "next/cache";
import type { ChannelType } from "@/types/inbox";

export async function getConversations() {
    return await withPermission("conversations.read", async (session) => {
        const list = await InboxService.getConversations(session.tenantId);
        return {
            conversations: list,
            tenantId: session.tenantId,
        };
    });
}

export async function getMessages(conversationId: string) {
    return await withPermission("conversations.read", async (session) => {
        const messages = await InboxService.getMessages(session.tenantId, conversationId);
        // Automatically mark as read when messages are fetched
        await InboxService.markConversationAsRead(session.tenantId, conversationId).catch(() => {});
        return messages;
    });
}

export async function sendMessage(
    conversationId: string,
    content: string,
    channel: ChannelType = "sms",
    isInternal: boolean = false
) {
    return await withPermission("conversations.write", async (session) => {
        const message = await InboxService.sendMessage(
            session.tenantId,
            conversationId,
            content,
            channel,
            isInternal
        );
        revalidatePath("/dashboard/inbox");
        return message;
    });
}

export async function markAsRead(conversationId: string) {
    return await withPermission("conversations.write", async (session) => {
        await InboxService.markConversationAsRead(session.tenantId, conversationId);
        return { success: true };
    });
}

export async function toggleStar(conversationId: string) {
    return await withPermission("conversations.write", async (session) => {
        const isStarred = await InboxService.toggleStarConversation(session.tenantId, conversationId);
        revalidatePath("/dashboard/inbox");
        return { isStarred };
    });
}

export async function createConversation(
    contactId: string,
    channel: ChannelType = "sms",
    initialMessage?: string
) {
    return await withPermission("conversations.write", async (session) => {
        const conversation = await InboxService.createConversation(
            session.tenantId,
            contactId,
            channel,
            initialMessage
        );
        revalidatePath("/dashboard/inbox");
        return conversation;
    });
}

export async function updateConversationStatus(
    conversationId: string,
    status: "open" | "closed"
) {
    return await withPermission("conversations.write", async (session) => {
        await InboxService.updateConversationStatus(session.tenantId, conversationId, status);
        revalidatePath("/dashboard/inbox");
        return { success: true };
    });
}

export async function getContactsForNewConversation() {
    return await withPermission("contacts.read", async (session) => {
        const result = await ContactService.getContacts(session.tenantId, { limit: 100 });
        return result.contacts;
    });
}

export async function addContactTag(contactId: string, tag: string) {
    return await withPermission("contacts.write", async (session) => {
        await ContactService.bulkAddTags(session.tenantId, [contactId], [tag]);
        revalidatePath("/dashboard/inbox");
        return { success: true };
    });
}
