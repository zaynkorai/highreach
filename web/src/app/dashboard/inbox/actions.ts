"use server";

import { withPermission } from "@/lib/actions/action-handler";
import { InboxService } from "@/lib/services/inbox.service";
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
        return await InboxService.getMessages(session.tenantId, conversationId);
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

export async function createConversation(contactId: string) {
    return await withPermission("conversations.write", async (session) => {
        const conversation = await InboxService.createConversation(session.tenantId, contactId);
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
