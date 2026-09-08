import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/integrations/calendar/google";
import { getSessionWithRole } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
    const session = await getSessionWithRole();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pass tenantId and userId in state to verify in callback
    const state = Buffer.from(
        JSON.stringify({
            userId: session.user.id,
            tenantId: session.tenantId,
        })
    ).toString("base64");

    const url = getAuthUrl(state);
    return NextResponse.redirect(url);
}
