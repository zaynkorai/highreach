import {
    db,
    calendars,
    calendarAvailability,
    calendarOverrides,
    externalCalendarEvents,
    appointments,
    externalAccounts,
    contacts,
    tenants,
} from "@/lib/db";
import { eq, desc, asc, and, gte, lte, sql, inArray } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import * as google from "@/lib/integrations/calendar/google";
import * as outlook from "@/lib/integrations/calendar/outlook";
import type { AppointmentStatus } from "@/types/calendar";

export interface CalendarSettingsPayload {
    timezone?: string;
    buffer?: number;
    use24h?: boolean;
}

export class CalendarService {
    static async getCalendars(tenantId: string) {
        const result = await db
            .select()
            .from(calendars)
            .where(eq(calendars.tenantId, tenantId))
            .orderBy(desc(calendars.createdAt));

        return result.map((c) => ({
            id: c.id,
            tenant_id: c.tenantId,
            name: c.name,
            slug: c.slug,
            description: c.description,
            location: c.location,
            timezone: c.timezone,
            duration_minutes: c.durationMinutes,
            buffer_minutes: c.bufferMinutes,
            is_active: c.isActive,
            external_account_id: c.externalAccountId,
            external_calendar_id: c.externalCalendarId,
            sync_direction: c.syncDirection,
            last_sync_at: c.lastSyncAt ? c.lastSyncAt.toISOString() : null,
            created_at: c.createdAt.toISOString(),
            updated_at: c.updatedAt.toISOString(),
        }));
    }

    static async getIntegrations(tenantId: string) {
        // Project only safe columns at the SQL level to prevent OAuth tokens from entering Node.js heap
        const result = await db
            .select({
                id: externalAccounts.id,
                tenantId: externalAccounts.tenantId,
                provider: externalAccounts.provider,
                providerAccountId: externalAccounts.providerAccountId,
                hasToken: sql<boolean>`${externalAccounts.accessToken} IS NOT NULL`,
                expiresAt: externalAccounts.expiresAt,
                scopes: externalAccounts.scopes,
                createdAt: externalAccounts.createdAt,
                updatedAt: externalAccounts.updatedAt,
            })
            .from(externalAccounts)
            .where(eq(externalAccounts.tenantId, tenantId));

        return result.map((a) => ({
            id: a.id,
            tenant_id: a.tenantId,
            provider: a.provider,
            provider_account_id: a.providerAccountId,
            connected: a.hasToken,
            expires_at: a.expiresAt ? a.expiresAt.toISOString() : null,
            scopes: a.scopes,
            created_at: a.createdAt.toISOString(),
            updated_at: a.updatedAt.toISOString(),
        }));
    }

    static async getCalendarWithAvailability(tenantId: string, id: string) {
        const [calendar] = await db
            .select()
            .from(calendars)
            .where(and(eq(calendars.id, id), eq(calendars.tenantId, tenantId)))
            .limit(1);

        if (!calendar) return null;

        const availability = await db
            .select()
            .from(calendarAvailability)
            .where(eq(calendarAvailability.calendarId, id))
            .orderBy(asc(calendarAvailability.dayOfWeek));

        return {
            id: calendar.id,
            tenant_id: calendar.tenantId,
            name: calendar.name,
            slug: calendar.slug,
            description: calendar.description,
            location: calendar.location,
            timezone: calendar.timezone,
            duration_minutes: calendar.durationMinutes,
            buffer_minutes: calendar.bufferMinutes,
            is_active: calendar.isActive,
            external_account_id: calendar.externalAccountId,
            external_calendar_id: calendar.externalCalendarId,
            sync_direction: calendar.syncDirection,
            last_sync_at: calendar.lastSyncAt ? calendar.lastSyncAt.toISOString() : null,
            created_at: calendar.createdAt.toISOString(),
            updated_at: calendar.updatedAt.toISOString(),
            availability: availability.map((a) => ({
                id: a.id,
                calendar_id: a.calendarId,
                day_of_week: a.dayOfWeek,
                start_time: a.startTime,
                end_time: a.endTime,
            })),
        };
    }

    static async createCalendar(
        tenantId: string,
        payload: {
            name: string;
            slug: string;
            description?: string;
            duration?: number;
            location?: string;
        }
    ) {
        const [data] = await db
            .insert(calendars)
            .values({
                tenantId,
                name: payload.name,
                slug: payload.slug,
                description: payload.description || "",
                durationMinutes: payload.duration || 30,
                location: payload.location || "zoom",
                timezone: "UTC",
            })
            .returning();

        return data;
    }

