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

export async function generateAiReviewReplyAction(reviewText: string, rating?: number): Promise<string> {
    const session = await getSessionWithRole();
    if (!session) throw new Error("Unauthorized");

    const cleanText = reviewText.toLowerCase();

    // Context-aware response intelligence based on sentiment & topic
    if (cleanText.includes("wait") || cleanText.includes("delay") || cleanText.includes("slow") || cleanText.includes("late")) {
        return "Thank you for bringing this to our attention. We sincerely apologize for the delay you experienced. We take scheduling and efficiency very seriously, and we are adjusting our workflow to prevent this moving forward. Please feel free to reach out to us directly so we can make this right.";
    }

    if (cleanText.includes("rude") || cleanText.includes("unprofessional") || cleanText.includes("attitude") || cleanText.includes("poor service")) {
        return "Thank you for your feedback. We are deeply concerned to hear about your experience, as providing courteous and professional care is our top priority. We are addressing this with our team immediately. Please reach out to our management so we can personally resolve this for you.";
    }

    if (cleanText.includes("price") || cleanText.includes("expensive") || cleanText.includes("cost") || cleanText.includes("bill") || cleanText.includes("overpriced")) {
        return "Thank you for sharing your feedback. We strive to provide transparent and competitive pricing alongside premium service quality. We would welcome the chance to review your billing details and address any concerns—please get in touch with our office directly.";
    }

    if (cleanText.includes("recommend") || cleanText.includes("amazing") || cleanText.includes("great") || cleanText.includes("excellent") || cleanText.includes("best") || cleanText.includes("fantastic") || (rating && rating >= 4)) {
        return "Thank you so much for the wonderful review and your kind recommendation! Our entire team is thrilled to know that we exceeded your expectations. We truly appreciate your support and look forward to serving you again soon!";
    }

    if (rating && rating <= 2) {
        return "Thank you for taking the time to share your review. We are truly sorry that your visit did not meet your expectations. We are committed to continuous improvement, and we would appreciate the opportunity to learn more about how we can make things right. Please reach out to our team at your earliest convenience.";
    }

    return "Thank you for your honest review and feedback! We are constantly working to deliver the best experience possible for our customers. If there is anything else we can do for you, please don't hesitate to let us know.";
}

