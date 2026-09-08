import { db, auditLogs } from "@/lib/db";

/**
 * Audit event categories for structured logging.
 */
export const AUDIT_ACTIONS = {
    // Team
    TEAM_MEMBER_INVITED: "team.member_invited",
    TEAM_MEMBER_REMOVED: "team.member_removed",
    TEAM_MEMBER_ROLE_CHANGED: "team.member_role_changed",
    TEAM_INVITATION_ACCEPTED: "team.invitation_accepted",
    TEAM_INVITATION_REVOKED: "team.invitation_revoked",

    // Contacts
    CONTACT_CREATED: "contact.created",
    CONTACT_UPDATED: "contact.updated",
    CONTACT_DELETED: "contact.deleted",
    CONTACT_IMPORTED: "contact.imported",

    // Forms
    FORM_CREATED: "form.created",
    FORM_UPDATED: "form.updated",
    FORM_DELETED: "form.deleted",

    // Pipelines
    PIPELINE_CREATED: "pipeline.created",
    PIPELINE_UPDATED: "pipeline.updated",
    DEAL_STAGE_CHANGED: "deal.stage_changed",

    // Automations
    AUTOMATION_CREATED: "automation.created",
    AUTOMATION_ENABLED: "automation.enabled",
    AUTOMATION_DISABLED: "automation.disabled",

    // Settings
    SETTINGS_UPDATED: "settings.updated",
    INTEGRATION_CONNECTED: "integration.connected",
    INTEGRATION_DISCONNECTED: "integration.disconnected",

    // Auth
    USER_SIGNED_UP: "auth.signed_up",
    USER_SIGNED_IN: "auth.signed_in",
    IMPERSONATION_STARTED: "auth.impersonation_started",
    IMPERSONATION_ENDED: "auth.impersonation_ended",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

interface LogAuditParams {
    tenantId: string;
    userId: string;
    action: AuditAction;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Log an audit event.
 * Fire-and-forget: errors are logged but don't throw.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
    try {
        await db.insert(auditLogs).values({
            tenantId: params.tenantId,
            userId: params.userId,
            action: params.action,
            resourceType: params.resourceType || null,
            resourceId: params.resourceId || null,
            metadata: params.metadata || {},
        });
    } catch (error) {
        // Audit logging should never crash the main flow
        console.error("[Audit] Failed to log event:", error);
    }
}
