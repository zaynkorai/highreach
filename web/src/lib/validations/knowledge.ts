import { z } from "zod";

export const knowledgeSourceTypes = ["faq", "document", "url", "service_catalog"] as const;
export type KnowledgeSourceType = (typeof knowledgeSourceTypes)[number];

export const knowledgeSourceTypeSchema = z.enum(knowledgeSourceTypes);

export const knowledgeSourceSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .max(200, "Title cannot exceed 200 characters"),
    sourceType: knowledgeSourceTypeSchema,
    rawContent: z
        .string()
        .trim()
        .min(5, "Content must be at least 5 characters"),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateKnowledgeSourceSchema = knowledgeSourceSchema.partial();

export const knowledgeQuerySchema = z.object({
    query: z
        .string()
        .trim()
        .min(1, "Search query is required"),
    maxResults: z.coerce.number().int().min(1).max(50).optional().default(5),
    minSimilarity: z.coerce.number().min(0).max(1).optional().default(0.5),
    sourceTypes: z.array(knowledgeSourceTypeSchema).optional(),
});

export type KnowledgeSourceFormData = z.infer<typeof knowledgeSourceSchema>;
export type UpdateKnowledgeSourceFormData = z.infer<typeof updateKnowledgeSourceSchema>;
export type KnowledgeQueryInput = z.infer<typeof knowledgeQuerySchema>;
