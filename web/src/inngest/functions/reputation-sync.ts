import { inngest } from "@/lib/inngest/client";
import { db, reviews, externalAccounts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import * as googleReviews from "@/lib/integrations/reputation/google-reviews";

export const syncAllGoogleReviews = inngest.createFunction(
    { id: "sync-all-google-reviews" },
    { cron: "0 */6 * * *" }, // Run every 6 hours
    async ({ step }) => {
        // 1. Fetch all connected Google accounts
        const accounts = await step.run("fetch-connected-accounts", async () => {
            const data = await db
                .select()
                .from(externalAccounts)
                .where(eq(externalAccounts.provider, "google"));
            return data || [];
        });

        for (const account of accounts) {
            await step.run(`sync-reviews-${account.id}`, async () => {
                const locationId = "primary";

                const fetchedReviews = await googleReviews.listReviews(
                    account.accessToken,
                    account.refreshToken || undefined,
                    locationId
                );

                for (const review of fetchedReviews) {
                    const star =
                        parseInt(
                            review.starRating
                                .replace("THREE", "3")
                                .replace("FOUR", "4")
                                .replace("FIVE", "5")
                                .replace("TWO", "2")
                                .replace("ONE", "1")
                        ) || 5;

                    const [existing] = await db
                        .select({ id: reviews.id })
                        .from(reviews)
                        .where(
                            and(
                                eq(reviews.tenantId, account.tenantId),
                                eq(reviews.externalId, review.name)
                            )
                        )
                        .limit(1);

                    if (existing) {
                        await db
                            .update(reviews)
                            .set({
                                reviewerName: review.reviewer.displayName,
                                reviewerPhotoUrl: review.reviewer.profilePhotoUrl,
                                rating: star,
                                content: review.comment,
                                status: review.reviewReply ? "replied" : "pending",
                                replyContent: review.reviewReply?.comment,
                                updatedAt: new Date(),
                            })
                            .where(eq(reviews.id, existing.id));
                    } else {
                        await db.insert(reviews).values({
                            tenantId: account.tenantId,
                            platform: "google",
                            externalId: review.name,
                            reviewerName: review.reviewer.displayName,
                            reviewerPhotoUrl: review.reviewer.profilePhotoUrl,
                            rating: star,
                            content: review.comment,
                            reviewDate: review.createTime ? new Date(review.createTime) : new Date(),
                            status: review.reviewReply ? "replied" : "pending",
                            replyContent: review.reviewReply?.comment,
                        });
                    }
                }
            });
        }

        return { synced: accounts.length };
    }
);
