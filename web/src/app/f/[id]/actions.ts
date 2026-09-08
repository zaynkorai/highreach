"use server";

import { db, forms, contacts, formSubmissions, conversations, messages } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

export async function submitForm(formId: string, formData: FormData) {
    // 1. Get form to verify existence and get tenantId
    const [form] = await db
        .select()
        .from(forms)
        .where(eq(forms.id, formId))
        .limit(1);

    if (!form) {
        return { error: "Form not found" };
    }

    // 2. Parse data based on form fields
    const submissionData: Record<string, any> = {};
    const fields = (form.fields as any[]) || [];

    fields.forEach((field) => {
        const value = formData.get(field.id);
        if (value) {
            submissionData[field.label] = value;
        }
    });

    // 3. Identify Contact Information
    const emailField = fields.find((f) => f.type === "email");
    const phoneField = fields.find((f) => f.type === "phone");
    const nameField = fields.find((f) => f.label.toLowerCase().includes("name"));

    const email = emailField ? (formData.get(emailField.id) as string) : null;
    const phone = phoneField ? (formData.get(phoneField.id) as string) : null;
    const fullName = nameField ? (formData.get(nameField.id) as string) : null;

    let contactId: string | null = null;

    // 4. Create/Update Contact
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
        } else {
            const splitName = fullName ? fullName.split(" ") : ["Unknown"];
            const firstName = splitName[0];
            const lastName = splitName.slice(1).join(" ") || "";

            const [newContact] = await db
                .insert(contacts)
                .values({
                    tenantId: form.tenantId,
                    firstName,
                    lastName,
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

    // 5. Save Submission
    const [submission] = await db
        .insert(formSubmissions)
        .values({
            formId: form.id,
            tenantId: form.tenantId,
            contactId,
            data: submissionData,
        })
        .returning();

    // 6. Create/Find Conversation & Insert Inbox Message
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

    // 7. Trigger Automation
    try {
        await inngest.send({
            name: "form.submitted",
            data: {
                tenant_id: form.tenantId,
                form_id: form.id,
                submission_id: submission?.id || "pending",
            },
        });
    } catch (err) {
        console.warn("Inngest send error:", err);
    }

    return { success: true, redirectUrl: form.redirectUrl || undefined };
}
