"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import * as googleReviews from "@/lib/integrations/reputation/google-reviews";

export async function getGoogleBusinessLocations() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: account } = await supabase
        .from('external_accounts')
        .select('*')
        .eq('provider', 'google')
        .single();

    if (!account) return { success: false, error: "Google not connected" };

    try {
        const businessAccounts = await googleReviews.listBusinessAccounts(account.access_token, account.refresh_token);
        if (!businessAccounts || businessAccounts.length === 0) return { success: true, locations: [] };

        const firstAccount = businessAccounts[0];
        if (!firstAccount.name) return { success: true, locations: [] };

        const locations = await googleReviews.listLocations(account.access_token, account.refresh_token, firstAccount.name);
        return { success: true, locations };
    } catch (error: any) {
        console.error("Error fetching Google locations:", error);
        return { success: false, error: error.message };
    }
}

export async function setGoogleLocation(locationId: string, locationName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const adminDb = createAdminClient();
    const { data: account } = await supabase
        .from('external_accounts')
        .select('*')
        .eq('provider', 'google')
        .single();

    if (!account) return { success: false, error: "Google not connected" };

    const { error } = await adminDb
        .from('external_accounts')
        .update({
            metadata: {
                ...account.metadata,
                location_id: locationId,
                location_name: locationName
            }
        })
        .eq('id', account.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/reputation");
    return { success: true };
}

export async function syncReviews() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: account } = await supabase
        .from('external_accounts')
        .select('*')
        .eq('provider', 'google')
        .single();

    if (!account || !account.metadata?.location_id) {
        return { success: false, error: "Google location not configured" };
    }

    try {
        const reviews = await googleReviews.listReviews(
            account.access_token,
            account.refresh_token,
            account.metadata.location_id
        );

        const adminDb = createAdminClient();

        for (const review of reviews) {
            await adminDb.from('reviews').upsert({
                tenant_id: account.tenant_id,
                platform: 'google',
                external_id: review.name,
                reviewer_name: review.reviewer.displayName,
                reviewer_photo_url: review.reviewer.profilePhotoUrl,
                rating: parseInt(review.starRating.replace('THREE', '3').replace('FOUR', '4').replace('FIVE', '5').replace('TWO', '2').replace('ONE', '1')) || 5,
                content: review.comment,
                review_date: review.createTime,
                status: review.reviewReply ? 'replied' : 'pending',
                reply_content: review.reviewReply?.comment
            }, {
                onConflict: 'tenant_id,external_id'
            });
        }

        revalidatePath("/dashboard/reputation");
        return { success: true, count: reviews.length };
    } catch (error: any) {
        console.error("Sync Reviews Error:", error);
        return { success: false, error: error.message };
    }
}
