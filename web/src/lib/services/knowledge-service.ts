import { db, tenantKnowledgeSources, knowledgeChunks } from "../db/index.ts";
import { eq, and, desc, sql, count, sum } from "drizzle-orm";
import { chunkDocument } from "../ai/chunking.ts";
import { generateEmbeddings } from "../ai/embedding.ts";
import type { KnowledgeSourceType } from "../validations/knowledge.ts";

export interface CreateKnowledgeSourceInput {
    tenantId: string;
    title: string;
    sourceType: KnowledgeSourceType;
    rawContent: string;
    metadata?: Record<string, unknown>;
}

export interface UpdateKnowledgeSourceInput {
    id: string;
    tenantId: string;
    title?: string;
    sourceType?: KnowledgeSourceType;
    rawContent?: string;
    metadata?: Record<string, unknown>;
}

export interface KnowledgeSourceSummary {
    id: string;
    tenantId: string;
    title: string;
    sourceType: string;
    rawContent: string;
    metadata: Record<string, unknown>;
    chunkCount: number;
    totalTokens: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface KnowledgeStats {
    totalSources: number;
    totalChunks: number;
    totalTokens: number;
    embeddingDimension: number;
    sourcesByType: Record<string, number>;
}

/**
 * Creates a knowledge source, chunks the text, computes 1536-dim embeddings,
 * and persists chunks to pgvector.
 */
export async function createKnowledgeSource(
    input: CreateKnowledgeSourceInput
): Promise<{ source: KnowledgeSourceSummary; chunksCreated: number }> {
    const { tenantId, title, sourceType, rawContent, metadata = {} } = input;

    // 1. Insert knowledge source
    const [source] = await db
        .insert(tenantKnowledgeSources)
        .values({
            tenantId,
            title,
            sourceType,
            rawContent,
            metadata,
        })
        .returning();

    // 2. Chunk the raw content
    const chunks = chunkDocument(rawContent, {
        metadata: {
            sourceTitle: title,
            sourceType,
        },
    });

    let chunksCreated = 0;
    if (chunks.length > 0) {
        // 3. Generate embeddings
        const chunkTexts = chunks.map((c) => c.content);
        const embeddings = await generateEmbeddings(chunkTexts);

        // 4. Batch insert chunks into pgvector table
        const chunkInserts = chunks.map((chunk, idx) => ({
            sourceId: source.id,
            tenantId,
            content: chunk.content,
            embedding: embeddings[idx],
            tokenCount: chunk.tokenCount,
        }));

        await db.insert(knowledgeChunks).values(chunkInserts);
        chunksCreated = chunkInserts.length;
    }

    const totalTokens = chunks.reduce((acc, c) => acc + c.tokenCount, 0);

    return {
        source: {
            id: source.id,
            tenantId: source.tenantId,
            title: source.title,
            sourceType: source.sourceType,
            rawContent: source.rawContent,
            metadata: (source.metadata || {}) as Record<string, unknown>,
            chunkCount: chunksCreated,
            totalTokens,
            createdAt: source.createdAt,
            updatedAt: source.updatedAt,
        },
        chunksCreated,
    };
}

/**
 * Updates a knowledge source and re-indexes chunks if rawContent has changed.
 */
export async function updateKnowledgeSource(
    input: UpdateKnowledgeSourceInput
): Promise<KnowledgeSourceSummary> {
    const { id, tenantId, title, sourceType, rawContent, metadata } = input;

    // 1. Verify existence and tenant ownership
    const [existing] = await db
        .select()
        .from(tenantKnowledgeSources)
        .where(and(eq(tenantKnowledgeSources.id, id), eq(tenantKnowledgeSources.tenantId, tenantId)))
        .limit(1);

    if (!existing) {
        throw new Error("Knowledge source not found or unauthorized");
    }

    const updateValues: Partial<typeof tenantKnowledgeSources.$inferInsert> = {
        updatedAt: new Date(),
    };

    if (title !== undefined) updateValues.title = title;
    if (sourceType !== undefined) updateValues.sourceType = sourceType;
    if (metadata !== undefined) updateValues.metadata = metadata;
    if (rawContent !== undefined) updateValues.rawContent = rawContent;

    const [updatedSource] = await db
        .update(tenantKnowledgeSources)
        .set(updateValues)
        .where(and(eq(tenantKnowledgeSources.id, id), eq(tenantKnowledgeSources.tenantId, tenantId)))
        .returning();

    // 2. If content was modified, re-chunk and regenerate embeddings
    if (rawContent !== undefined && rawContent !== existing.rawContent) {
        // Delete old chunks
        await db
            .delete(knowledgeChunks)
            .where(and(eq(knowledgeChunks.sourceId, id), eq(knowledgeChunks.tenantId, tenantId)));

        // Create new chunks
        const chunks = chunkDocument(rawContent, {
            metadata: {
                sourceTitle: updatedSource.title,
                sourceType: updatedSource.sourceType,
            },
        });

        if (chunks.length > 0) {
            const chunkTexts = chunks.map((c) => c.content);
            const embeddings = await generateEmbeddings(chunkTexts);

            const chunkInserts = chunks.map((chunk, idx) => ({
                sourceId: id,
                tenantId,
                content: chunk.content,
                embedding: embeddings[idx],
                tokenCount: chunk.tokenCount,
            }));

            await db.insert(knowledgeChunks).values(chunkInserts);
        }
    }

    // 3. Retrieve updated stats
    const chunkStats = await db
        .select({
            count: count(knowledgeChunks.id),
            tokens: sum(knowledgeChunks.tokenCount),
        })
        .from(knowledgeChunks)
        .where(and(eq(knowledgeChunks.sourceId, id), eq(knowledgeChunks.tenantId, tenantId)));

    return {
        id: updatedSource.id,
        tenantId: updatedSource.tenantId,
        title: updatedSource.title,
        sourceType: updatedSource.sourceType,
        rawContent: updatedSource.rawContent,
        metadata: (updatedSource.metadata || {}) as Record<string, unknown>,
        chunkCount: Number(chunkStats[0]?.count ?? 0),
        totalTokens: Number(chunkStats[0]?.tokens ?? 0),
        createdAt: updatedSource.createdAt,
        updatedAt: updatedSource.updatedAt,
    };
}

/**
 * Deletes a knowledge source and all of its corresponding chunks.
 */
export async function deleteKnowledgeSource(id: string, tenantId: string): Promise<boolean> {
    const deleted = await db
        .delete(tenantKnowledgeSources)
        .where(and(eq(tenantKnowledgeSources.id, id), eq(tenantKnowledgeSources.tenantId, tenantId)))
        .returning({ id: tenantKnowledgeSources.id });

    return deleted.length > 0;
}

/**
 * Lists all knowledge sources for a tenant with chunk counts and token totals.
 */
export async function getKnowledgeSources(
    tenantId: string,
    options: { sourceType?: string } = {}
): Promise<KnowledgeSourceSummary[]> {
    const conditions = [eq(tenantKnowledgeSources.tenantId, tenantId)];
    if (options.sourceType && options.sourceType !== "all") {
        conditions.push(eq(tenantKnowledgeSources.sourceType, options.sourceType));
    }

    const sources = await db
        .select()
        .from(tenantKnowledgeSources)
        .where(and(...conditions))
        .orderBy(desc(tenantKnowledgeSources.createdAt));

    if (sources.length === 0) return [];

    // Query chunk counts and tokens per source
    const chunkStatsRows = await db
        .select({
            sourceId: knowledgeChunks.sourceId,
            count: count(knowledgeChunks.id),
            tokens: sum(knowledgeChunks.tokenCount),
        })
        .from(knowledgeChunks)
        .where(eq(knowledgeChunks.tenantId, tenantId))
        .groupBy(knowledgeChunks.sourceId);

    const statsMap = new Map<string, { count: number; tokens: number }>();
    for (const row of chunkStatsRows) {
        statsMap.set(row.sourceId, {
            count: Number(row.count),
            tokens: Number(row.tokens ?? 0),
        });
    }

    return sources.map((s) => {
        const stats = statsMap.get(s.id) || { count: 0, tokens: 0 };
        return {
            id: s.id,
            tenantId: s.tenantId,
            title: s.title,
            sourceType: s.sourceType,
            rawContent: s.rawContent,
            metadata: (s.metadata || {}) as Record<string, unknown>,
            chunkCount: stats.count,
            totalTokens: stats.tokens,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
        };
    });
}

/**
 * Retrieves a single knowledge source along with its chunk records.
 */
export async function getKnowledgeSourceWithChunks(
    id: string,
    tenantId: string
) {
    const [source] = await db
        .select()
        .from(tenantKnowledgeSources)
        .where(and(eq(tenantKnowledgeSources.id, id), eq(tenantKnowledgeSources.tenantId, tenantId)))
        .limit(1);

    if (!source) return null;

    const chunks = await db
        .select({
            id: knowledgeChunks.id,
            sourceId: knowledgeChunks.sourceId,
            content: knowledgeChunks.content,
            tokenCount: knowledgeChunks.tokenCount,
            createdAt: knowledgeChunks.createdAt,
        })
        .from(knowledgeChunks)
        .where(and(eq(knowledgeChunks.sourceId, id), eq(knowledgeChunks.tenantId, tenantId)))
        .orderBy(knowledgeChunks.createdAt);

    return {
        source: {
            ...source,
            metadata: (source.metadata || {}) as Record<string, unknown>,
        },
        chunks,
    };
}

/**
 * Re-chunks and re-embeds an existing knowledge source.
 */
export async function reindexKnowledgeSource(id: string, tenantId: string): Promise<number> {
    const [source] = await db
        .select()
        .from(tenantKnowledgeSources)
        .where(and(eq(tenantKnowledgeSources.id, id), eq(tenantKnowledgeSources.tenantId, tenantId)))
        .limit(1);

    if (!source) {
        throw new Error("Knowledge source not found");
    }

    // Delete existing chunks
    await db
        .delete(knowledgeChunks)
        .where(and(eq(knowledgeChunks.sourceId, id), eq(knowledgeChunks.tenantId, tenantId)));

    const chunks = chunkDocument(source.rawContent, {
        metadata: {
            sourceTitle: source.title,
            sourceType: source.sourceType,
        },
    });

    if (chunks.length > 0) {
        const chunkTexts = chunks.map((c) => c.content);
        const embeddings = await generateEmbeddings(chunkTexts);

        const chunkInserts = chunks.map((chunk, idx) => ({
            sourceId: id,
            tenantId,
            content: chunk.content,
            embedding: embeddings[idx],
            tokenCount: chunk.tokenCount,
        }));

        await db.insert(knowledgeChunks).values(chunkInserts);
    }

    return chunks.length;
}

/**
 * Retrieves aggregate knowledge base statistics for a tenant.
 */
export async function getKnowledgeStats(tenantId: string): Promise<KnowledgeStats> {
    const sources = await db
        .select({
            sourceType: tenantKnowledgeSources.sourceType,
        })
        .from(tenantKnowledgeSources)
        .where(eq(tenantKnowledgeSources.tenantId, tenantId));

    const totalSources = sources.length;
    const sourcesByType: Record<string, number> = {};
    for (const s of sources) {
        sourcesByType[s.sourceType] = (sourcesByType[s.sourceType] || 0) + 1;
    }

    const chunkStats = await db
        .select({
            totalChunks: count(knowledgeChunks.id),
            totalTokens: sum(knowledgeChunks.tokenCount),
        })
        .from(knowledgeChunks)
        .where(eq(knowledgeChunks.tenantId, tenantId));

    return {
        totalSources,
        totalChunks: Number(chunkStats[0]?.totalChunks ?? 0),
        totalTokens: Number(chunkStats[0]?.totalTokens ?? 0),
        embeddingDimension: 1536,
        sourcesByType,
    };
}
