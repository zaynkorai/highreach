import { db, agentConfigs } from "../db/index.ts";
import { eq, and } from "drizzle-orm";

export type AgentType = "lead_qualifier" | "booking_concierge" | "review_guardian";
export type AutonomyMode = "draft_only" | "auto_pilot";

export interface AgentPolicy {
    id?: string;
    tenantId: string;
    agentType: AgentType;
    isActive: boolean;
    autonomyMode: AutonomyMode;
    confidenceThreshold: number;
    systemPromptOverride?: string | null;
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.85;

/**
 * Retrieves the operational autonomy policy for a given tenant and agent type.
 * Defaults to safe 'draft_only' mode if no explicit config exists yet.
 */
export async function getAgentPolicy(
    tenantId: string,
    agentType: AgentType = "lead_qualifier"
): Promise<AgentPolicy> {
    try {
        const [config] = await db
            .select()
            .from(agentConfigs)
            .where(
                and(
                    eq(agentConfigs.tenantId, tenantId),
                    eq(agentConfigs.agentType, agentType)
                )
            )
            .limit(1);

        if (config) {
            return {
                id: config.id,
                tenantId: config.tenantId,
                agentType: config.agentType as AgentType,
                isActive: config.isActive,
                autonomyMode: (config.autonomyMode || "draft_only") as AutonomyMode,
                confidenceThreshold: Number(config.confidenceThreshold) || DEFAULT_CONFIDENCE_THRESHOLD,
                systemPromptOverride: config.systemPromptOverride,
            };
        }
    } catch (err) {
        if (process.env.NODE_ENV !== "test" && process.env.npm_lifecycle_event !== "test") {
            console.warn(`Could not load agent config for tenant ${tenantId} (${agentType}):`, err);
        }
    }

    // Default safe fallback policy: Active, but strictly draft-only
    return {
        tenantId,
        agentType,
        isActive: true,
        autonomyMode: "draft_only",
        confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
        systemPromptOverride: null,
    };
}

/**
 * Updates or creates an agent policy for a tenant.
 */
export async function setAgentPolicy(params: {
    tenantId: string;
    agentType: AgentType;
    isActive?: boolean;
    autonomyMode?: AutonomyMode;
    confidenceThreshold?: number;
    systemPromptOverride?: string | null;
}): Promise<AgentPolicy> {
    const { tenantId, agentType } = params;

    const valuesToSet = {
        tenantId,
        agentType,
        ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
        ...(params.autonomyMode !== undefined ? { autonomyMode: params.autonomyMode } : {}),
        ...(params.confidenceThreshold !== undefined ? { confidenceThreshold: String(params.confidenceThreshold) } : {}),
        ...(params.systemPromptOverride !== undefined ? { systemPromptOverride: params.systemPromptOverride } : {}),
        updatedAt: new Date(),
    };

    const [upserted] = await db
        .insert(agentConfigs)
        .values({
            tenantId,
            agentType,
            isActive: params.isActive ?? true,
            autonomyMode: params.autonomyMode ?? "draft_only",
            confidenceThreshold: String(params.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD),
            systemPromptOverride: params.systemPromptOverride ?? null,
        })
        .onConflictDoUpdate({
            target: [agentConfigs.tenantId, agentConfigs.agentType],
            set: valuesToSet,
        })
        .returning();

    return {
        id: upserted.id,
        tenantId: upserted.tenantId,
        agentType: upserted.agentType as AgentType,
        isActive: upserted.isActive,
        autonomyMode: upserted.autonomyMode as AutonomyMode,
        confidenceThreshold: Number(upserted.confidenceThreshold),
        systemPromptOverride: upserted.systemPromptOverride,
    };
}
