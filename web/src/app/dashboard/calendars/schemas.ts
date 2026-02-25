import { z } from "zod";

export const calendarSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
    description: z.string().optional(),
    timezone: z.string().default("UTC"),
    duration_minutes: z.coerce.number().min(5, "Minimum duration is 5 minutes"),
    buffer_minutes: z.coerce.number().min(0).default(0),
    is_active: z.boolean().default(true),
});

export type CalendarFormValues = z.infer<typeof calendarSchema>;

export const timeSlotSchema = z.object({
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
}).refine((data) => data.start_time < data.end_time, {
    message: "End time must be after start time",
    path: ["end_time"],
});

export const availabilitySchema = z.object({
    day_of_week: z.number().min(0).max(6),
    slots: z.array(timeSlotSchema), // UI might handle multiple slots per day
});

export const bookAppointmentSchema = z.object({
    calendar_id: z.string().uuid(),
    start_time: z.string().datetime(), // ISO string from the slot picker
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    notes: z.string().optional(),
    timezone: z.string(), // User's timezone
});
