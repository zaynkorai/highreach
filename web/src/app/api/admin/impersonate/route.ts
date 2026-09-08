import { db, tenantMembers, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";
import { signSessionToken, setSessionCookie } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import type { AppRole } from "@/lib/types/database";

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    const serviceKey = process.env.ADMIN_SECRET || "highreach-admin-secret";

    if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
        return NextResponse.json(
            { error: "Unauthorized — admin secret required" },
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

    const [user] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

    if (!user || !user.tenantId) {
        return NextResponse.json(
            { error: "Target user not found or has no tenant" },
            { status: 404 }
        );
    }

    const token = await signSessionToken({
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role as AppRole,
        fullName: user.fullName,
    });

    await logAuditEvent({
        tenantId: user.tenantId,
        userId: adminId,
        action: AUDIT_ACTIONS.IMPERSONATION_STARTED,
        resourceType: "user",
        resourceId: targetUserId,
        metadata: { reason, target_role: user.role },
    });

    return NextResponse.json({
        success: true,
        token,
        tenantId: user.tenantId,
        role: user.role,
    });
}
