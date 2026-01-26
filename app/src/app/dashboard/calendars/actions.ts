"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";

// --- Helpers -----------------------------------------------------------------

/**
 * securely retrieves the current user and their tenant_id.
 * returns null if unauthorized or no tenant found.
 */
async function getAuthenticatedContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Use Admin Client to strictly verify tenant association 
    // (Bypasses RLS to ensure we find the user's config truth)
    const adminDb = createAdminClient();
    const { data } = await adminDb
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (!data?.tenant_id) return null;

    return {
        user,
        tenant_id: data.tenant_id,
        adminDb,
        supabase // Regular client for RLS operations if needed
    };
}

/**
 * Standardized error response wrapper
 */
function errorResponse(message: string) {
    console.error(`Action Error: ${message}`);
    return { success: false, error: message };
}

function successResponse(data?: any) {
    return { success: true, data };
}

// --- Actions -----------------------------------------------------------------

export async function getCalendars() {
    const context = await getAuthenticatedContext();
    if (!context) return [];

    const { supabase } = context;
    const { data, error } = await supabase
        .from("calendars")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching calendars:", error);
        return [];
    }
    return data;
}

export async function getIntegrations() {
    const context = await getAuthenticatedContext();
    if (!context) return [];

    const { adminDb, tenant_id } = context;
    const { data, error } = await adminDb
        .from("external_accounts")
        .select("*")
        .eq("tenant_id", tenant_id);

    if (error) {
        console.error("Error fetching integrations:", error);
        return [];
    }
    return data;
}

export async function getCalendarWithAvailability(id: string) {
    const supabase = await createClient(); // RLS handles security here for read
    const { data: calendar, error: calError } = await supabase
        .from("calendars")
        .select("*")
        .eq("id", id)
        .single();

    if (calError) return null;

    const { data: availability } = await supabase
        .from("calendar_availability")
        .select("*")
        .eq("calendar_id", id)
        .order("day_of_week", { ascending: true });

    return { ...calendar, availability: availability || [] };
}

export async function createCalendar(payload: { name: string, slug: string, description?: string, duration?: number, location?: string }) {
    const context = await getAuthenticatedContext();
    if (!context) return errorResponse("Unauthorized");
    const { tenant_id, adminDb } = context;

    const { data, error } = await adminDb
        .from("calendars")
        .insert({
            tenant_id,
            name: payload.name,
            slug: payload.slug,
            description: payload.description || "",
            duration_minutes: payload.duration || 30,
            location: payload.location || "zoom",
            timezone: "UTC"
        })
        .select()
        .single();

    if (error) return errorResponse(error.message);

    revalidatePath("/dashboard/calendars");
    return successResponse(data);
}

export async function updateCalendar(id: string, payload: any) {
    const supabase = await createClient();
    // RLS will ensure user owns the calendar they are updating
    const { error } = await supabase
        .from("calendars")
        .update({
            name: payload.name,
            description: payload.description,
            slug: payload.slug,
            duration_minutes: payload.duration_minutes,
            timezone: payload.timezone,
            buffer_minutes: payload.buffer_minutes,
            location: payload.location,
            external_account_id: payload.external_account_id || null,
            external_calendar_id: payload.external_calendar_id || null,
            sync_direction: payload.sync_direction || 'off'
        })
        .eq("id", id);

    if (error) return errorResponse(error.message);

    revalidatePath(`/dashboard/calendars/${id}`);
    revalidatePath("/dashboard/calendars");
    return successResponse();
}

export async function updateAvailability(calendarId: string, availability: any[]) {
    const supabase = await createClient();

    // Transaction-like approach: Delete old -> Insert new
    // 1. Delete existing
    const { error: deleteError } = await supabase
        .from("calendar_availability")
        .delete()
        .eq("calendar_id", calendarId);

    if (deleteError) return errorResponse(deleteError.message);

    // 2. Insert new
    if (availability.length > 0) {
        const { error: insertError } = await supabase
            .from("calendar_availability")
            .insert(availability.map(a => ({
                calendar_id: calendarId,
                day_of_week: a.day_of_week,
                start_time: a.start_time,
                end_time: a.end_time
            })));

        if (insertError) return errorResponse(insertError.message);
    }

    revalidatePath(`/dashboard/calendars/${calendarId}`);
    return successResponse();
}

export async function deleteCalendar(id: string) {
    console.log("Deleting calendar:", id);
    const context = await getAuthenticatedContext();
    if (!context) return errorResponse("Unauthorized");
    const { tenant_id, adminDb } = context;

    // Use Admin DB to strictly enforce tenant ownership
    // This avoids RLS "silent failures" where it looks like it worked but deleted nothing
    const { error, count } = await adminDb
        .from("calendars")
        .delete({ count: "exact" })
        .eq("id", id)
        .eq("tenant_id", tenant_id); // Verification

    if (error) return errorResponse(error.message);
    if (count === 0) return errorResponse("Calendar not found or access denied");

    revalidatePath("/dashboard/calendars");
    return successResponse();
}

export async function getAppointments(start: string, end: string) {
    const context = await getAuthenticatedContext();
    if (!context) return [];

    // Using AdminDB with tenant filter is often safer/faster than complex RLS joins for dashboards
    // allowing us to select related contact data easily
    const { adminDb, tenant_id } = context;

    const { data, error } = await adminDb
        .from('appointments')
        .select(`
            *,
            contact:contacts(first_name, last_name, email, phone),
            calendar:calendars(name)
        `)
        .eq('tenant_id', tenant_id)
        .gte('start_time', start)
        .lte('end_time', end);

    if (error) {
        console.error("Error fetching appointments:", error);
        return [];
    }
    return data;
}

export async function createManualAppointment(payload: any) {
    const context = await getAuthenticatedContext();
    if (!context) return errorResponse("Unauthorized");
    const { tenant_id, adminDb } = context;

    // 1. Find or Create Contact
    let contactId;
    const { data: existingContact } = await adminDb
        .from("contacts")
        .select("id")
        .eq("email", payload.email)
        .eq("tenant_id", tenant_id)
        .single();

    if (existingContact) {
        contactId = existingContact.id;
    } else {
        const { data: newContact, error: contactError } = await adminDb
            .from("contacts")
            .insert({
                tenant_id,
                first_name: payload.name.split(" ")[0],
                last_name: payload.name.split(" ").slice(1).join(" "),
                email: payload.email,
                source: "Manual Booking"
            })
            .select()
            .single();

        if (contactError) return errorResponse(contactError.message);
        contactId = newContact.id;
    }

    // 2. Create Appointment
    const { data, error } = await adminDb
        .from("appointments")
        .insert({
            calendar_id: payload.calendar_id,
            tenant_id,
            contact_id: contactId,
            start_time: payload.start_time,
            end_time: payload.end_time,
            status: "confirmed",
            notes: "Manual Entry"
        })
        .select()
        .single();

    if (error) return errorResponse(error.message);

    revalidatePath("/dashboard/calendars");

    // 3. Trigger Automation & Sync
    await inngest.send({
        name: "appointment.booked",
        data: {
            appointment_id: data.id,
            tenant_id,
            contact_id: contactId,
            calendar_id: payload.calendar_id,
            start_time: payload.start_time
        }
    });

    return successResponse(data);
}

export async function cancelAppointment(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);

    if (error) return errorResponse(error.message);
    revalidatePath("/dashboard/calendars");
    return successResponse();
}
