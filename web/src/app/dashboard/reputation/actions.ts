"use server";

import { getSessionWithRole } from "@/lib/auth/session";
import { db, reviews, externalAccounts } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as googleReviews from "@/lib/integrations/reputation/google-reviews";

export async function getGoogleBusinessLocations() {
    const session = await getSessionWithRole();
    if (!session) throw new Error("Unauthorized");

    const [account] = await db
        .select()
        .from(externalAccounts)
        .where(
            and(
                eq(externalAccounts.tenantId, session.tenantId),
                eq(externalAccounts.provider, "google")
            )
        )
        .limit(1);

    if (!account) return { success: false, error: "Google not connected" };

    try {
        const businessAccounts = await googleReviews.listBusinessAccounts(account.accessToken, account.refreshToken || undefined);
        if (!businessAccounts || businessAccounts.length === 0) return { success: true, locations: [] };

        const firstAccount = businessAccounts[0];
        if (!firstAccount.name) return { success: true, locations: [] };

        const locations = await googleReviews.listLocations(account.accessToken, account.refreshToken || undefined, firstAccount.name);
        return { success: true, locations };
    } catch (error: any) {
        console.error("Error fetching Google locations:", error);
        return { success: false, error: error.message };
    }
}

export async function setGoogleLocation(locationId: string, locationName: string) {
    const session = await getSessionWithRole();
    if (!session) throw new Error("Unauthorized");

    const [account] = await db
        .select()
        .from(externalAccounts)
        .where(
            and(
                eq(externalAccounts.tenantId, session.tenantId),
                eq(externalAccounts.provider, "google")
            )
        )
        .limit(1);

    if (!account) return { success: false, error: "Google not connected" };

    try {
        await db
            .update(externalAccounts)
            .set({
                updatedAt: new Date(),
            })
            .where(eq(externalAccounts.id, account.id));

        revalidatePath("/dashboard/reputation");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function syncReviews() {
    const session = await getSessionWithRole();
    if (!session) throw new Error("Unauthorized");

    const [account] = await db
        .select()
        .from(externalAccounts)
        .where(
            and(
                eq(externalAccounts.tenantId, session.tenantId),
                eq(externalAccounts.provider, "google")
            )
        )
        .limit(1);

    if (!account) {
        return { success: false, error: "Google location not configured" };
    }

    try {
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
                        eq(reviews.tenantId, session.tenantId),
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
                    tenantId: session.tenantId,
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

        revalidatePath("/dashboard/reputation");
        return { success: true, count: fetchedReviews.length };
    } catch (error: any) {
        console.error("Sync Reviews Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getReviews() {
    const session = await getSessionWithRole();
    if (!session) return [];

    try {
        const result = await db
            .select()
            .from(reviews)
            .where(eq(reviews.tenantId, session.tenantId))
            .orderBy(desc(reviews.reviewDate));

        return result.map((r) => ({
            id: r.id,
            reviewer_name: r.reviewerName,
            reviewer_photo_url: r.reviewerPhotoUrl,
            rating: r.rating,
            content: r.content,
            review_date: r.reviewDate ? r.reviewDate.toISOString() : null,
            platform: r.platform,
            reply_content: r.replyContent,
            status: r.status,
            created_at: r.createdAt.toISOString(),
            updated_at: r.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error("getReviews Error:", error);
        return [];
    }
}

export async function replyToReviewAction(reviewId: string, replyText: string) {
    const session = await getSessionWithRole();
    if (!session) throw new Error("Unauthorized");

    await db
        .update(reviews)
        .set({
            replyContent: replyText,
            status: "replied",
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(reviews.id, reviewId),
                eq(reviews.tenantId, session.tenantId)
            )
        );

    revalidatePath("/dashboard/reputation");
    return { success: true };
}

export async function getServiceConfigStatus() {
    return {
        telnyx: !!process.env.TELNYX_API_KEY,
        resend: !!process.env.RESEND_API_KEY,
    };
}
