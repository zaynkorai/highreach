import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/integrations/calendar/outlook";
import { getSessionWithRole } from "@/lib/auth/session";
import { createOAuthState } from "@/lib/integrations/oauth-state";

export async function GET(req: NextRequest) {
    const session = await getSessionWithRole();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = createOAuthState({
        userId: session.user.id,
        tenantId: session.tenantId,
    });

    const url = await getAuthUrl(state);
    return NextResponse.redirect(url);
}
