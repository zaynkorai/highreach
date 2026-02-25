import { z } from "zod";

export const contactSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional().or(z.literal("")),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (E.164)")
        .optional()
        .or(z.literal("")),
    tags: z.array(z.string()).optional(),
    source: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
