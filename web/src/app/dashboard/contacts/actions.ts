"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreateContactDTO, UpdateContactDTO } from "@/types/contact";
import { contactSchema } from "@/lib/validations/contact";
import { inngest } from "@/lib/inngest/client";

export async function createContact(data: CreateContactDTO) {
    try {
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
            return { success: false, error: "Validation failed", details: validatedFields.error.flatten() };
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // Get user's tenant
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (userError || !userData) {
            return { success: false, error: "User has no tenant assigned" };
        }

        const { error, data: insertedData } = await supabase.from("contacts").insert({
            tenant_id: userData.tenant_id,
            first_name: validatedFields.data.firstName,
            last_name: validatedFields.data.lastName || null,
            email: validatedFields.data.email || null,
            phone: validatedFields.data.phone || null,
            source: validatedFields.data.source || "manual",
            tags: validatedFields.data.tags || [],
        }).select().single();

        if (error) {
            return { success: false, error: error.message };
        }

        if (insertedData) {
            await inngest.send({
                name: "contact.created",
                data: {
                    contact_id: insertedData.id,
                    tenant_id: userData.tenant_id,
                    source: insertedData.source || "manual",
                },
            });
        }

        revalidatePath("/dashboard/contacts");
        return { success: true, data: insertedData };
    } catch (e: any) {
        console.error("Create Contact Error:", e);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function updateContact(id: string, data: UpdateContactDTO) {
    try {
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
            return { success: false, error: "Validation failed", details: validatedFields.error.flatten() };
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
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        console.error("Update Contact Error:", e);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function deleteContact(id: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from("contacts").delete().eq("id", id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        console.error("Delete Contact Error:", e);
        return { success: false, error: "An unexpected error occurred" };
    }
}

import { parse } from "csv-parse/sync";

export async function uploadCSV(formData: FormData) {
    try {
        const supabase = await createClient();

        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file uploaded" };
        }

        const text = await file.text();

        // Parse CSV
        let rawData;
        try {
            rawData = parse(text, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
        } catch (e: any) {
            return { success: false, error: "Failed to parse CSV: " + (e.message || "Invalid format") };
        }

        if (!rawData || rawData.length === 0) {
            return { success: false, error: "No records found in CSV" };
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (!userData?.tenant_id) return { success: false, error: "User has no tenant assigned" };

        let successCount = 0;
        const failedRows: any[] = [];
        const contactsToInsert = [];

        // Iterate and Validate
        for (let i = 0; i < (rawData as any[]).length; i++) {
            const row = (rawData as any[])[i];
            const mappedData = {
                firstName: row['firstName'] || row['First Name'] || row['first name'] || row['first_name'] || row['Name'] || row['name'],
                lastName: row['lastName'] || row['Last Name'] || row['last name'] || row['last_metric'] || row['last_name'] || "",
                email: row['email'] || row['Email'] || row['E-mail'] || "",
                phone: row['phone'] || row['Phone'] || row['Phone Number'] || row['phone_number'] || "",
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
            } else {
                failedRows.push({
                    row: i + 1,
                    data: mappedData,
                    errors: validatedFields.error.flatten().fieldErrors
                });
            }
        }

        if (contactsToInsert.length > 0) {
            const { error: insertError } = await supabase.from("contacts").insert(contactsToInsert);
            if (insertError) {
                return { success: false, error: "Database error during bulk insert: " + insertError.message };
            }
            successCount = contactsToInsert.length;
        }

        revalidatePath("/dashboard/contacts");
        return {
            success: true,
            successCount,
            failedCount: failedRows.length,
            details: failedRows.length > 0 ? failedRows : undefined
        };
    } catch (e: any) {
        console.error("CSV Upload Error:", e);
        return { success: false, error: "An unexpected error occurred during upload" };
    }
}

export async function bulkDeleteContacts(ids: string[]) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const { error } = await supabase
            .from("contacts")
            .delete()
            .in("id", ids);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        console.error("Bulk Delete Error:", e);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function bulkAddTags(ids: string[], tags: string[]) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        // Fetch current tags for these contacts
        const { data: contacts, error: fetchError } = await supabase
            .from("contacts")
            .select("id, tags")
            .in("id", ids);

        if (fetchError) return { success: false, error: fetchError.message };

        const updates = (contacts as any[]).map(contact => {
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
    } catch (e: any) {
        console.error("Bulk Add Tags Error:", e);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function getContactActivities(contactId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("contact_activities")
            .select("*")
            .eq("contact_id", contactId)
            .order("created_at", { ascending: false });

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: "Failed to fetch activities" };
    }
}

export async function createActivity(
    contactId: string,
    type: 'note' | 'call_log' | 'sms' | 'email' | 'system',
    content: string
) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        // Get tenant
        const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (!userData) return { success: false, error: "User has no tenant" };

        const { error } = await supabase.from("contact_activities").insert({
            contact_id: contactId,
            tenant_id: userData.tenant_id,
            type,
            content,
            created_by: user.id
        });

        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to create activity" };
    }
}

export async function getContactViews() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("contact_views")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: "Failed to fetch views" };
    }
}

export async function saveContactView(name: string, filters: any) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (!userData) return { success: false, error: "User has no tenant" };

        const { error } = await supabase.from("contact_views").insert({
            tenant_id: userData.tenant_id,
            name,
            filters,
            created_by: user.id
        });

        if (error) return { success: false, error: error.message };
        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to save view" };
    }
}

export async function deleteContactView(id: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from("contact_views").delete().eq("id", id);
        if (error) return { success: false, error: error.message };
        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to delete view" };
    }
}
