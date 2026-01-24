"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreateContactDTO, UpdateContactDTO } from "@/types/contact";
import { contactSchema } from "@/lib/validations/contact";

export async function createContact(data: CreateContactDTO) {
    const supabase = await createClient();

    // 1. Validation Logic
    const validatedFields = contactSchema.safeParse({
        firstName: data.first_name,
        lastName: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        tags: data.tags || [],
        source: data.source || "manual",
    });

    if (!validatedFields.success) {
        throw new Error("Validation failed");
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Get user's tenant
    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (!userData) {
        throw new Error("User has no tenant assigned");
    }

    const { error } = await supabase.from("contacts").insert({
        tenant_id: userData.tenant_id,
        first_name: validatedFields.data.firstName,
        last_name: validatedFields.data.lastName || null,
        email: validatedFields.data.email || null,
        phone: validatedFields.data.phone || null,
        source: validatedFields.data.source || "manual",
        tags: validatedFields.data.tags || [],
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/contacts");
    return { success: true };
}

export async function updateContact(id: string, data: UpdateContactDTO) {
    const supabase = await createClient();

    // 1. Validation Logic
    const validatedFields = contactSchema.safeParse({
        firstName: data.first_name,
        lastName: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        tags: data.tags || [],
        source: data.source || "manual",
    });

    if (!validatedFields.success) {
        throw new Error("Validation failed");
    }

    const { error } = await supabase
        .from("contacts")
        .update({
            first_name: validatedFields.data.firstName,
            last_name: validatedFields.data.lastName || null,
            email: validatedFields.data.email || null,
            phone: validatedFields.data.phone || null,
            tags: validatedFields.data.tags,
            source: validatedFields.data.source,
        })
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/contacts");
    return { success: true };
}

export async function deleteContact(id: string) {
    const supabase = await createClient();

    const { error } = await supabase.from("contacts").delete().eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/contacts");
    return { success: true };
}

import { parse } from "csv-parse/sync";

export async function uploadCSV(formData: FormData) {
    const supabase = await createClient();

    const file = formData.get("file") as File;
    if (!file) {
        return { error: "No file uploaded" };
    }

    const text = await file.text();

    // Parse CSV
    let data;
    try {
        data = parse(text, {
            columns: true,
            skip_empty_lines: true,
        });
    } catch (e) {
        console.error("CSV Parse Error", e);
        return { error: "Failed to parse CSV" };
    }

    if (!data || data.length === 0) {
        return { error: "No records found in CSV" };
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (!userData) {
        return { error: "User has no tenant assigned" };
    }

    let successCount = 0;
    let failedCount = 0;

    const contactsToInsert = [];

    // Iterate and Validatate
    for (const row of data as any[]) {
        // Map common CSV headers to our schema keys
        // Heuristic mapping: 'First Name' -> firstName, 'Email' -> email, etc.
        // We will accept: firstName, lastName, email, phone (case insensitive check usually good, but let's stick to simple key checks first or map commonly used ones)

        const mappedData = {
            // Check for 'firstName' or 'First Name' or 'first_name'
            firstName: row['firstName'] || row['First Name'] || row['first_name'] || row['Name'],
            lastName: row['lastName'] || row['Last Name'] || row['last_name'] || "",
            email: row['email'] || row['Email'] || row['E-mail'] || "",
            phone: row['phone'] || row['Phone'] || row['Phone Number'] || "",
        };

        const validatedFields = contactSchema.safeParse(mappedData);

        if (validatedFields.success) {
            contactsToInsert.push({
                tenant_id: userData.tenant_id,
                first_name: validatedFields.data.firstName,
                last_name: validatedFields.data.lastName || null,
                email: validatedFields.data.email || null,
                phone: validatedFields.data.phone || null,
                source: "import",
            });
            successCount++;
        } else {
            failedCount++;
        }
    }

    if (contactsToInsert.length > 0) {
        const { error } = await supabase.from("contacts").insert(contactsToInsert);
        if (error) {
            console.error("Bulk insert failed", error);
            return { error: "Failed to save contacts to database" };
        }
    }

    revalidatePath("/dashboard/contacts");
    return { success: true, successCount, failedCount };
}

export async function bulkDeleteContacts(ids: string[]) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("contacts")
        .delete()
        .in("id", ids);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/contacts");
    return { success: true };
}

export async function bulkAddTags(ids: string[], tags: string[]) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Fetch current tags for these contacts
    const { data: contacts, error: fetchError } = await supabase
        .from("contacts")
        .select("id, tags")
        .in("id", ids);

    if (fetchError) throw new Error(fetchError.message);

    const updates = contacts.map(contact => {
        const currentTags = contact.tags || [];
        const newTags = Array.from(new Set([...currentTags, ...tags]));
        return supabase
            .from("contacts")
            .update({ tags: newTags })
            .eq("id", contact.id);
    });

    await Promise.all(updates);

    revalidatePath("/dashboard/contacts");
    return { success: true };
}

export async function getContactActivities(contactId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("contact_activities")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

export async function createActivity(
    contactId: string,
    type: 'note' | 'call_log' | 'sms' | 'email' | 'system',
    content: string
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get tenant
    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (!userData) throw new Error("User has no tenant");

    const { error } = await supabase.from("contact_activities").insert({
        contact_id: contactId,
        tenant_id: userData.tenant_id,
        type,
        content,
        created_by: user.id
    });

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function getContactViews() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("contact_views")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
}

export async function saveContactView(name: string, filters: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (!userData) throw new Error("User has no tenant");

    const { error } = await supabase.from("contact_views").insert({
        tenant_id: userData.tenant_id,
        name,
        filters,
        created_by: user.id
    });

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/contacts");
    return { success: true };
}

export async function deleteContactView(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("contact_views").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/contacts");
    return { success: true };
}
