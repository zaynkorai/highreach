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
    const { error: subError } = await supabase.from("form_submissions").insert({
        form_id: form.id,
        tenant_id: form.tenant_id,
        contact_id: contactId, // Link if we found/created one
        data: submissionData
    });

    if (subError) {
        console.error("Submission error", subError);
        return { error: "Failed to save submission" };
    }

    // 6. Trigger Automation
    await inngest.send({
        name: "form/submitted",
        data: {
            tenant_id: form.tenant_id,
            form_id: form.id,
            contact_id: contactId,
            contact_email: email,
            contact_name: fullName,
            submission_data: submissionData
        }
    });

    return { success: true, redirectUrl: form.redirect_url };
}
