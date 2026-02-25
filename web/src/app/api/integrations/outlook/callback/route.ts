import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "@/lib/integrations/calendar/outlook";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    try {
        const { userId, tenantId } = JSON.parse(Buffer.from(state, 'base64').toString());
        const response = await getTokens(code);

        const adminDb = createAdminClient();

        // Store tokens in external_accounts
        const { error } = await adminDb
            .from('external_accounts')
            .upsert({
                tenant_id: tenantId,
                provider: 'outlook',
                provider_account_id: response.account?.username,
                access_token: response.accessToken,
                // msal-node handles refresh tokens differently if we use it for acquiring tokens later
                // but for now we store what we have
                expires_at: response.expiresOn?.toISOString(),
                scopes: response.scopes
            }, {
                onConflict: 'tenant_id,provider,provider_account_id'
            });

        if (error) throw error;

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=integrations&success=outlook`);
    } catch (error: any) {
        console.error("Outlook OAuth Callback Error:", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=integrations&error=outlook`);
    }
}
