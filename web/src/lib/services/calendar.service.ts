import {
    db,
    calendars,
    calendarAvailability,
    appointments,
    externalAccounts,
    contacts,
} from "@/lib/db";
import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

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
            description?: string;
            slug?: string;
            duration_minutes?: number;
            timezone?: string;
            buffer_minutes?: number;
            location?: string;
            external_account_id?: string | null;
            external_calendar_id?: string | null;
            sync_direction?: string;
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
            );

        return rows.map(({ appointment: a, contact: c, calendar: cal }) => ({
            id: a.id,
            calendar_id: a.calendarId,
            tenant_id: a.tenantId,
            contact_id: a.contactId,
            start_time: a.startTime.toISOString(),
            end_time: a.endTime.toISOString(),
            status: a.status,
            location: a.location,
            notes: a.notes,
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
            end_time: string;
        }
    ) {
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
            const splitName = payload.name.split(" ");
            const [newContact] = await db
                .insert(contacts)
                .values({
                    tenantId,
                    firstName: splitName[0],
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
                startTime: new Date(payload.start_time),
                endTime: new Date(payload.end_time),
                status: "confirmed",
                notes: "Manual Entry",
            })
            .returning();

        // 3. Trigger Inngest
        try {
            await inngest.send({
                name: "appointment.booked",
                data: {
                    appointment_id: data.id,
                    tenant_id: tenantId,
                    contact_id: contactId,
                    calendar_id: payload.calendar_id,
                    start_time: payload.start_time,
                },
            });
        } catch (err) {
            console.warn("Inngest send error:", err);
        }

        return data;
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
}
