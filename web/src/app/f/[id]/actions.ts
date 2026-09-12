"use server";

import { db, forms, contacts, formSubmissions, conversations, messages } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

export async function submitForm(formId: string, formData: FormData) {
    // 1. Honeypot check for bot protection
    const honeypot = formData.get("_hp_company");
    if (honeypot) {
        // Silently discard bot submission
        return { success: true };
    }

    // 2. Get form to verify existence and get tenantId
    const [form] = await db
        .select()
        .from(forms)
        .where(eq(forms.id, formId))
        .limit(1);

    if (!form) {
        return { error: "Form not found" };
    }

    const fields = (form.fields as any[]) || [];

    // 3. Server-side Validation
    for (const field of fields) {
        const val = field.type === 'checkbox' && field.options && field.options.length > 0
            ? formData.getAll(field.id)
            : formData.get(field.id);

        if (field.required) {
            const isEmpty = Array.isArray(val)
                ? val.length === 0
                : (!val || String(val).trim() === "");
            if (isEmpty) {
                return { error: `"${field.label}" is required.` };
            }
        }

        if (val && typeof val === "string") {
            if (field.type === 'number') {
                const num = Number(val);
                if (isNaN(num)) {
                    return { error: `"${field.label}" must be a valid number.` };
                }
                if (field.validation?.min !== undefined && num < field.validation.min) {
                    return { error: `"${field.label}" must be at least ${field.validation.min}.` };
                }
                if (field.validation?.max !== undefined && num > field.validation.max) {
                    return { error: `"${field.label}" cannot exceed ${field.validation.max}.` };
                }
            }
            if (field.type === 'text' || field.type === 'textarea') {
                if (field.validation?.min !== undefined && val.length < field.validation.min) {
                    return { error: `"${field.label}" must be at least ${field.validation.min} characters.` };
                }
                if (field.validation?.max !== undefined && val.length > field.validation.max) {
                    return { error: `"${field.label}" cannot exceed ${field.validation.max} characters.` };
                }
                if (field.validation?.pattern) {
                    try {
                        const regex = new RegExp(field.validation.pattern);
                        if (!regex.test(val)) {
                            return { error: `"${field.label}" format is invalid.` };
                        }
                    } catch {
                        // ignore malformed regex
                    }
                }
            }
        }
    }

    // 4. Parse submission data based on form fields
    const submissionData: Record<string, any> = {};

    fields.forEach((field) => {
        if (field.type === 'checkbox' && field.options && field.options.length > 0) {
            const values = formData.getAll(field.id).map(v => String(v));
            if (values.length > 0) {
                submissionData[field.label] = values.join(", ");
            }
        } else {
            const value = formData.get(field.id);
            if (value !== null && value !== "") {
                submissionData[field.label] = value;
            }
        }
    });

    // 5. Identify Contact Information
    const emailField = fields.find((f) => f.type === "email");
    const phoneField = fields.find((f) => f.type === "phone");
    const nameField = fields.find((f) => f.label.toLowerCase().includes("name"));

    const email = emailField ? (formData.get(emailField.id) as string) : null;
    const phone = phoneField ? (formData.get(phoneField.id) as string) : null;
    const fullName = nameField ? (formData.get(nameField.id) as string) : null;

    let contactId: string | null = null;
    let resolvedFirstName = "Unknown";
    let resolvedLastName = "";

    if (fullName) {
        const splitName = fullName.trim().split(/\s+/);
        resolvedFirstName = splitName[0] || "Unknown";
        resolvedLastName = splitName.slice(1).join(" ") || "";
    }

    // 6. Create or Update Contact in CRM
    if (email || phone) {
        let existingContact = null;
        if (email) {
            const [found] = await db
                .select()
                .from(contacts)
                .where(and(eq(contacts.tenantId, form.tenantId), eq(contacts.email, email)))
                .limit(1);
            existingContact = found;
        } else if (phone) {
            const [found] = await db
                .select()
                .from(contacts)
                .where(and(eq(contacts.tenantId, form.tenantId), eq(contacts.phone, phone)))
                .limit(1);
            existingContact = found;
        }

        if (existingContact) {
            contactId = existingContact.id;
            resolvedFirstName = existingContact.firstName || resolvedFirstName;
            resolvedLastName = existingContact.lastName || resolvedLastName;
        } else {
            const [newContact] = await db
                .insert(contacts)
                .values({
                    tenantId: form.tenantId,
                    firstName: resolvedFirstName,
                    lastName: resolvedLastName,
                    email: email || null,
                    phone: phone || null,
                    source: `Form: ${form.name}`,
                    tags: [],
                })
                .returning();

            if (newContact) {
                contactId = newContact.id;
            }
        }
    }

    // 7. Save Submission Record
    const [submission] = await db
        .insert(formSubmissions)
        .values({
            formId: form.id,
            tenantId: form.tenantId,
            contactId,
            data: submissionData,
        })
        .returning();

    // 8. Create/Find Conversation & Insert Inbox Message
    if (contactId) {
        let [conv] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.contactId, contactId),
                    eq(conversations.tenantId, form.tenantId)
                )
            )
            .limit(1);

        if (!conv) {
            const [newConv] = await db
                .insert(conversations)
                .values({
                    tenantId: form.tenantId,
                    contactId,
                    status: "open",
                    lastMessageAt: new Date(),
                })
                .returning();
            conv = newConv;
        }

        if (conv) {
            await db.insert(messages).values({
                tenantId: form.tenantId,
                conversationId: conv.id,
                direction: "inbound",
                channel: "sms",
                content: `### Form Submission: ${form.name}\n\n${Object.entries(submissionData)
                    .map(([k, v]) => `**${k}**: ${v}`)
                    .join("\n")}`,
            });

            await db
                .update(conversations)
                .set({
                    lastMessageAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(conversations.id, conv.id));
        }
    }

    // 9. Trigger Inngest Automation
    try {
        await inngest.send({
            name: "form.submitted",
            data: {
                tenant_id: form.tenantId,
                form_id: form.id,
                submission_id: submission?.id || "pending",
                contact_id: contactId || undefined,
                email: email || undefined,
                phone: phone || undefined,
                contact: contactId ? {
                    id: contactId,
                    first_name: resolvedFirstName,
                    last_name: resolvedLastName,
                    email,
                    phone,
                } : undefined,
                fields: submissionData,
            },
        });
    } catch (err) {
        console.warn("Inngest send error:", err);
    }

    return { success: true, redirectUrl: form.redirectUrl || undefined };
}

