import { createAdminClient } from "@/lib/supabase/admin";

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
 * Log an audit event. Uses the admin client to call the SECURITY DEFINER
 * RPC, bypassing RLS on audit_logs (which blocks direct inserts).
 *
 * Fire-and-forget: errors are logged but don't throw.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
    try {
        const admin = createAdminClient();

        await admin.rpc("log_audit_event", {
            p_tenant_id: params.tenantId,
            p_user_id: params.userId,
            p_action: params.action,
            p_resource_type: params.resourceType || null,
            p_resource_id: params.resourceId || null,
            p_metadata: params.metadata || {},
        });
    } catch (error) {
        // Audit logging should never crash the main flow
        console.error("[Audit] Failed to log event:", error);
    }
}
