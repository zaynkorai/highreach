import { assembleTenantKnowledge } from "./knowledge.ts";
import { assembleContactHistory } from "./contact-history.ts";
import { assembleActiveThread } from "./active-thread.ts";
import { buildPromptContext } from "./prompt-builder.ts";
import type { AssembleContextOptions, AssembledAgentContext } from "./types.ts";

/**
 * Assembles a comprehensive, multi-pillar AI agent perception context:
 * 1. Tenant Knowledge (Business Identity, Operating Hours, Semantic Knowledge Chunks)
 * 2. Contact History (CRM Operational State, Opportunities, Bookings, Timeline, Forms)
 * 3. Active Thread (Live Messages, Roles, Sliding-window Message Buffer)
 *
 * Grounded according to HighReach AI-Native Architecture Specification.
 */
export async function assembleAgentContext(
    options: AssembleContextOptions
): Promise<AssembledAgentContext> {
    if (!options.tenantId || typeof options.tenantId !== "string") {
        throw new Error("assembleAgentContext requires a valid tenantId string");
    }

    const startTime = performance.now();

    // Concurrently assemble all three context pillars
    const [tenant, contact, thread] = await Promise.all([
        assembleTenantKnowledge(options.tenantId, options),
        assembleContactHistory(options.tenantId, options.contactId, options),
        assembleActiveThread(options.tenantId, options.contactId, options.conversationId, options),
    ]);

    // Format prompt snippets, chat completion messages, and calculate token budget
    const maxTokens = options.maxTokens ?? 4000;
    const prompt = buildPromptContext(tenant, contact, thread, maxTokens);

    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    const truncatedMessagesCount = Math.max(0, thread.totalMessagesCount - thread.messages.length);

    return {
        assembledAt: new Date().toISOString(),
        tenantId: options.tenantId,
        contactId: options.contactId || null,
        conversationId: thread.conversationId || null,
        tenant,
        contact,
        thread,
        prompt,
        metadata: {
            queryText: options.queryText,
            retrievedChunksCount: tenant.knowledgeChunks.length,
            executionTimeMs,
            truncatedMessagesCount,
        },
    };
}

export * from "./types.ts";
export * from "./knowledge.ts";
export * from "./contact-history.ts";
export * from "./active-thread.ts";
export * from "./prompt-builder.ts";
