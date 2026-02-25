import * as z from "zod";

export const opportunitySchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    contactId: z.string().min(1, "Contact is required").uuid("Invalid contact ID"),
    pipelineStageId: z.string().min(1, "Stage is required").uuid("Invalid stage ID"),
    value: z.number().min(0, "Value cannot be negative"),
    status: z.enum(['open', 'won', 'lost']).default('open'),
});

export type OpportunityFormData = z.infer<typeof opportunitySchema>;