    static async updateCalendar(
        tenantId: string,
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
        const updates: Partial<typeof calendars.$inferInsert> = {
            updatedAt: new Date(),
        };

        if (payload.name !== undefined) updates.name = payload.name;
        if (payload.description !== undefined) updates.description = payload.description;
        if (payload.slug !== undefined) updates.slug = payload.slug;
        if (payload.duration_minutes !== undefined) updates.durationMinutes = payload.duration_minutes;
        if (payload.timezone !== undefined) updates.timezone = payload.timezone;
        if (payload.buffer_minutes !== undefined) updates.bufferMinutes = payload.buffer_minutes;
        if (payload.location !== undefined) updates.location = payload.location;
        if (payload.external_account_id !== undefined) updates.externalAccountId = payload.external_account_id || null;
        if (payload.external_calendar_id !== undefined) updates.externalCalendarId = payload.external_calendar_id || null;
        if (payload.sync_direction !== undefined) updates.syncDirection = payload.sync_direction || "off";

        const [updated] = await db
            .update(calendars)
            .set(updates)
            .where(and(eq(calendars.id, id), eq(calendars.tenantId, tenantId)))
            .returning();

        if (!updated) {
            throw new Error("Calendar not found or access denied");
        }
        return updated;
    }

    static async updateAvailability(
        tenantId: string,
        calendarId: string,
        availability: Array<{ day_of_week: number; start_time: string; end_time: string }>
    ) {
        await db.transaction(async (tx) => {
            const [calendar] = await tx
                .select({ id: calendars.id })
                .from(calendars)
                .where(and(eq(calendars.id, calendarId), eq(calendars.tenantId, tenantId)))
                .limit(1);

            if (!calendar) {
                throw new Error("Calendar not found or access denied");
            }

            await tx
                .delete(calendarAvailability)
                .where(eq(calendarAvailability.calendarId, calendarId));

            if (availability.length > 0) {
                await tx.insert(calendarAvailability).values(
                    availability.map((a) => ({
                        calendarId,
                        dayOfWeek: a.day_of_week,
                        startTime: a.start_time,
                        endTime: a.end_time,
                    }))
                );
            }
        });
    }

    static async deleteCalendar(tenantId: string, id: string) {
        const deleted = await db
            .delete(calendars)
            .where(and(eq(calendars.id, id), eq(calendars.tenantId, tenantId)))
            .returning();

        if (deleted.length === 0) {
            throw new Error("Calendar not found or access denied");
        }
        return deleted;
    }

    // ── Overrides (Holidays / Date Blockouts) ───────────────────
    static async getOverrides(tenantId: string, calendarId: string) {
        const [cal] = await db
            .select({ id: calendars.id })
            .from(calendars)
            .where(and(eq(calendars.id, calendarId), eq(calendars.tenantId, tenantId)))
            .limit(1);

        if (!cal) throw new Error("Calendar not found or access denied");

        const rows = await db
            .select()
            .from(calendarOverrides)
            .where(eq(calendarOverrides.calendarId, calendarId))
            .orderBy(asc(calendarOverrides.date));

        return rows.map((r) => ({
            id: r.id,
            calendar_id: r.calendarId,
            date: r.date,
            is_unavailable: r.isUnavailable,
            start_time: r.startTime,
            end_time: r.endTime,
            created_at: r.createdAt.toISOString(),
        }));
    }

    static async createOverride(
        tenantId: string,
        payload: {
            calendar_id: string;
            date: string;
            is_unavailable: boolean;
            start_time?: string | null;
            end_time?: string | null;
        }
    ) {
        const [cal] = await db
            .select({ id: calendars.id })
            .from(calendars)
            .where(and(eq(calendars.id, payload.calendar_id), eq(calendars.tenantId, tenantId)))
            .limit(1);

        if (!cal) throw new Error("Calendar not found or access denied");

        const [created] = await db
            .insert(calendarOverrides)
            .values({
                calendarId: payload.calendar_id,
                date: payload.date,
                isUnavailable: payload.is_unavailable,
                startTime: payload.start_time || null,
                endTime: payload.end_time || null,
            })
            .returning();

        return created;
    }

