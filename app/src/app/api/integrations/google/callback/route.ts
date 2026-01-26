import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "@/lib/integrations/calendar/google";
import { createAdminClient } from "@/lib/supabase/admin";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    try {
        const { userId, tenantId } = JSON.parse(Buffer.from(state, 'base64').toString());
        const tokens = await getTokens(code);

        // Get user email from Google
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: googleUser } = await oauth2.userinfo.get();

        const adminDb = createAdminClient();

        // Store tokens in external_accounts
        const { error } = await adminDb
            .from('external_accounts')
            .upsert({
                tenant_id: tenantId,
                provider: 'google',
                provider_account_id: googleUser.email,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                scopes: tokens.scope?.split(' ')
            }, {
                onConflict: 'tenant_id,provider,provider_account_id'
            });

        if (error) throw error;

        // Redirect back to integrations page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=integrations&success=google`);
    } catch (error: any) {
        console.error("Google OAuth Callback Error:", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=integrations&error=google`);
    }
}
