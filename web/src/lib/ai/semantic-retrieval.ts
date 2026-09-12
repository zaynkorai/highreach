import { db, tenantKnowledgeSources, knowledgeChunks } from "../db/index.ts";
import { eq, and, desc, sql, cosineDistance, inArray, or, ilike } from "drizzle-orm";
import { generateEmbedding } from "./embedding.ts";

export interface SemanticSearchOptions {
    tenantId: string;
    query: string;
    maxResults?: number;
    minSimilarity?: number;
    sourceTypes?: string[];
    enableHybrid?: boolean;
}

export interface SemanticSearchResult {
    chunkId: string;
    sourceId: string;
    title: string;
    sourceType: string;
    content: string;
    similarity: number;
    tokenCount: number;
    metadata: Record<string, unknown>;
}

/**
 * Searches the tenant's knowledge base using dense vector cosine similarity (pgvector)
 * optionally combined with keyword search via Reciprocal Rank Fusion (RRF).
 */
export async function searchKnowledge(
    options: SemanticSearchOptions
): Promise<SemanticSearchResult[]> {
    const {
        tenantId,
        query,
        maxResults = 5,
        minSimilarity = 0.5,
        sourceTypes,
        enableHybrid = true,
    } = options;

    if (!tenantId) {
        throw new Error("tenantId is required for knowledge retrieval");
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        return [];
    }

    // 1. Generate query embedding
    const queryEmbedding = await generateEmbedding(trimmedQuery);

    const vectorResults: SemanticSearchResult[] = [];
    const keywordResults: SemanticSearchResult[] = [];

    // 2. Dense Vector Search with pgvector
    try {
        const similarityExpr = sql<number>`1 - (${cosineDistance(knowledgeChunks.embedding, queryEmbedding)})`;

        const conditions = [
            eq(knowledgeChunks.tenantId, tenantId),
            sql`${similarityExpr} >= ${minSimilarity}`,
        ];

        if (sourceTypes && sourceTypes.length > 0) {
            conditions.push(inArray(tenantKnowledgeSources.sourceType, sourceTypes));
        }

        const rows = await db
            .select({
                chunkId: knowledgeChunks.id,
                sourceId: knowledgeChunks.sourceId,
                content: knowledgeChunks.content,
                tokenCount: knowledgeChunks.tokenCount,
                similarity: similarityExpr,
                title: tenantKnowledgeSources.title,
                sourceType: tenantKnowledgeSources.sourceType,
                metadata: tenantKnowledgeSources.metadata,
            })
            .from(knowledgeChunks)
            .innerJoin(tenantKnowledgeSources, eq(knowledgeChunks.sourceId, tenantKnowledgeSources.id))
            .where(and(...conditions))
            .orderBy(desc(similarityExpr))
            .limit(maxResults * 2);

        for (const row of rows) {
            vectorResults.push({
                chunkId: row.chunkId,
                sourceId: row.sourceId,
                title: row.title,
                sourceType: row.sourceType,
                content: row.content,
                similarity: Number(row.similarity.toFixed(4)),
                tokenCount: row.tokenCount ?? 0,
                metadata: (row.metadata || {}) as Record<string, unknown>,
            });
        }
    } catch (err) {
        console.warn("[SemanticRetrieval] pgvector cosine search failed or not supported, falling back to keyword:", err);
    }

    // 3. Keyword / Sparse Search (if hybrid enabled or vector search returned no matches)
    if (enableHybrid || vectorResults.length === 0) {
        try {
            const terms = trimmedQuery
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .filter((t) => t.length >= 2)
                .slice(0, 5);

            if (terms.length > 0) {
                const keywordConditions = [eq(knowledgeChunks.tenantId, tenantId)];
                if (sourceTypes && sourceTypes.length > 0) {
                    keywordConditions.push(inArray(tenantKnowledgeSources.sourceType, sourceTypes));
                }

                const termFilters = terms.map((term) =>
                    or(
                        ilike(knowledgeChunks.content, `%${term}%`),
                        ilike(tenantKnowledgeSources.title, `%${term}%`)
                    )
                );
                keywordConditions.push(or(...termFilters)!);

                const kwRows = await db
                    .select({
                        chunkId: knowledgeChunks.id,
                        sourceId: knowledgeChunks.sourceId,
                        content: knowledgeChunks.content,
                        tokenCount: knowledgeChunks.tokenCount,
                        title: tenantKnowledgeSources.title,
                        sourceType: tenantKnowledgeSources.sourceType,
                        metadata: tenantKnowledgeSources.metadata,
                    })
                    .from(knowledgeChunks)
                    .innerJoin(tenantKnowledgeSources, eq(knowledgeChunks.sourceId, tenantKnowledgeSources.id))
                    .where(and(...keywordConditions))
                    .limit(maxResults * 2);

                for (const row of kwRows) {
                    keywordResults.push({
                        chunkId: row.chunkId,
                        sourceId: row.sourceId,
                        title: row.title,
                        sourceType: row.sourceType,
                        content: row.content,
                        similarity: 0.75, // Default lexical match score
                        tokenCount: row.tokenCount ?? 0,
                        metadata: (row.metadata || {}) as Record<string, unknown>,
                    });
                }
            }
        } catch (kwErr) {
            console.warn("[SemanticRetrieval] Keyword fallback search failed:", kwErr);
        }
    }

    // 4. Combine via Reciprocal Rank Fusion (RRF)
    return mergeWithRRF(vectorResults, keywordResults, maxResults);
}

/**
 * Reciprocal Rank Fusion (RRF) to merge dense vector results and sparse keyword results.
 * Formula: RRF(d) = sum(1 / (k + rank_m(d)))
 */
export function mergeWithRRF(
    vectorResults: SemanticSearchResult[],
    keywordResults: SemanticSearchResult[],
    limit: number,
    k: number = 60
): SemanticSearchResult[] {
    const scores = new Map<string, { item: SemanticSearchResult; rrfScore: number; maxSimilarity: number }>();

    // 1. Process Vector Rankings
    vectorResults.forEach((item, rank) => {
        const score = 1 / (k + rank + 1);
        scores.set(item.chunkId, {
            item,
            rrfScore: score,
            maxSimilarity: item.similarity,
        });
    });

    // 2. Process Keyword Rankings
    keywordResults.forEach((item, rank) => {
        const score = 1 / (k + rank + 1);
        const existing = scores.get(item.chunkId);
        if (existing) {
            existing.rrfScore += score;
            existing.maxSimilarity = Math.max(existing.maxSimilarity, item.similarity);
        } else {
            scores.set(item.chunkId, {
                item,
                rrfScore: score,
                maxSimilarity: item.similarity,
            });
        }
    });

    // 3. Sort by RRF score descending and return top matches
    return Array.from(scores.values())
        .sort((a, b) => b.rrfScore - a.rrfScore)
        .slice(0, limit)
        .map(({ item, maxSimilarity }) => ({
            ...item,
            similarity: maxSimilarity,
        }));
}
