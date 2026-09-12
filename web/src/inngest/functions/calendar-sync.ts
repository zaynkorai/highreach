import { inngest } from "@/lib/inngest/client";
import { db, appointments, calendars, contacts, externalAccounts, tenants } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as google from "@/lib/integrations/calendar/google";
import * as outlook from "@/lib/integrations/calendar/outlook";
import { resend } from "@/lib/resend";
import { format } from "date-fns";

export const pushToExternalCalendar = inngest.createFunction(
    { id: "push-to-external-calendar" },
    { event: "appointment.booked" },
    async ({ event, step }) => {
        const { appointment_id } = event.data;

        // 1. Fetch appointment details with calendar and tenant info
        const appointment = await step.run("fetch-appointment", async () => {
            const [appt] = await db
                .select({
                    appointment: appointments,
                    calendar: calendars,
                    contact: contacts,
                    tenant: tenants,
                })
                .from(appointments)
                .innerJoin(calendars, eq(appointments.calendarId, calendars.id))
                .innerJoin(contacts, eq(appointments.contactId, contacts.id))
                .innerJoin(tenants, eq(appointments.tenantId, tenants.id))
                .where(eq(appointments.id, appointment_id))
                .limit(1);

            if (!appt) return null;

            let extAccount = null;
            if (appt.calendar.externalAccountId) {
                const [acc] = await db
                    .select()
                    .from(externalAccounts)
                    .where(eq(externalAccounts.id, appt.calendar.externalAccountId))
                    .limit(1);
                extAccount = acc;
            }

            return {
                id: appt.appointment.id,
                start_time: appt.appointment.startTime.toISOString(),
                end_time: appt.appointment.endTime.toISOString(),
                notes: appt.appointment.notes,
                location: appt.appointment.location || appt.calendar.location || "Online",
                calendar: {
                    name: appt.calendar.name,
                    timezone: appt.calendar.timezone,
                    duration_minutes: appt.calendar.durationMinutes,
                    sync_direction: appt.calendar.syncDirection,
                    external_calendar_id: appt.calendar.externalCalendarId,
                    external_account: extAccount,
                },
                contact: {
                    first_name: appt.contact.firstName,
                    last_name: appt.contact.lastName,
                    email: appt.contact.email,
                },
                tenant: {
                    name: appt.tenant.name,
                },
            };
        });

        if (!appointment || !appointment.calendar) return { skipped: "no-appointment-or-calendar" };

        const contactName = `${appointment.contact?.first_name || ""} ${appointment.contact?.last_name || ""}`.trim() || "Guest";
        const startDate = new Date(appointment.start_time);
        const formattedDate = format(startDate, "EEEE, MMMM do, yyyy 'at' h:mm a");

        // 2. Push to External Calendar if configured
        const { calendar } = appointment;
        if (calendar.sync_direction !== "off" && calendar.external_account) {
            const externalAccount = calendar.external_account;
            const eventPayload = {
                summary: `${calendar.name}: ${contactName}`,
                description: `${appointment.notes || "HighReach Meeting"}\n\nLocation: ${appointment.location}`,
                start: { dateTime: appointment.start_time },
                end: { dateTime: appointment.end_time },
                attendees: appointment.contact?.email ? [{ email: appointment.contact.email }] : [],
            };

            if (externalAccount.provider === "google") {
                await step.run("push-to-google", async () => {
                    const result = await google.createCalendarEvent(
                        externalAccount.accessToken,
                        externalAccount.refreshToken || undefined,
                        calendar.external_calendar_id || "primary",
                        {
                            summary: eventPayload.summary,
                            description: eventPayload.description,
                            start: { dateTime: eventPayload.start.dateTime },
                            end: { dateTime: eventPayload.end.dateTime },
                        }
                    );

                    await db
                        .update(appointments)
                        .set({
                            externalEventId: result.id,
                            externalProvider: "google",
                            updatedAt: new Date(),
                        })
                        .where(eq(appointments.id, appointment_id));
                });
            } else if (externalAccount.provider === "outlook") {
                await step.run("push-to-outlook", async () => {
                    const result = await outlook.createCalendarEvent(
                        externalAccount.accessToken,
                        {
                            subject: eventPayload.summary,
                            body: { contentType: "text", content: eventPayload.description },
                            start: { dateTime: eventPayload.start.dateTime, timeZone: "UTC" },
                            end: { dateTime: eventPayload.end.dateTime, timeZone: "UTC" },
                        }
                    );

                    await db
                        .update(appointments)
                        .set({
                            externalEventId: result.id,
                            externalProvider: "outlook",
                            updatedAt: new Date(),
                        })
                        .where(eq(appointments.id, appointment_id));
                });
            }
        }

        // 3. Send Booking Confirmation Email
        if (appointment.contact?.email) {
            await step.run("send-confirmation-email", async () => {
                const subject = `Confirmed: ${calendar.name} on ${formattedDate}`;
                const textContent = `Hi ${contactName},

Your appointment has been confirmed!

Details:
• Meeting: ${calendar.name}
• Date & Time: ${formattedDate} (${calendar.timezone || "UTC"})
• Duration: ${calendar.duration_minutes} minutes
• Location: ${appointment.location}
${appointment.notes ? `• Notes: ${appointment.notes}\n` : ""}
Organized by ${appointment.tenant.name}.

Thank you!`;

                try {
                    await resend.emails.send({
                        from: "HighReach <onboarding@resend.dev>",
                        to: [appointment.contact.email!],
                        subject,
                        text: textContent,
                    });
                } catch (emailErr) {
                    console.warn("Could not dispatch confirmation email:", emailErr);
                }
            });
        }

        return { success: true };
    }
);
