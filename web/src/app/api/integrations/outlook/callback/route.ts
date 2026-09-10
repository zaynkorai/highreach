import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "@/lib/integrations/calendar/outlook";
import { db, externalAccounts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
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
        const response = await getTokens(code);

        const providerAccountId = response.account?.username || "primary";

        const [existing] = await db
            .select({ id: externalAccounts.id })
            .from(externalAccounts)
            .where(
                and(
                    eq(externalAccounts.tenantId, tenantId),
                    eq(externalAccounts.provider, "outlook"),
                    eq(externalAccounts.providerAccountId, providerAccountId)
                )
            )
            .limit(1);

        if (existing) {
            await db
                .update(externalAccounts)
                .set({
                    accessToken: response.accessToken || "",
                    expiresAt: response.expiresOn ? new Date(response.expiresOn) : null,
                    scopes: response.scopes || [],
                    updatedAt: new Date(),
                })
                .where(eq(externalAccounts.id, existing.id));
        } else {
            await db.insert(externalAccounts).values({
                tenantId,
                provider: "outlook",
                providerAccountId,
                accessToken: response.accessToken || "",
                expiresAt: response.expiresOn ? new Date(response.expiresOn) : null,
                scopes: response.scopes || [],
            });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        return NextResponse.redirect(`${appUrl}/dashboard/settings?tab=integrations&success=outlook`);
    } catch (error: any) {
        console.error("Outlook OAuth Callback Error:", error);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        return NextResponse.redirect(`${appUrl}/dashboard/settings?tab=integrations&error=outlook`);
    }
}
