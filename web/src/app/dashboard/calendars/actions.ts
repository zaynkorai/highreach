"use server";

import { withPermission } from "@/lib/actions/action-handler";
import { CalendarService } from "@/lib/services/calendar.service";
import { revalidatePath } from "next/cache";

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
    end_time: string;
}) {
    return await withPermission("calendars.write", async (session) => {
        const data = await CalendarService.createManualAppointment(session.tenantId, payload);
        revalidatePath("/dashboard/calendars");
        return data;
    });
}

export async function cancelAppointment(id: string) {
    return await withPermission("calendars.write", async (session) => {
        await CalendarService.cancelAppointment(session.tenantId, id);
        revalidatePath("/dashboard/calendars");
        return { success: true };
    });
}
