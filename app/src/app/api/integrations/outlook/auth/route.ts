import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/integrations/calendar/outlook";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = Buffer.from(JSON.stringify({
        userId: user.id,
        tenantId: user.user_metadata?.tenant_id || user.app_metadata?.tenant_id
    })).toString('base64');

    const url = await getAuthUrl(state);
    return NextResponse.redirect(url);
}
