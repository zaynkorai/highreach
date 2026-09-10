import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "@/lib/integrations/calendar/google";
import { db, externalAccounts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";
import { verifyOAuthState } from "@/lib/integrations/oauth-state";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
        return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    const stateData = verifyOAuthState(state);
    if (!stateData || !stateData.tenantId) {
        return NextResponse.json({ error: "Invalid or expired state parameter" }, { status: 403 });
    }

    try {
        const { tenantId } = stateData;
        const tokens = await getTokens(code);

        // Get user email from Google
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const { data: googleUser } = await oauth2.userinfo.get();

        const providerAccountId = googleUser.email || "primary";

        const [existing] = await db
            .select({ id: externalAccounts.id })
            .from(externalAccounts)
            .where(
                and(
                    eq(externalAccounts.tenantId, tenantId),
                    eq(externalAccounts.provider, "google"),
                    eq(externalAccounts.providerAccountId, providerAccountId)
                )
            )
            .limit(1);

        if (existing) {
            await db
                .update(externalAccounts)
                .set({
                    accessToken: tokens.access_token || "",
                    refreshToken: tokens.refresh_token || null,
                    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    scopes: tokens.scope ? tokens.scope.split(" ") : [],
                    updatedAt: new Date(),
                })
                .where(eq(externalAccounts.id, existing.id));
        } else {
            await db.insert(externalAccounts).values({
                tenantId,
                provider: "google",
                providerAccountId,
                accessToken: tokens.access_token || "",
                refreshToken: tokens.refresh_token || null,
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                scopes: tokens.scope ? tokens.scope.split(" ") : [],
            });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        return NextResponse.redirect(`${appUrl}/dashboard/settings?tab=integrations&success=google`);
    } catch (error: any) {
        console.error("Google OAuth Callback Error:", error);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        return NextResponse.redirect(`${appUrl}/dashboard/settings?tab=integrations&error=google`);
    }
}
