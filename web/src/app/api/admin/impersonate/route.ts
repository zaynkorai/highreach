import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Super-Admin Impersonation Endpoint
 * POST /api/admin/impersonate
 *
 * ⚠️ Service-role key required — this is NOT callable from the browser.
 * Intended for internal admin tooling only.
 *
 * Body: { targetUserId: string, reason: string, adminId: string }
 *
 * What it does:
 * 1. Validates the service-role key in Authorization header
 * 2. Temporarily sets the target user's JWT claims to include impersonation flag
 * 3. Logs the impersonation event to audit_logs
 * 4. Returns the target user's session info
 */
export async function POST(request: NextRequest) {
    // Validate service-role key
    const authHeader = request.headers.get("authorization");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!authHeader || !serviceKey || authHeader !== `Bearer ${serviceKey}`) {
        return NextResponse.json(
            { error: "Unauthorized — service-role key required" },
            { status: 401 }
        );
    }

    const body = await request.json();
    const { targetUserId, reason, adminId } = body;

    if (!targetUserId || !reason || !adminId) {
        return NextResponse.json(
            { error: "Missing required fields: targetUserId, reason, adminId" },
            { status: 400 }
        );
    }

    const admin = createAdminClient();

    // Get target user's current membership
    const { data: membership, error: memberError } = await admin
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("user_id", targetUserId)
        .single();

    if (memberError || !membership) {
        return NextResponse.json(
            { error: "Target user not found or has no tenant membership" },
            { status: 404 }
        );
    }

    // Set impersonation flag in target user's app_metadata
    const { error: updateError } = await admin.auth.admin.updateUserById(
        targetUserId,
        {
            app_metadata: {
                tenant_id: membership.tenant_id,
                role: membership.role,
                impersonated_by: adminId,
                impersonation_started_at: new Date().toISOString(),
            },
        }
    );

    if (updateError) {
        return NextResponse.json(
            { error: `Failed to set impersonation: ${updateError.message}` },
            { status: 500 }
        );
    }

    // Log the impersonation event
    await logAuditEvent({
        tenantId: membership.tenant_id,
        userId: adminId,
        action: AUDIT_ACTIONS.IMPERSONATION_STARTED,
        resourceType: "user",
        resourceId: targetUserId,
        metadata: { reason, target_role: membership.role },
    });

    return NextResponse.json({
        success: true,
        tenantId: membership.tenant_id,
        role: membership.role,
    });
}

/**
 * End impersonation
 * DELETE /api/admin/impersonate
 */
export async function DELETE(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!authHeader || !serviceKey || authHeader !== `Bearer ${serviceKey}`) {
        return NextResponse.json(
            { error: "Unauthorized — service-role key required" },
            { status: 401 }
        );
    }

    const body = await request.json();
    const { targetUserId, adminId } = body;

    if (!targetUserId || !adminId) {
        return NextResponse.json(
            { error: "Missing required fields: targetUserId, adminId" },
            { status: 400 }
        );
    }

    const admin = createAdminClient();

    // Get target user's membership to restore clean claims
    const { data: membership } = await admin
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("user_id", targetUserId)
        .single();

    if (membership) {
        // Remove impersonation flags, restore clean claims
        await admin.auth.admin.updateUserById(targetUserId, {
            app_metadata: {
                tenant_id: membership.tenant_id,
                role: membership.role,
                // Explicitly remove impersonation fields
                impersonated_by: null,
                impersonation_started_at: null,
            },
        });

        await logAuditEvent({
            tenantId: membership.tenant_id,
            userId: adminId,
            action: AUDIT_ACTIONS.IMPERSONATION_ENDED,
            resourceType: "user",
            resourceId: targetUserId,
        });
    }

    return NextResponse.json({ success: true });
}
