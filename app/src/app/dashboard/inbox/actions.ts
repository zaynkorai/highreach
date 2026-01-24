"use server";

import { createClient } from "@/lib/supabase/server";
import { Conversation, Message } from "@/types/inbox";
import { revalidatePath } from "next/cache";

export async function getConversations() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (!userData?.tenant_id) throw new Error("No tenant found");

    const { data, error } = await supabase
        .from("conversations")
        .select(`
            *,
            contact:contacts(first_name, last_name, phone, email)
        `)
        .eq("tenant_id", userData.tenant_id) // Explicitly filter to be safe, though RLS should handle it
        .order("last_message_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return {
        conversations: data as Conversation[],
        tenantId: userData.tenant_id
    };
}

export async function getMessages(conversationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data as Message[];
}

export async function sendMessage(conversationId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // 1. Get Tenant ID
    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (!userData) throw new Error("No tenant");

    // 2. Insert Message
    const { data: message, error: msgError } = await supabase
        .from("messages")
        .insert({
            tenant_id: userData.tenant_id,
            conversation_id: conversationId,
            direction: 'outbound',
            content,
            channel: 'sms' // Default to SMS for now
        })
        .select()
        .single();

    if (msgError) throw new Error(msgError.message);

    // 3. Update Conversation
    await supabase
        .from("conversations")
        .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: content,
            status: 'open'
        })
        .eq("id", conversationId);

    // 4. Trigger Telnyx (TODO: integrate actual API call here or via Database Webhook/Edge Function)
    // For now we assume the "Missed Call" workflow handles the first outbound, 
    // but for replies we need a direct call.
    // For MVP, we will just log it.
    console.log("Mock sending SMS:", content);

    revalidatePath("/dashboard/inbox");
    return message;
}

export async function createConversation(contactId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: userData } = await supabase.from("users").select("tenant_id").eq("id", user.id).single();
    if (!userData) throw new Error("No tenant");

    // Check if exists
    const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .eq("contact_id", contactId)
        .single();

    if (existing) return existing;

    const { data, error } = await supabase
        .from("conversations")
        .insert({
            tenant_id: userData.tenant_id,
            contact_id: contactId,
            status: 'open'
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inbox");
    return data;
}
