"use server";

import {
    db,
    calendars,
    calendarAvailability,
    calendarOverrides,
    externalCalendarEvents,
    appointments,
    contacts,
} from "@/lib/db";
import { eq, and, ne, gte, lte } from "drizzle-orm";
import { addMinutes, areIntervalsOverlapping } from "date-fns";
import { format, toZonedTime, fromZonedTime } from "date-fns-tz";
import { inngest } from "@/lib/inngest/client";

/**
 * Gets public calendar details by slug.
 */
export async function getPublicCalendar(slug: string) {
    try {
        const [found] = await db
            .select({
                id: calendars.id,
                name: calendars.name,
                description: calendars.description,
                duration_minutes: calendars.durationMinutes,
                buffer_minutes: calendars.bufferMinutes,
                timezone: calendars.timezone,
                location: calendars.location,
                slug: calendars.slug,
                tenant_id: calendars.tenantId,
            })
            .from(calendars)
            .where(and(eq(calendars.slug, slug), eq(calendars.isActive, true)))
            .limit(1);

        return found || null;
    } catch (error) {
        console.error("Error fetching public calendar:", error);
        return null;
    }
}

/**
 * Calculates available slots for a given date in a specific timezone.
 * Checks weekly rules, date overrides (vacation/holidays), internal appointments,
 * and external Google/Outlook calendar events if bi-directional sync is active.
 */
