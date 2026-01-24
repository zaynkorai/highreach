"use server";

import { createClient } from "@/lib/supabase/server";
import { Conversation, Message, ChannelType } from "@/types/inbox";
import { revalidatePath } from "next/cache";

export async function getConversations() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Unauthorized" };

        const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (!userData?.tenant_id) return { success: false, error: "No tenant found" };

        const { data, error } = await supabase
            .from("conversations")
            .select(`
                *,
                contact:contacts(id, first_name, last_name, phone, email, tags)
            `)
            .eq("tenant_id", userData.tenant_id)
            .order("last_message_at", { ascending: false });

        if (error) return { success: false, error: error.message };

        return {
            success: true,
            data: {
                conversations: data as Conversation[],
                tenantId: userData.tenant_id
            }
        };
    } catch (e: any) {
        return { success: false, error: "Failed to fetch conversations" };
    }
}

export async function getMessages(conversationId: string) {
    try {
        const supabase = await createClient();

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
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Unauthorized" };

        // 1. Get Tenant ID
        const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (!userData) return { success: false, error: "No tenant" };

        // 2. Insert Message
        const { data: message, error: msgError } = await supabase
            .from("messages")
            .insert({
                tenant_id: userData.tenant_id,
                conversation_id: conversationId,
                direction: 'outbound',
                content,
                channel: channel,
                is_internal: isInternal
            })
            .select()
            .single();

        if (msgError) return { success: false, error: msgError.message };

        // 3. Update Conversation
        await supabase
            .from("conversations")
            .update({
                last_message_at: new Date().toISOString(),
                last_message_preview: content,
                status: 'open'
            })
            .eq("id", conversationId)
            .eq("tenant_id", userData.tenant_id); // Security: ensure correct tenant

        console.log("Mock sending SMS:", content);

        revalidatePath("/dashboard/inbox");
        return { success: true, data: message };
    } catch (e: any) {
        return { success: false, error: "Failed to send message" };
    }
}

export async function createConversation(contactId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Unauthorized" };

        const { data: userData } = await supabase.from("users").select("tenant_id").eq("id", user.id).single();
        if (!userData) return { success: false, error: "No tenant" };

        // Check if exists
        const { data: existing } = await supabase
            .from("conversations")
            .select("*")
            .eq("contact_id", contactId)
            .eq("tenant_id", userData.tenant_id)
            .single();

        if (existing) return { success: true, data: existing };

        const { data, error } = await supabase
            .from("conversations")
            .insert({
                tenant_id: userData.tenant_id,
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