    static async deleteOverride(tenantId: string, id: string) {
        // Verify tenant owns the calendar of this override
        const [override] = await db
            .select({
                id: calendarOverrides.id,
                calendarId: calendarOverrides.calendarId,
            })
            .from(calendarOverrides)
            .innerJoin(calendars, eq(calendarOverrides.calendarId, calendars.id))
            .where(and(eq(calendarOverrides.id, id), eq(calendars.tenantId, tenantId)))
            .limit(1);

        if (!override) throw new Error("Override not found or access denied");

        await db.delete(calendarOverrides).where(eq(calendarOverrides.id, id));
        return { success: true };
    }

    // ── Global Calendar Settings ──────────────────────────────
    static async getCalendarSettings(tenantId: string) {
        const [tenant] = await db
            .select({ settings: tenants.settings })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

        const s = (tenant?.settings as any)?.calendar || {};
        return {
            timezone: s.timezone || "UTC",
            buffer: s.buffer !== undefined ? Number(s.buffer) : 15,
            use24h: Boolean(s.use24h),
        };
    }

    static async updateCalendarSettings(tenantId: string, settings: CalendarSettingsPayload) {
        const [tenant] = await db
            .select({ settings: tenants.settings })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

        const existingSettings = (tenant?.settings as Record<string, any>) || {};
        const updatedCalendar = {
            ...(existingSettings.calendar || {}),
            ...(settings.timezone !== undefined ? { timezone: settings.timezone } : {}),
            ...(settings.buffer !== undefined ? { buffer: settings.buffer } : {}),
            ...(settings.use24h !== undefined ? { use24h: settings.use24h } : {}),
        };

        await db
            .update(tenants)
            .set({
                settings: {
                    ...existingSettings,
                    calendar: updatedCalendar,
                },
                updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));

        return updatedCalendar;
    }

    // ── Appointments ──────────────────────────────────────────
    static async getAppointments(tenantId: string, start: string, end: string) {
        const rows = await db
            .select({
                appointment: appointments,
                contact: contacts,
                calendar: calendars,
            })
            .from(appointments)
            .innerJoin(contacts, eq(appointments.contactId, contacts.id))
            .innerJoin(calendars, eq(appointments.calendarId, calendars.id))
            .where(
                and(
                    eq(appointments.tenantId, tenantId),
                    gte(appointments.startTime, new Date(start)),
                    lte(appointments.endTime, new Date(end))
                )
            )
            .orderBy(asc(appointments.startTime));

        return rows.map(({ appointment: a, contact: c, calendar: cal }) => ({
            id: a.id,
            calendar_id: a.calendarId,
            tenant_id: a.tenantId,
            contact_id: a.contactId,
            start_time: a.startTime.toISOString(),
            end_time: a.endTime.toISOString(),
            status: a.status as AppointmentStatus,
            location: a.location,
            notes: a.notes,
            external_event_id: a.externalEventId,
            external_provider: a.externalProvider,
            created_at: a.createdAt.toISOString(),
            updated_at: a.updatedAt.toISOString(),
            contact: {
                first_name: c.firstName,
                last_name: c.lastName,
                email: c.email,
                phone: c.phone,
            },
            calendar: {
                name: cal.name,
                timezone: cal.timezone,
                duration_minutes: cal.durationMinutes,
            },
        }));
    }

    static async createManualAppointment(
        tenantId: string,
        payload: {
            calendar_id: string;
            name: string;
            email: string;
            start_time: string;
            end_time?: string;
            duration_minutes?: number;
            notes?: string;
        }
    ) {
        // Fetch Calendar to verify and get duration
        const [cal] = await db
            .select()
            .from(calendars)
            .where(and(eq(calendars.id, payload.calendar_id), eq(calendars.tenantId, tenantId)))
            .limit(1);

        if (!cal) throw new Error("Calendar not found or access denied");

        const start = new Date(payload.start_time);
        const durationMin = payload.duration_minutes || cal.durationMinutes || 30;
        const end = payload.end_time ? new Date(payload.end_time) : new Date(start.getTime() + durationMin * 60000);

        // Conflict check
        const conflicts = await db
            .select({ id: appointments.id })
            .from(appointments)
            .where(
                and(
                    eq(appointments.calendarId, payload.calendar_id),
                    sql`${appointments.status} != 'cancelled'`,
                    gte(appointments.endTime, start),
                    lte(appointments.startTime, end)
                )
            )
            .limit(1);

        if (conflicts.length > 0) {
            throw new Error("This time slot conflicts with an existing appointment");
        }

        // 1. Find or Create Contact
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
            const splitName = payload.name.trim().split(" ");
            const [newContact] = await db
                .insert(contacts)
                .values({
                    tenantId,
                    firstName: splitName[0] || "Unknown",
                    lastName: splitName.slice(1).join(" ") || "",
                    email: payload.email,
                    source: "Manual Booking",
                    tags: [],
                })
                .returning();
            contactId = newContact.id;
        }

