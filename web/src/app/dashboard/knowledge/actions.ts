"use server";

import { withPermission } from "@/lib/actions/action-handler";
import { revalidatePath } from "next/cache";
import {
    createKnowledgeSource,
    updateKnowledgeSource,
    deleteKnowledgeSource,
    getKnowledgeSources,
    getKnowledgeSourceWithChunks,
    reindexKnowledgeSource,
    getKnowledgeStats,
    type KnowledgeSourceSummary,
    type KnowledgeStats,
} from "@/lib/services/knowledge-service";
import { searchKnowledge, type SemanticSearchResult } from "@/lib/ai/semantic-retrieval";
import {
    knowledgeSourceSchema,
    updateKnowledgeSourceSchema,
    knowledgeQuerySchema,
    type KnowledgeSourceFormData,
    type UpdateKnowledgeSourceFormData,
    type KnowledgeQueryInput,
} from "@/lib/validations/knowledge";

/**
 * Retrieves all knowledge sources for the active tenant.
 */
export async function getKnowledgeSourcesAction(options?: { sourceType?: string }) {
    return await withPermission("knowledge.read", async (session) => {
        return await getKnowledgeSources(session.tenantId, options);
    });
}

/**
 * Retrieves knowledge base aggregate stats.
 */
export async function getKnowledgeStatsAction() {
    return await withPermission("knowledge.read", async (session) => {
        return await getKnowledgeStats(session.tenantId);
    });
}

/**
 * Retrieves a single knowledge source along with its generated chunks.
 */
export async function getKnowledgeSourceWithChunksAction(id: string) {
    return await withPermission("knowledge.read", async (session) => {
        return await getKnowledgeSourceWithChunks(id, session.tenantId);
    });
}

/**
 * Creates a new knowledge source, chunks it, generates embeddings, and persists chunks.
 */
export async function createKnowledgeSourceAction(data: KnowledgeSourceFormData) {
    return await withPermission("knowledge.write", async (session) => {
        const validated = knowledgeSourceSchema.parse(data);
        const result = await createKnowledgeSource({
            tenantId: session.tenantId,
            title: validated.title,
            sourceType: validated.sourceType,
            rawContent: validated.rawContent,
            metadata: validated.metadata,
        });

        revalidatePath("/dashboard/knowledge");
        return result;
    });
}

/**
 * Updates a knowledge source and re-indexes if content changed.
 */
export async function updateKnowledgeSourceAction(id: string, data: UpdateKnowledgeSourceFormData) {
    return await withPermission("knowledge.write", async (session) => {
        const validated = updateKnowledgeSourceSchema.parse(data);
        const result = await updateKnowledgeSource({
            id,
            tenantId: session.tenantId,
            ...validated,
        });

        revalidatePath("/dashboard/knowledge");
        return result;
    });
}

/**
 * Deletes a knowledge source and its chunks.
 */
export async function deleteKnowledgeSourceAction(id: string) {
    return await withPermission("knowledge.write", async (session) => {
        const success = await deleteKnowledgeSource(id, session.tenantId);
        revalidatePath("/dashboard/knowledge");
        return { success };
    });
}

/**
 * Re-indexes an existing knowledge source.
 */
export async function reindexKnowledgeSourceAction(id: string) {
    return await withPermission("knowledge.write", async (session) => {
        const chunksCreated = await reindexKnowledgeSource(id, session.tenantId);
        revalidatePath("/dashboard/knowledge");
        return { chunksCreated };
    });
}

/**
 * Tests semantic retrieval live against the tenant's knowledge chunks.
 */
export async function testSemanticSearchAction(data: KnowledgeQueryInput) {
    return await withPermission("knowledge.read", async (session) => {
        const validated = knowledgeQuerySchema.parse(data);
        return await searchKnowledge({
            tenantId: session.tenantId,
            query: validated.query,
            maxResults: validated.maxResults,
            minSimilarity: validated.minSimilarity,
            sourceTypes: validated.sourceTypes,
            enableHybrid: true,
        });
    });
}
