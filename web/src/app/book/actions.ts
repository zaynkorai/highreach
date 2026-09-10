"use server";

import { db, calendars, calendarAvailability, appointments, contacts } from "@/lib/db";
import { eq, and, ne, gte, lte, asc } from "drizzle-orm";
import { addMinutes, areIntervalsOverlapping } from "date-fns";
import { format, toZonedTime, fromZonedTime } from "date-fns-tz";

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
 */
export async function getAvailableSlots(calendarId: string, dateStr: string, userTimezone: string) {
    // 1. Fetch Calendar Configuration & Availability Rules
    const [calendar] = await db
        .select()
        .from(calendars)
        .where(eq(calendars.id, calendarId))
        .limit(1);

    if (!calendar) throw new Error("Calendar not found");

    const duration = calendar.durationMinutes;
    const buffer = calendar.bufferMinutes;
    const calendarTimezone = calendar.timezone || "UTC";

    // Step 2: Get all availability rules
    const availabilities = await db
        .select()
        .from(calendarAvailability)
        .where(eq(calendarAvailability.calendarId, calendarId));

    if (!availabilities || availabilities.length === 0) return [];

    // Step 3: Fetch Existing Appointments (Conflicts)
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

    const potentialSlots: Date[] = [];
    const daysToCheck = [-1, 0, 1];

    for (const offset of daysToCheck) {
        const [y, m, d] = dateStr.split("-").map(Number);
        const refDate = new Date(Date.UTC(y, m - 1, d + offset, 12, 0, 0));
        const dayInCalTzStr = format(toZonedTime(refDate, calendarTimezone), "yyyy-MM-dd");
        const dayOfWeekInCalTz = toZonedTime(refDate, calendarTimezone).getDay();

        const rulesForDay = availabilities.filter((a) => a.dayOfWeek === dayOfWeekInCalTz);

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

    // Filter slots that fall on the requested date in user's timezone and don't collide with appointments
    const slots: string[] = [];
    for (const slot of potentialSlots) {
        const userZoned = toZonedTime(slot, userTimezone);
        const slotDateStr = format(userZoned, "yyyy-MM-dd");

        if (slotDateStr === dateStr) {
            const slotEnd = addMinutes(slot, duration);

            const hasConflict = existingAppointments.some((appt) =>
                areIntervalsOverlapping(
                    { start: slot, end: slotEnd },
                    { start: appt.startTime, end: appt.endTime }
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
 * Creates a new appointment securely.
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

        if (!calendar) {
            return { success: false, error: "Calendar not found" };
        }

        const tenantId = calendar.tenantId;
        const requestedStart = new Date(payload.start_time);
        const requestedEnd = payload.end_time
            ? new Date(payload.end_time)
            : addMinutes(requestedStart, calendar.durationMinutes);

        // Conflict check to prevent double bookings
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

        const hasConflict = conflictingAppointments.length > 0;
        if (hasConflict) {
            return { success: false, error: "The selected time slot is no longer available. Please select another slot." };
        }

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
            const splitName = payload.name ? payload.name.split(" ") : ["Unknown"];
            const [newContact] = await db
                .insert(contacts)
                .values({
                    tenantId,
                    firstName: splitName[0],
                    lastName: splitName.slice(1).join(" ") || "",
                    email: payload.email,
                    phone: payload.phone || null,
                    source: "Booking: " + (payload.calendar_name || calendar.name || "Widget"),
                    tags: [],
                })
                .returning();
            contactId = newContact.id;
        }

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
                location: payload.location || calendar.location || null,
            })
            .returning();

        return { success: true, bookingId: data.id };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create appointment" };
    }
}
