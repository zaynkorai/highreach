import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/integrations/calendar/google";
import { getSessionWithRole } from "@/lib/auth/session";
import { createOAuthState } from "@/lib/integrations/oauth-state";

export async function GET(req: NextRequest) {
    const session = await getSessionWithRole();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cryptographically signed state containing tenantId and userId
    const state = createOAuthState({
        userId: session.user.id,
        tenantId: session.tenantId,
    });

    const url = getAuthUrl(state);
    return NextResponse.redirect(url);
}
