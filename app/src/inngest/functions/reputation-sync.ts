import { inngest } from "@/lib/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import * as googleReviews from "@/lib/integrations/reputation/google-reviews";

export const syncAllGoogleReviews = inngest.createFunction(
    { id: "sync-all-google-reviews" },
    { cron: "0 */6 * * *" }, // Run every 6 hours
    async ({ step }) => {
        const adminDb = createAdminClient();

        // 1. Fetch all connected Google accounts with configured locations
        const accounts = await step.run("fetch-connected-accounts", async () => {
            const { data } = await adminDb
                .from('external_accounts')
                .select('*')
                .eq('provider', 'google')
                .not('metadata->location_id', 'is', null);
            return data || [];
        });

        for (const account of accounts) {
            await step.run(`sync-reviews-${account.id}`, async () => {
                const locationId = account.metadata?.location_id;
                if (!locationId) return;

                const reviews = await googleReviews.listReviews(
                    account.access_token,
                    account.refresh_token,
                    locationId
                );

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
            });
        }

        return { synced: accounts.length };
    }
);
