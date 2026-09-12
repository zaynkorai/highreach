import { db, agentRuns } from "../db/index.ts";
import { eq, desc } from "drizzle-orm";
import type { AgentType } from "./agent-policy.ts";

export type AgentRunStatus =
    | "running"
    | "completed"
    | "draft_pending"
    | "failed"
    | "escalated";

export interface RecordAgentRunParams {
    tenantId: string;
    agentType: AgentType | string;
    contactId?: string | null;
    triggerEvent: string;
    status: AgentRunStatus;
    inputContext: Record<string, unknown>;
    reasoningSteps?: Array<{ step: string; thought: string }> | unknown[];
    actionsTaken?: Array<{ action: string; details?: unknown }> | unknown[];
    draftOutput?: string | null;
    humanApproved?: boolean | null;
}

export interface AgentRunRecord {
    id: string;
    tenantId: string;
    agentType: string;
    contactId: string | null;
    triggerEvent: string;
    status: AgentRunStatus;
    inputContext: Record<string, unknown>;
    reasoningSteps: unknown[];
    actionsTaken: unknown[];
    draftOutput: string | null;
    humanApproved: boolean | null;
    createdAt: string;
}

/**
 * Records an execution trace into the agent_runs audit table.
 */
export async function recordAgentRun(params: RecordAgentRunParams): Promise<AgentRunRecord> {
    try {
        const [inserted] = await db
            .insert(agentRuns)
            .values({
                tenantId: params.tenantId,
                agentType: params.agentType,
                contactId: params.contactId ?? null,
                triggerEvent: params.triggerEvent,
                status: params.status,
                inputContext: params.inputContext,
                reasoningSteps: params.reasoningSteps ?? [],
                actionsTaken: params.actionsTaken ?? [],
                draftOutput: params.draftOutput ?? null,
                humanApproved: params.humanApproved ?? null,
            })
            .returning();

        return {
            id: inserted.id,
            tenantId: inserted.tenantId,
            agentType: inserted.agentType,
            contactId: inserted.contactId,
            triggerEvent: inserted.triggerEvent,
            status: inserted.status as AgentRunStatus,
            inputContext: (inserted.inputContext || {}) as Record<string, unknown>,
            reasoningSteps: (inserted.reasoningSteps || []) as unknown[],
            actionsTaken: (inserted.actionsTaken || []) as unknown[],
            draftOutput: inserted.draftOutput,
            humanApproved: inserted.humanApproved,
            createdAt: inserted.createdAt.toISOString(),
        };
    } catch (err) {
        if (process.env.NODE_ENV !== "test") {
            console.error("Failed to record agent run in audit table:", err);
        }
        // Fallback in-memory return so database audit failures do not crash the workflow
        return {
            id: "fallback-" + Date.now(),
            tenantId: params.tenantId,
            agentType: params.agentType,
            contactId: params.contactId ?? null,
            triggerEvent: params.triggerEvent,
            status: params.status,
            inputContext: params.inputContext,
            reasoningSteps: params.reasoningSteps ?? [],
            actionsTaken: params.actionsTaken ?? [],
            draftOutput: params.draftOutput ?? null,
            humanApproved: params.humanApproved ?? null,
            createdAt: new Date().toISOString(),
        };
    }
}

/**
 * Fetches recent agent runs for a tenant to power observability dashboards.
 */
export async function getAgentRuns(tenantId: string, limit: number = 20): Promise<AgentRunRecord[]> {
    const rows = await db
        .select()
        .from(agentRuns)
        .where(eq(agentRuns.tenantId, tenantId))
        .orderBy(desc(agentRuns.createdAt))
        .limit(limit);

    return rows.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        agentType: r.agentType,
        contactId: r.contactId,
        triggerEvent: r.triggerEvent,
        status: r.status as AgentRunStatus,
        inputContext: (r.inputContext || {}) as Record<string, unknown>,
        reasoningSteps: (r.reasoningSteps || []) as unknown[],
        actionsTaken: (r.actionsTaken || []) as unknown[],
        draftOutput: r.draftOutput,
        humanApproved: r.humanApproved,
        createdAt: r.createdAt.toISOString(),
    }));
}
