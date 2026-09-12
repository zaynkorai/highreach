import test from "node:test";
import assert from "node:assert/strict";
import { addMinutes, areIntervalsOverlapping, format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
    calendarSchema,
    timeSlotSchema,
    availabilitySchema,
    bookAppointmentSchema,
} from "../app/dashboard/calendars/schemas.ts";

/**
 * Pure helper simulating the core slot generator logic from actions.ts
 */
function calculateTestSlots(params: {
    calendarTimezone: string;
    duration: number;
    buffer: number;
    availabilities: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
    overrides?: Array<{ date: string; isUnavailable: boolean; startTime?: string | null; endTime?: string | null }>;
    existingAppointments?: Array<{ start: Date; end: Date }>;
    externalBusyEvents?: Array<{ start: Date; end: Date }>;
    targetDateStr: string; // YYYY-MM-DD
    userTimezone: string;
}): string[] {
    const {
        calendarTimezone,
        duration,
        buffer,
        availabilities,
        overrides = [],
        existingAppointments = [],
        externalBusyEvents = [],
        targetDateStr,
        userTimezone,
    } = params;

    // Check full-day override
    const fullDayBlock = overrides.find((o) => o.date === targetDateStr && o.isUnavailable);
    if (fullDayBlock) return [];

    const potentialSlots: Date[] = [];
    const daysToCheck = [-1, 0, 1];

    for (const offset of daysToCheck) {
        const [y, m, d] = targetDateStr.split("-").map(Number);
        const refDate = new Date(Date.UTC(y, m - 1, d + offset, 12, 0, 0));
        const dayInCalTzStr = format(toZonedTime(refDate, calendarTimezone), "yyyy-MM-dd");
        const dayOfWeekInCalTz = toZonedTime(refDate, calendarTimezone).getDay();

        const dayOverride = overrides.find((o) => o.date === dayInCalTzStr);
        if (dayOverride?.isUnavailable) continue;

        let rulesForDay: Array<{ startTime: string; endTime: string }> = [];
        if (dayOverride && dayOverride.startTime && dayOverride.endTime) {
            rulesForDay = [{ startTime: dayOverride.startTime, endTime: dayOverride.endTime }];
        } else {
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

    const allBusy = [...existingAppointments, ...externalBusyEvents];
    const availableSlots: string[] = [];

    for (const slot of potentialSlots) {
        const userZoned = toZonedTime(slot, userTimezone);
        const slotDateStr = format(userZoned, "yyyy-MM-dd");

        if (slotDateStr === targetDateStr) {
            const slotEnd = addMinutes(slot, duration);
            const hasConflict = allBusy.some((busy) =>
                areIntervalsOverlapping({ start: slot, end: slotEnd }, { start: busy.start, end: busy.end })
            );

            if (!hasConflict) {
                availableSlots.push(slot.toISOString());
            }
        }
    }

    return Array.from(new Set(availableSlots)).sort();
}

test("Calendar & Scheduling Engine Unit Tests", async (t) => {
    await t.test("Generates correct slots for recurring schedule with buffer", () => {
        // Monday 9am - 11am UTC, 30 min duration, 15 min buffer
        // Slot 1: 09:00 - 09:30 (next start 09:45)
        // Slot 2: 09:45 - 10:15 (next start 10:30)
        // Slot 3: 10:30 - 11:00 (ends at 11:00)
        const slots = calculateTestSlots({
            calendarTimezone: "UTC",
            duration: 30,
            buffer: 15,
            availabilities: [
                { dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }, // Monday
            ],
            targetDateStr: "2026-09-14", // A Monday
            userTimezone: "UTC",
        });

        assert.equal(slots.length, 3, "Should produce exactly 3 slots with 15m buffer");
        assert.equal(slots[0], "2026-09-14T09:00:00.000Z");
        assert.equal(slots[1], "2026-09-14T09:45:00.000Z");
        assert.equal(slots[2], "2026-09-14T10:30:00.000Z");
    });

    await t.test("Full-day date override blocks all slots on that date", () => {
        const slots = calculateTestSlots({
            calendarTimezone: "UTC",
            duration: 30,
            buffer: 0,
            availabilities: [
                { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
            ],
            overrides: [
                { date: "2026-09-14", isUnavailable: true }, // Block Monday
            ],
            targetDateStr: "2026-09-14",
            userTimezone: "UTC",
        });

        assert.equal(slots.length, 0, "All slots must be blocked on unavailable date override");
    });

    await t.test("Custom hours date override restricts slots to custom window", () => {
        // Normal Monday: 9am - 5pm. Override on 2026-09-14: 10am - 12pm.
        const slots = calculateTestSlots({
            calendarTimezone: "UTC",
            duration: 60,
            buffer: 0,
            availabilities: [
                { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
            ],
            overrides: [
                { date: "2026-09-14", isUnavailable: false, startTime: "10:00", endTime: "12:00" },
            ],
            targetDateStr: "2026-09-14",
            userTimezone: "UTC",
        });

        assert.equal(slots.length, 2, "Should produce only 2 1-hour slots inside custom window");
        assert.equal(slots[0], "2026-09-14T10:00:00.000Z");
        assert.equal(slots[1], "2026-09-14T11:00:00.000Z");
    });

    await t.test("Internal appointments block conflicting slots", () => {
        const existingAppt = {
            start: new Date("2026-09-14T09:30:00.000Z"),
            end: new Date("2026-09-14T10:00:00.000Z"),
        };

        const slots = calculateTestSlots({
            calendarTimezone: "UTC",
            duration: 30,
            buffer: 0,
            availabilities: [
                { dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }, // 09:00, 09:30, 10:00, 10:30
            ],
            existingAppointments: [existingAppt],
            targetDateStr: "2026-09-14",
            userTimezone: "UTC",
        });

        assert.equal(slots.length, 3, "Conflicting 09:30 slot must be removed");
        assert.ok(!slots.includes("2026-09-14T09:30:00.000Z"), "09:30 slot must not be offered");
        assert.ok(slots.includes("2026-09-14T09:00:00.000Z"), "09:00 slot remains available");
        assert.ok(slots.includes("2026-09-14T10:00:00.000Z"), "10:00 slot remains available");
    });

    await t.test("External calendar busy events block conflicting slots (bi-directional sync)", () => {
        const externalBusy = {
            start: new Date("2026-09-14T10:15:00.000Z"),
            end: new Date("2026-09-14T10:45:00.000Z"),
        };

        const slots = calculateTestSlots({
            calendarTimezone: "UTC",
            duration: 30,
            buffer: 0,
            availabilities: [
                { dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }, // 09:00, 09:30, 10:00, 10:30
            ],
            externalBusyEvents: [externalBusy],
            targetDateStr: "2026-09-14",
            userTimezone: "UTC",
        });

        // 10:00 - 10:30 overlaps with 10:15 - 10:45
        // 10:30 - 11:00 overlaps with 10:15 - 10:45
        assert.ok(!slots.includes("2026-09-14T10:00:00.000Z"), "Overlapping 10:00 slot blocked by external event");
        assert.ok(!slots.includes("2026-09-14T10:30:00.000Z"), "Overlapping 10:30 slot blocked by external event");
        assert.ok(slots.includes("2026-09-14T09:00:00.000Z"), "09:00 slot is unblocked");
        assert.ok(slots.includes("2026-09-14T09:30:00.000Z"), "09:30 slot is unblocked");
    });

    await t.test("Cross-timezone slot alignment correctly maps to user timezone", () => {
        // Calendar is in America/New_York (UTC-4 in Sep).
        // 14:00 - 16:00 EDT = 18:00 - 20:00 UTC
        const slots = calculateTestSlots({
            calendarTimezone: "America/New_York",
            duration: 60,
            buffer: 0,
            availabilities: [
                { dayOfWeek: 1, startTime: "14:00", endTime: "16:00" },
            ],
            targetDateStr: "2026-09-14",
            userTimezone: "UTC",
        });

        assert.equal(slots.length, 2);
        assert.equal(slots[0], "2026-09-14T18:00:00.000Z");
        assert.equal(slots[1], "2026-09-14T19:00:00.000Z");
    });

    await t.test("calendarSchema validates slug, duration, and default buffer", () => {
        const valid = calendarSchema.safeParse({
            name: "Discovery Call",
            slug: "discovery-call-15",
            duration_minutes: 30,
            buffer_minutes: 10,
        });
        assert.ok(valid.success, "Valid calendar data should pass");

        const invalidSlug = calendarSchema.safeParse({
            name: "Discovery Call",
            slug: "Discovery Call With Spaces!",
            duration_minutes: 30,
        });
        assert.ok(!invalidSlug.success, "Invalid slug with spaces and uppercase should fail");

        const invalidDuration = calendarSchema.safeParse({
            name: "Short Call",
            slug: "short-call",
            duration_minutes: 2, // min is 5
        });
        assert.ok(!invalidDuration.success, "Duration under 5 mins should fail");
    });

    await t.test("timeSlotSchema validates start time is before end time", () => {
        const valid = timeSlotSchema.safeParse({
            start_time: "09:00",
            end_time: "17:00",
        });
        assert.ok(valid.success, "09:00 to 17:00 should pass");

        const invalid = timeSlotSchema.safeParse({
            start_time: "17:00",
            end_time: "09:00",
        });
        assert.ok(!invalid.success, "Start after end time must fail");
    });

    await t.test("bookAppointmentSchema validates email and ISO datetime format", () => {
        const valid = bookAppointmentSchema.safeParse({
            calendar_id: "123e4567-e89b-12d3-a456-426614174000",
            start_time: "2026-09-14T10:00:00.000Z",
            name: "Jane Smith",
            email: "jane@example.com",
            timezone: "America/New_York",
        });
        assert.ok(valid.success, "Valid booking data should pass");

        const invalidEmail = bookAppointmentSchema.safeParse({
            calendar_id: "123e4567-e89b-12d3-a456-426614174000",
            start_time: "2026-09-14T10:00:00.000Z",
            name: "Jane Smith",
            email: "not-an-email",
            timezone: "UTC",
        });
        assert.ok(!invalidEmail.success, "Invalid email must fail");
    });
});
