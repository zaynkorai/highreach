"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/lib/inngest/client";

export async function submitForm(formId: string, formData: FormData) {
    const supabase = createAdminClient();

    // 1. Get form to verify existence and get tenant_id
    const { data: form, error: formError } = await supabase
        .from("forms")
        .select("*")
        .eq("id", formId)
        .single();

    if (formError || !form) {
        return { error: "Form not found" };
    }

    // 2. Parse data based on form fields
    const submissionData: Record<string, any> = {};
    // We expect inputs to be named by their field ID
    const fields = form.fields as any[];

    fields.forEach((field) => {
        const value = formData.get(field.id);
        if (value) {
            submissionData[field.label] = value;
        }
    });

    // 3. Identify Contact Information
    // Simple heuristic: Look for fields by type
    const emailField = fields.find(f => f.type === 'email');
    const phoneField = fields.find(f => f.type === 'phone');
    const nameField = fields.find(f => f.label.toLowerCase().includes('name'));

    const email = emailField ? formData.get(emailField.id) as string : null;
    const phone = phoneField ? formData.get(phoneField.id) as string : null;
    const fullName = nameField ? formData.get(nameField.id) as string : null;

    let contactId = null;

    // 4. Create/Update Contact
    if (email || phone) {
        // Check if contact exists
        let query = supabase.from("contacts").select("id").eq("tenant_id", form.tenant_id);

        if (email) query = query.eq("email", email);
        else if (phone) query = query.eq("phone", phone);

        const { data: existing } = await query.single();

        if (existing) {
            contactId = existing.id;
        } else {
            // Create new contact
            const splitName = fullName ? fullName.split(' ') : ["Unknown"];
            const firstName = splitName[0];
            const lastName = splitName.slice(1).join(' ') || "";

            const { data: newContact, error: createError } = await supabase
                .from("contacts")
                .insert({
                    tenant_id: form.tenant_id,
                    first_name: firstName,
                    last_name: lastName,
                    email: email || null,
                    phone: phone || null,
                    source: `Form: ${form.name}`
                })
                .select()
                .single();

            if (!createError && newContact) {
                contactId = newContact.id;
            }
        }
    }

    // 5. Save Submission
    const { data: submission, error: subError } = await supabase.from("form_submissions").insert({
        form_id: form.id,
        tenant_id: form.tenant_id,
        contact_id: contactId,
        data: submissionData
    }).select().single();

    if (subError) {
        console.error("Submission error", subError);
        return { error: "Failed to save submission" };
    }

    // 6. Create/Find Conversation & Insert Inbox Message
    if (contactId) {
        // Find existing conversation
        const { data: conversation } = await supabase
            .from("conversations")
            .select("id")
            .eq("contact_id", contactId)
            .single();

        let targetConversationId = conversation?.id;

        if (!targetConversationId) {
            const { data: newConv } = await supabase
                .from("conversations")
                .insert({
                    tenant_id: form.tenant_id,
                    contact_id: contactId,
                    status: 'open',
                    last_message_at: new Date().toISOString(),
                })
                .select()
                .single();
            targetConversationId = newConv?.id;
        }

        if (targetConversationId) {
            const previewText = `New submission: ${form.name}`;

            // Insert message
            await supabase.from("messages").insert({
                tenant_id: form.tenant_id,
                conversation_id: targetConversationId,
                direction: 'inbound',
                content: `### Form Submission: ${form.name}\n\n${Object.entries(submissionData).map(([k, v]) => `**${k}**: ${v}`).join('\n')}`,
                channel: 'form',
                is_internal: false
            });

            // Update conversation preview
            await supabase.from("conversations").update({
                last_message_at: new Date().toISOString(),
                last_message_preview: previewText,
                unread_count: 1 // Simple increment or set
            }).eq("id", targetConversationId);
        }
    }

    // 7. Trigger Automation
    await inngest.send({
        name: "form.submitted",
        data: {
            tenant_id: form.tenant_id,
            form_id: form.id,
            submission_id: submission?.id || "pending",
        }
    });

    return { success: true, redirectUrl: form.redirect_url };
}