        // 2. Create Appointment
        const [data] = await db
            .insert(appointments)
            .values({
                calendarId: payload.calendar_id,
                tenantId,
                contactId,
                startTime: start,
                endTime: end,
                status: "confirmed",
                notes: payload.notes || "Manual Entry",
                location: cal.location || "zoom",
            })
            .returning();

        // 3. Trigger Inngest Fanout
        try {
            await inngest.send({
                name: "appointment.booked",
                data: {
                    appointment_id: data.id,
                    tenant_id: tenantId,
                    contact_id: contactId,
                    calendar_id: payload.calendar_id,
                    start_time: data.startTime.toISOString(),
                },
            });
        } catch (err) {
            console.warn("Inngest send error:", err);
        }

        return data;
    }

    static async updateAppointmentStatus(tenantId: string, id: string, status: AppointmentStatus) {
        const [updated] = await db
            .update(appointments)
            .set({ status, updatedAt: new Date() })
            .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
            .returning();

        if (!updated) throw new Error("Appointment not found or access denied");
        return updated;
    }

    static async rescheduleAppointment(
        tenantId: string,
        id: string,
        startTime: string,
        endTime: string
    ) {
        const [existing] = await db
            .select()
            .from(appointments)
            .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
            .limit(1);

        if (!existing) throw new Error("Appointment not found or access denied");

        const start = new Date(startTime);
        const end = new Date(endTime);

        // Check for conflicts
        const conflicts = await db
            .select({ id: appointments.id })
            .from(appointments)
            .where(
                and(
                    eq(appointments.calendarId, existing.calendarId),
                    sql`${appointments.id} != ${id}`,
                    sql`${appointments.status} != 'cancelled'`,
                    gte(appointments.endTime, start),
                    lte(appointments.startTime, end)
                )
            )
            .limit(1);

        if (conflicts.length > 0) {
            throw new Error("The selected time conflicts with another appointment");
        }

        const [updated] = await db
            .update(appointments)
            .set({
                startTime: start,
                endTime: end,
                status: "rescheduled",
                updatedAt: new Date(),
            })
            .where(eq(appointments.id, id))
            .returning();

        // Trigger Inngest to update external calendar
        try {
            await inngest.send({
                name: "appointment.booked",
                data: {
                    appointment_id: updated.id,
                    tenant_id: tenantId,
                    contact_id: updated.contactId,
                    calendar_id: updated.calendarId,
                    start_time: updated.startTime.toISOString(),
                    rescheduled: true,
                },
            });
        } catch (err) {
            console.warn("Inngest send error:", err);
        }

        return updated;
    }

    static async updateAppointmentDetails(
        tenantId: string,
        id: string,
        payload: { notes?: string; location?: string }
    ) {
        const updates: Partial<typeof appointments.$inferInsert> = {
            updatedAt: new Date(),
        };
        if (payload.notes !== undefined) updates.notes = payload.notes;
        if (payload.location !== undefined) updates.location = payload.location;

        const [updated] = await db
            .update(appointments)
            .set(updates)
            .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
            .returning();

        if (!updated) throw new Error("Appointment not found or access denied");
        return updated;
    }

    static async cancelAppointment(tenantId: string, id: string) {
        const [updated] = await db
            .update(appointments)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(
                and(
                    eq(appointments.id, id),
                    eq(appointments.tenantId, tenantId)
                )
            )
            .returning();

        if (!updated) {
            throw new Error("Appointment not found or access denied");
        }
        return updated;
    }

    // ── External Sync & Integration Management ────────────────
    static async saveExternalEvents(
        tenantId: string,
        accountId: string,
        calendarId: string,
        events: Array<{ id: string; title: string; start: Date; end: Date }>
    ) {
        if (events.length === 0) {
            // Delete past cached events for this calendar
            await db
                .delete(externalCalendarEvents)
                .where(
                    and(
                        eq(externalCalendarEvents.externalAccountId, accountId),
                        eq(externalCalendarEvents.externalCalendarId, calendarId)
                    )
                );
            return;
        }

        const activeEventIds = events.map((e) => e.id);

        // 1. Remove deleted events
        await db
            .delete(externalCalendarEvents)
            .where(
                and(
                    eq(externalCalendarEvents.externalAccountId, accountId),
                    eq(externalCalendarEvents.externalCalendarId, calendarId),
                    sql`${externalCalendarEvents.externalEventId} NOT IN (${sql.join(activeEventIds.map(id => sql`${id}`), sql`, `)})`
                )
            );

        // 2. Upsert current events
        for (const ev of events) {
            const [existing] = await db
                .select({ id: externalCalendarEvents.id })
                .from(externalCalendarEvents)
                .where(
                    and(
                        eq(externalCalendarEvents.externalAccountId, accountId),
                        eq(externalCalendarEvents.externalCalendarId, calendarId),
                        eq(externalCalendarEvents.externalEventId, ev.id)
                    )
                )
                .limit(1);

            if (existing) {
                await db
                    .update(externalCalendarEvents)
                    .set({
                        title: ev.title,
                        startTime: ev.start,
                        endTime: ev.end,
                        updatedAt: new Date(),
                    })
                    .where(eq(externalCalendarEvents.id, existing.id));
            } else {
                await db.insert(externalCalendarEvents).values({
                    tenantId,
                    externalAccountId: accountId,
                    externalCalendarId: calendarId,
                    externalEventId: ev.id,
                    title: ev.title,
                    startTime: ev.start,
                    endTime: ev.end,
                });
            }
        }
    }

    static async syncAccountEvents(tenantId: string, accountId: string) {
        const [account] = await db
            .select()
            .from(externalAccounts)
            .where(and(eq(externalAccounts.id, accountId), eq(externalAccounts.tenantId, tenantId)))
            .limit(1);

        if (!account) throw new Error("Account not found");

        const linkedCalendars = await db
            .select()
            .from(calendars)
            .where(
                and(
                    eq(calendars.tenantId, tenantId),
                    eq(calendars.externalAccountId, accountId)
                )
            );

        const timeMin = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day past
        const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days ahead

        for (const cal of linkedCalendars) {
            const extCalId = cal.externalCalendarId || "primary";
            let events: Array<{ id: string; title: string; start: Date; end: Date }> = [];

            if (account.provider === "google") {
                events = await google.getCalendarEvents(
                    account.accessToken,
                    account.refreshToken,
                    extCalId,
                    timeMin,
                    timeMax
                );
            } else if (account.provider === "outlook") {
                // Check token expiry
                let token = account.accessToken;
                if (account.expiresAt && account.expiresAt <= new Date() && account.refreshToken) {
                    try {
                        const refreshed = await outlook.refreshOutlookToken(account.refreshToken);
                        token = refreshed.accessToken;
                        await db
                            .update(externalAccounts)
                            .set({
                                accessToken: refreshed.accessToken,
                                refreshToken: refreshed.refreshToken,
                                expiresAt: refreshed.expiresAt,
                                updatedAt: new Date(),
                            })
                            .where(eq(externalAccounts.id, account.id));
                    } catch (err) {
                        console.warn("Could not refresh Outlook token:", err);
                    }
                }
                events = await outlook.getCalendarEvents(token, timeMin, timeMax);
            }

            await this.saveExternalEvents(tenantId, account.id, extCalId, events);

            await db
                .update(calendars)
                .set({ lastSyncAt: new Date(), updatedAt: new Date() })
                .where(eq(calendars.id, cal.id));
        }

        return { success: true, count: linkedCalendars.length };
    }

    static async disconnectIntegration(tenantId: string, provider: "google" | "outlook") {
        const accounts = await db
            .select({ id: externalAccounts.id })
            .from(externalAccounts)
            .where(and(eq(externalAccounts.tenantId, tenantId), eq(externalAccounts.provider, provider)));

        if (accounts.length === 0) return { success: true };

        const accountIds = accounts.map((a) => a.id);

        // 1. Clear cached external events
        await db
            .delete(externalCalendarEvents)
            .where(inArray(externalCalendarEvents.externalAccountId, accountIds));

        // 2. Unlink from calendars
        await db
            .update(calendars)
            .set({
                externalAccountId: null,
                syncDirection: "off",
                updatedAt: new Date(),
            })
            .where(inArray(calendars.externalAccountId, accountIds));

        // 3. Delete external accounts
        await db
            .delete(externalAccounts)
            .where(inArray(externalAccounts.id, accountIds));

        return { success: true };
    }
}
