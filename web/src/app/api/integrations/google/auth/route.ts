import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/integrations/calendar/google";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pass tenant_id and user_id in state to verify in callback
    const state = Buffer.from(JSON.stringify({
        userId: user.id,
        tenantId: user.user_metadata?.tenant_id || user.app_metadata?.tenant_id
    })).toString('base64');

    const url = getAuthUrl(state);
    return NextResponse.redirect(url);
}
