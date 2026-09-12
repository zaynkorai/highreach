import { db, tenants, tenantKnowledgeSources, knowledgeChunks, calendars, calendarAvailability } from "../db/index.ts";
import { eq, and, desc, asc, sql, ilike, or, cosineDistance } from "drizzle-orm";
import type { TenantKnowledgeContext, KnowledgeItem, BusinessHoursItem, AssembleContextOptions } from "./types.ts";
import { generateEmbedding } from "./embedding.ts";
import { tenantKnowledgeCache, invalidateTenantKnowledgeCache } from "./cache.ts";

export { invalidateTenantKnowledgeCache };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Searches and retrieves tenant knowledge chunks, business hours, and operational identity.
 * Employs in-memory TTL caching for static business identity and operating hours.
 */
export async function assembleTenantKnowledge(
    tenantId: string,
    options: Partial<AssembleContextOptions> = {}
): Promise<TenantKnowledgeContext> {
    const maxChunks = options.maxKnowledgeChunks ?? 5;
    const minSimilarity = options.minSimilarityScore ?? 0.6;
    const queryText = options.queryText?.trim();
    let queryEmbedding = options.queryEmbedding;

    // 1. Check in-memory cache for static tenant profile & hours
    let baseTenant = tenantKnowledgeCache.get(tenantId);

    if (!baseTenant) {
        // Fetch Tenant Profile
        const [tenant] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

        if (!tenant) {
            throw new Error(`Tenant not found for ID: ${tenantId}`);
        }

        const tenantSettings = (tenant.settings || {}) as Record<string, any>;
        const defaultTimezone = tenantSettings.timezone || "America/New_York";

        // Fetch Business Hours from Calendars Availability or Settings
        const businessHours: BusinessHoursItem[] = [];
        try {
            const availabilityRows = await db
                .select({
                    dayOfWeek: calendarAvailability.dayOfWeek,
                    startTime: calendarAvailability.startTime,
                    endTime: calendarAvailability.endTime,
                    calendarIsActive: calendars.isActive,
                })
                .from(calendarAvailability)
                .innerJoin(calendars, eq(calendarAvailability.calendarId, calendars.id))
                .where(and(eq(calendars.tenantId, tenantId), eq(calendars.isActive, true)))
                .orderBy(asc(calendarAvailability.dayOfWeek), asc(calendarAvailability.startTime));

            if (availabilityRows.length > 0) {
                for (const row of availabilityRows) {
                    businessHours.push({
                        dayOfWeek: row.dayOfWeek,
                        dayName: DAY_NAMES[row.dayOfWeek] || `Day ${row.dayOfWeek}`,
                        open: row.startTime,
                        close: row.endTime,
                    });
                }
            } else if (tenantSettings.businessHours && Array.isArray(tenantSettings.businessHours)) {
                for (const h of tenantSettings.businessHours) {
                    businessHours.push({
                        dayOfWeek: h.dayOfWeek,
                        dayName: DAY_NAMES[h.dayOfWeek] || `Day ${h.dayOfWeek}`,
                        open: h.open || "09:00",
                        close: h.close || "17:00",
                    });
                }
            }
        } catch (err) {
            console.warn("Could not retrieve calendar availability for tenant knowledge:", err);
        }

        // Fetch default fallback knowledge sources
        const defaultKnowledge: KnowledgeItem[] = [];
        try {
            const defaultSources = await db
                .select()
                .from(tenantKnowledgeSources)
                .where(eq(tenantKnowledgeSources.tenantId, tenantId))
                .orderBy(desc(tenantKnowledgeSources.createdAt))
                .limit(maxChunks);

            for (const s of defaultSources) {
                defaultKnowledge.push({
                    id: s.id,
                    sourceId: s.id,
                    title: s.title,
                    sourceType: s.sourceType,
                    content: s.rawContent,
                    similarityScore: 1.0,
                    metadata: (s.metadata || {}) as Record<string, unknown>,
                });
            }
        } catch (srcErr) {
            console.warn("Could not fetch fallback tenant knowledge sources:", srcErr);
        }

        baseTenant = {
            tenantId: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            phoneNumber: tenant.phoneNumber,
            industry: tenant.industry || "general",
            timezone: defaultTimezone,
            businessHours,
            knowledgeChunks: defaultKnowledge,
        };

        tenantKnowledgeCache.set(tenantId, baseTenant);
    }

    // If no specific query is provided, return the cached base context directly (0 DB queries on cache hit!)
    if ((!queryEmbedding || queryEmbedding.length === 0) && (!queryText || queryText.length <= 1)) {
        return baseTenant;
    }

    // If query text is provided without embedding, generate embedding dynamically
    if ((!queryEmbedding || queryEmbedding.length === 0) && queryText && queryText.length > 1) {
        try {
            queryEmbedding = await generateEmbedding(queryText);
        } catch (embErr) {
            console.warn("Could not generate query embedding in assembleTenantKnowledge:", embErr);
        }
    }

    // 2. Search Specific Knowledge Chunks for the Query
    const dynamicChunks: KnowledgeItem[] = [];

    // 2a. Vector Cosine Distance Search (utilizing HNSW index)
    if (queryEmbedding && Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
        try {
            const similarityExpr = sql<number>`1 - (${cosineDistance(knowledgeChunks.embedding, queryEmbedding)})`;

            const vectorResults = await db
                .select({
                    chunkId: knowledgeChunks.id,
                    sourceId: knowledgeChunks.sourceId,
                    content: knowledgeChunks.content,
                    similarity: similarityExpr,
                    title: tenantKnowledgeSources.title,
                    sourceType: tenantKnowledgeSources.sourceType,
                    metadata: tenantKnowledgeSources.metadata,
                })
                .from(knowledgeChunks)
                .innerJoin(tenantKnowledgeSources, eq(knowledgeChunks.sourceId, tenantKnowledgeSources.id))
                .where(
                    and(
                        eq(knowledgeChunks.tenantId, tenantId),
                        sql`${similarityExpr} >= ${minSimilarity}`
                    )
                )
                .orderBy(desc(similarityExpr))
                .limit(maxChunks);

            for (const row of vectorResults) {
                dynamicChunks.push({
                    id: row.chunkId,
                    sourceId: row.sourceId,
                    title: row.title,
                    sourceType: row.sourceType,
                    content: row.content,
                    similarityScore: Number(row.similarity.toFixed(4)),
                    metadata: (row.metadata || {}) as Record<string, unknown>,
                });
            }
        } catch (vecErr) {
            console.warn("Vector search failed, falling back to keyword search:", vecErr);
        }
    }

    // 2b. Keyword search fallback if vector returned 0 results
    if (dynamicChunks.length === 0 && queryText && queryText.length > 1) {
        try {
            const terms = queryText
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .filter((t) => t.length >= 3)
                .slice(0, 5);

            const whereClauses = [eq(knowledgeChunks.tenantId, tenantId)];
            if (terms.length > 0) {
                const termConditions = terms.map((term) =>
                    or(
                        ilike(knowledgeChunks.content, `%${term}%`),
                        ilike(tenantKnowledgeSources.title, `%${term}%`),
                        ilike(tenantKnowledgeSources.rawContent, `%${term}%`)
                    )
                );
                whereClauses.push(or(...termConditions)!);
            }

            const textResults = await db
                .select({
                    chunkId: knowledgeChunks.id,
                    sourceId: knowledgeChunks.sourceId,
                    content: knowledgeChunks.content,
                    title: tenantKnowledgeSources.title,
                    sourceType: tenantKnowledgeSources.sourceType,
                    metadata: tenantKnowledgeSources.metadata,
                })
                .from(knowledgeChunks)
                .innerJoin(tenantKnowledgeSources, eq(knowledgeChunks.sourceId, tenantKnowledgeSources.id))
                .where(and(...whereClauses))
                .limit(maxChunks);

            for (const row of textResults) {
                dynamicChunks.push({
                    id: row.chunkId,
                    sourceId: row.sourceId,
                    title: row.title,
                    sourceType: row.sourceType,
                    content: row.content,
                    similarityScore: 0.85,
                    metadata: (row.metadata || {}) as Record<string, unknown>,
                });
            }
        } catch (textErr) {
            console.warn("Keyword search failed against knowledgeChunks:", textErr);
        }
    }

    return {
        ...baseTenant,
        knowledgeChunks: dynamicChunks.length > 0 ? dynamicChunks : baseTenant.knowledgeChunks,
    };
}
