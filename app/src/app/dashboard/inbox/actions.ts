"use server";

import { getSessionDetail } from "@/lib/supabase/session";
import { Conversation, Message, ChannelType } from "@/types/inbox";
import { revalidatePath } from "next/cache";

export async function getConversations() {
    try {
        const { tenantId, supabase } = await getSessionDetail();
        if (!tenantId) return { success: false, error: "Unauthorized" };

        const { data, error } = await supabase
            .from("conversations")
            .select(`
                *,
                contact:contacts(id, first_name, last_name, phone, email, tags)
            `)
            .eq("tenant_id", tenantId)
            .order("last_message_at", { ascending: false });

        if (error) return { success: false, error: error.message };

        return {
            success: true,
            data: {
                conversations: data as Conversation[],
                tenantId
            }
        };
    } catch (e: any) {
        return { success: false, error: "Failed to fetch conversations" };
    }
}

export async function getMessages(conversationId: string) {
    try {
        const { supabase } = await getSessionDetail();
        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        if (error) return { success: false, error: error.message };
        return { success: true, data: data as Message[] };
    } catch (e: any) {
        return { success: false, error: "Failed to fetch messages" };
    }
}

export async function sendMessage(conversationId: string, content: string, channel: ChannelType = 'sms', isInternal: boolean = false) {
    try {
        const { tenantId, supabase } = await getSessionDetail();
        if (!tenantId) return { success: false, error: "Unauthorized" };

        const { data: message, error: msgError } = await supabase
            .from("messages")
            .insert({
                tenant_id: tenantId,
                conversation_id: conversationId,
                direction: 'outbound',
                content,
                channel,
                is_internal: isInternal
            })
            .select()
            .single();

        if (msgError) return { success: false, error: msgError.message };

        await supabase
            .from("conversations")
            .update({
                last_message_at: new Date().toISOString(),
                last_message_preview: content,
                status: 'open'
            })
            .eq("id", conversationId)
            .eq("tenant_id", tenantId);

        revalidatePath("/dashboard/inbox");
        return { success: true, data: message };
    } catch (e: any) {
        return { success: false, error: "Failed to send message" };
    }
}

export async function createConversation(contactId: string) {
    try {
        const { tenantId, supabase } = await getSessionDetail();
        if (!tenantId) return { success: false, error: "Unauthorized" };

        const { data: existing } = await supabase
            .from("conversations")
            .select("*")
            .eq("contact_id", contactId)
            .eq("tenant_id", tenantId)
            .single();

        if (existing) return { success: true, data: existing };

        const { data, error } = await supabase
            .from("conversations")
            .insert({
                tenant_id: tenantId,
                contact_id: contactId,
                status: 'open'
            })
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        revalidatePath("/dashboard/inbox");
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: "Failed to create conversation" };
    }
}
