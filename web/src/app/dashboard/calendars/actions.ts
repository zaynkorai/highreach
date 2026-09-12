"use server";

import { withPermission } from "@/lib/actions/action-handler";
import { CalendarService, CalendarSettingsPayload } from "@/lib/services/calendar.service";
import { revalidatePath } from "next/cache";
import type { AppointmentStatus } from "@/types/calendar";

export async function getCalendars() {
    return await withPermission("calendars.read", async (session) => {
        return await CalendarService.getCalendars(session.tenantId);
    });
}

export async function getIntegrations() {
    return await withPermission("calendars.read", async (session) => {
        return await CalendarService.getIntegrations(session.tenantId);
    });
}

export async function getCalendarWithAvailability(id: string) {
    return await withPermission("calendars.read", async (session) => {
        return await CalendarService.getCalendarWithAvailability(session.tenantId, id);
    });
}

export async function createCalendar(payload: {
    name: string;
    slug: string;
    description?: string;
    duration?: number;
    location?: string;
}) {
    return await withPermission("calendars.write", async (session) => {
        const data = await CalendarService.createCalendar(session.tenantId, payload);
        revalidatePath("/dashboard/calendars");
        return data;
    });
}

export async function updateCalendar(
    id: string,
    payload: {
        name?: string;
        description?: string | null;
        slug?: string;
        duration_minutes?: number;
        timezone?: string;
        buffer_minutes?: number;
        location?: string | null;
        external_account_id?: string | null;
        external_calendar_id?: string | null;
        sync_direction?: string | null;
    }
) {
    return await withPermission("calendars.write", async (session) => {
        await CalendarService.updateCalendar(session.tenantId, id, payload);
        revalidatePath(`/dashboard/calendars/${id}`);
        revalidatePath("/dashboard/calendars");
        return { success: true };
    });
}

export async function updateAvailability(
    calendarId: string,
    availability: Array<{ day_of_week: number; start_time: string; end_time: string }>
) {
    return await withPermission("calendars.write", async (session) => {
        await CalendarService.updateAvailability(session.tenantId, calendarId, availability);
        revalidatePath(`/dashboard/calendars/${calendarId}`);
        return { success: true };
    });
}

export async function deleteCalendar(id: string) {
    return await withPermission("calendars.write", async (session) => {
        await CalendarService.deleteCalendar(session.tenantId, id);
        revalidatePath("/dashboard/calendars");
        return { success: true };
    });
}

// ── Overrides ─────────────────────────────────────────────────
export async function getOverrides(calendarId: string) {
    return await withPermission("calendars.read", async (session) => {
        return await CalendarService.getOverrides(session.tenantId, calendarId);
    });
}

export async function createOverride(payload: {
    calendar_id: string;
    date: string;
    is_unavailable: boolean;
    start_time?: string | null;
    end_time?: string | null;
}) {
    return await withPermission("calendars.write", async (session) => {
        const created = await CalendarService.createOverride(session.tenantId, payload);
        revalidatePath("/dashboard/calendars");
        return created;
    });
}

export async function deleteOverride(id: string) {
    return await withPermission("calendars.write", async (session) => {
        await CalendarService.deleteOverride(session.tenantId, id);
        revalidatePath("/dashboard/calendars");
        return { success: true };
    });
}

// ── Global Calendar Settings ──────────────────────────────────
export async function getCalendarSettings() {
    return await withPermission("calendars.read", async (session) => {
        return await CalendarService.getCalendarSettings(session.tenantId);
    });
}

export async function updateCalendarSettings(settings: CalendarSettingsPayload) {
    return await withPermission("calendars.write", async (session) => {
        const updated = await CalendarService.updateCalendarSettings(session.tenantId, settings);
        revalidatePath("/dashboard/calendars");
        return updated;
    });
}

// ── Appointments ──────────────────────────────────────────────
export async function getAppointments(start: string, end: string) {
    return await withPermission("calendars.read", async (session) => {
        return await CalendarService.getAppointments(session.tenantId, start, end);
    });
}

export async function createManualAppointment(payload: {
    calendar_id: string;
    name: string;
    email: string;
    start_time: string;
    end_time?: string;
    duration_minutes?: number;
    notes?: string;
}) {
    return await withPermission("calendars.write", async (session) => {
        const data = await CalendarService.createManualAppointment(session.tenantId, payload);
        revalidatePath("/dashboard/calendars");
        return data;
    });
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
    return await withPermission("calendars.write", async (session) => {
        const updated = await CalendarService.updateAppointmentStatus(session.tenantId, id, status);
        revalidatePath("/dashboard/calendars");
        return updated;
    });
}

export async function rescheduleAppointment(id: string, startTime: string, endTime: string) {
    return await withPermission("calendars.write", async (session) => {
        const updated = await CalendarService.rescheduleAppointment(session.tenantId, id, startTime, endTime);
        revalidatePath("/dashboard/calendars");
        return updated;
    });
}

export async function updateAppointmentDetails(id: string, payload: { notes?: string; location?: string }) {
    return await withPermission("calendars.write", async (session) => {
        const updated = await CalendarService.updateAppointmentDetails(session.tenantId, id, payload);
        revalidatePath("/dashboard/calendars");
        return updated;
    });
}

export async function cancelAppointment(id: string) {
    return await withPermission("calendars.write", async (session) => {
        await CalendarService.cancelAppointment(session.tenantId, id);
        revalidatePath("/dashboard/calendars");
        return { success: true };
    });
}

// ── Integrations Sync & Disconnect ────────────────────────────
export async function syncExternalCalendarNow(accountId: string) {
    return await withPermission("calendars.write", async (session) => {
        const result = await CalendarService.syncAccountEvents(session.tenantId, accountId);
        revalidatePath("/dashboard/calendars");
        revalidatePath("/dashboard/settings/integrations");
        return result;
    });
}

export async function disconnectIntegration(provider: "google" | "outlook") {
    return await withPermission("settings.write", async (session) => {
        const result = await CalendarService.disconnectIntegration(session.tenantId, provider);
        revalidatePath("/dashboard/calendars");
        revalidatePath("/dashboard/settings/integrations");
        return result;
    });
}