export async function getAvailableSlots(calendarId: string, dateStr: string, userTimezone: string) {
    // 1. Fetch Calendar Configuration
    const [calendar] = await db
        .select()
        .from(calendars)
        .where(eq(calendars.id, calendarId))
        .limit(1);

    if (!calendar || !calendar.isActive) throw new Error("Calendar not found or inactive");

    const duration = calendar.durationMinutes;
    const buffer = calendar.bufferMinutes || 0;
    const calendarTimezone = calendar.timezone || "UTC";

    // 2. Fetch Date Overrides (vacations, holidays, custom hours)
    const overrides = await db
        .select()
        .from(calendarOverrides)
        .where(eq(calendarOverrides.calendarId, calendarId));

    // Check if the requested date is marked unavailable all day
    const fullDayBlock = overrides.find((o) => o.date === dateStr && o.isUnavailable);
    if (fullDayBlock) {
        return [];
    }

    // 3. Fetch Recurring Availability Rules
    const availabilities = await db
        .select()
        .from(calendarAvailability)
        .where(eq(calendarAvailability.calendarId, calendarId));

    if (!availabilities || availabilities.length === 0) return [];

    // 4. Fetch Existing HighReach Appointments (Conflicts)
    const queryDate = new Date(dateStr);
    const searchStart = new Date(queryDate.getTime() - 86400000);
    const searchEnd = new Date(queryDate.getTime() + 172800000);

    const existingAppointments = await db
        .select({
            startTime: appointments.startTime,
            endTime: appointments.endTime,
        })
        .from(appointments)
        .where(
            and(
                eq(appointments.calendarId, calendarId),
                ne(appointments.status, "cancelled"),
                gte(appointments.startTime, searchStart),
                lte(appointments.endTime, searchEnd)
            )
        );

    // 5. Fetch External Busy Events (if bi-directional sync enabled)
    let externalBusyEvents: Array<{ startTime: Date; endTime: Date }> = [];
    if (calendar.syncDirection === "bi_directional" && calendar.externalAccountId) {
        externalBusyEvents = await db
            .select({
                startTime: externalCalendarEvents.startTime,
                endTime: externalCalendarEvents.endTime,
            })
            .from(externalCalendarEvents)
            .where(
                and(
                    eq(externalCalendarEvents.externalAccountId, calendar.externalAccountId),
                    gte(externalCalendarEvents.startTime, searchStart),
                    lte(externalCalendarEvents.endTime, searchEnd)
                )
            );
    }

    const potentialSlots: Date[] = [];
    const daysToCheck = [-1, 0, 1];

    for (const offset of daysToCheck) {
        const [y, m, d] = dateStr.split("-").map(Number);
        const refDate = new Date(Date.UTC(y, m - 1, d + offset, 12, 0, 0));
        const dayInCalTzStr = format(toZonedTime(refDate, calendarTimezone), "yyyy-MM-dd");
        const dayOfWeekInCalTz = toZonedTime(refDate, calendarTimezone).getDay();

        // Check if there is an override for this day
        const dayOverride = overrides.find((o) => o.date === dayInCalTzStr);
        if (dayOverride?.isUnavailable) {
            continue; // Day blocked
        }

        let rulesForDay: Array<{ startTime: string; endTime: string }> = [];

        if (dayOverride && dayOverride.startTime && dayOverride.endTime) {
            // Custom hours override for this date
            rulesForDay = [{ startTime: dayOverride.startTime, endTime: dayOverride.endTime }];
        } else {
            // Standard weekly availability
            rulesForDay = availabilities
                .filter((a) => a.dayOfWeek === dayOfWeekInCalTz)
                .map((a) => ({ startTime: a.startTime, endTime: a.endTime }));
        }

        for (const rule of rulesForDay) {
            const [startH, startM] = rule.startTime.split(":").map(Number);
            const [endH, endM] = rule.endTime.split(":").map(Number);

            const startLocalStr = `${dayInCalTzStr}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`;
            const endLocalStr = `${dayInCalTzStr}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;

            let current = fromZonedTime(startLocalStr, calendarTimezone);
            const end = fromZonedTime(endLocalStr, calendarTimezone);

            while (addMinutes(current, duration) <= end) {
                potentialSlots.push(current);
                current = addMinutes(current, duration + buffer);
            }
        }
    }

    // Filter slots matching requested date in user's timezone without conflicts
    const slots: string[] = [];
    const allBusyIntervals = [
        ...existingAppointments.map((a) => ({ start: a.startTime, end: a.endTime })),
        ...externalBusyEvents.map((e) => ({ start: e.startTime, end: e.endTime })),
    ];

    for (const slot of potentialSlots) {
        const userZoned = toZonedTime(slot, userTimezone);
        const slotDateStr = format(userZoned, "yyyy-MM-dd");

        if (slotDateStr === dateStr) {
            const slotEnd = addMinutes(slot, duration);

            const hasConflict = allBusyIntervals.some((busy) =>
                areIntervalsOverlapping(
                    { start: slot, end: slotEnd },
                    { start: busy.start, end: busy.end }
                )
            );

            if (!hasConflict) {
                slots.push(slot.toISOString());
            }
        }
    }

    return Array.from(new Set(slots)).sort();
}

/**
 * Creates a new appointment securely and triggers Inngest push & notifications.
 */
export async function createBooking(calendarId: string, payload: any) {
    if (!payload.email || !payload.start_time) {
        return { success: false, error: "Missing required booking information" };
    }

    try {
        const [calendar] = await db
            .select()
            .from(calendars)
            .where(eq(calendars.id, calendarId))
            .limit(1);

        if (!calendar || !calendar.isActive) {
            return { success: false, error: "Calendar not found or is inactive" };
        }

        const tenantId = calendar.tenantId;
        const requestedStart = new Date(payload.start_time);
        const requestedEnd = payload.end_time
            ? new Date(payload.end_time)
            : addMinutes(requestedStart, calendar.durationMinutes);

        // 1. Conflict check against existing HighReach appointments
        const conflictingAppointments = await db
            .select({ id: appointments.id })
            .from(appointments)
            .where(
                and(
                    eq(appointments.calendarId, calendarId),
                    ne(appointments.status, "cancelled"),
                    gte(appointments.endTime, requestedStart),
                    lte(appointments.startTime, requestedEnd)
                )
            );

        if (conflictingAppointments.length > 0) {
            return { success: false, error: "The selected time slot is no longer available. Please select another slot." };
        }

        // 2. Conflict check against external calendar busy events
        if (calendar.syncDirection === "bi_directional" && calendar.externalAccountId) {
            const conflictingExternal = await db
                .select({ id: externalCalendarEvents.id })
                .from(externalCalendarEvents)
                .where(
                    and(
                        eq(externalCalendarEvents.externalAccountId, calendar.externalAccountId),
                        gte(externalCalendarEvents.endTime, requestedStart),
                        lte(externalCalendarEvents.startTime, requestedEnd)
                    )
                )
                .limit(1);

            if (conflictingExternal.length > 0) {
                return { success: false, error: "The host has a conflicting external appointment at this time." };
            }
        }

        // 3. Find or create contact
        let contactId: string;
        const [existingContact] = await db
            .select({ id: contacts.id })
            .from(contacts)
            .where(
                and(
                    eq(contacts.email, payload.email),
                    eq(contacts.tenantId, tenantId)
                )
            )
            .limit(1);

        if (existingContact) {
            contactId = existingContact.id;
        } else {
            const splitName = payload.name ? payload.name.trim().split(" ") : ["Unknown"];
            const [newContact] = await db
                .insert(contacts)
                .values({
                    tenantId,
                    firstName: splitName[0] || "Unknown",
                    lastName: splitName.slice(1).join(" ") || "",
                    email: payload.email,
                    phone: payload.phone || null,
                    source: "Booking: " + (calendar.name || "Widget"),
                    tags: [],
                })
                .returning();
            contactId = newContact.id;
        }

        // 4. Insert appointment
        const [data] = await db
            .insert(appointments)
            .values({
                calendarId,
                tenantId,
                contactId,
                startTime: requestedStart,
                endTime: requestedEnd,
                status: "confirmed",
                notes: payload.notes || null,
                location: payload.location || calendar.location || "Online",
            })
            .returning();

        // 5. Trigger Inngest Fanout (handles push to external calendar + confirmation emails)
        try {
            await inngest.send({
                name: "appointment.booked",
                data: {
                    appointment_id: data.id,
                    tenant_id: tenantId,
                    contact_id: contactId,
                    calendar_id: calendarId,
                    start_time: data.startTime.toISOString(),
                },
            });
        } catch (inngestErr) {
            console.warn("Inngest send error during booking:", inngestErr);
        }

        return { success: true, bookingId: data.id };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create appointment" };
    }
}
