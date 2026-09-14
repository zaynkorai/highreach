import { inngest } from "@/lib/inngest/client";
import { db, socialPosts } from "@/lib/db";
import { eq, and, lte } from "drizzle-orm";
import { SocialService } from "@/lib/services/social.service";

/**
 * Inngest Durable Scheduler for Social Posts.
 * Sleeps durably until the post's scheduled timestamp, then triggers
 * multi-platform dispatch across all connected accounts.
 */
export const publishScheduledSocialPost = inngest.createFunction(
    { id: "publish-scheduled-social-post" },
    { event: "social/post.scheduled" },
    async ({ event, step }) => {
        const { post_id, tenant_id, scheduled_at } = event.data;

        // If scheduled for a future timestamp, sleep until then
        if (scheduled_at) {
            const scheduleDate = new Date(scheduled_at);
            if (scheduleDate.getTime() > Date.now()) {
                await step.sleepUntil("wait-for-publish-time", scheduleDate);
            }
        }

        // Verify post is still in scheduled status before publishing
        const shouldPublish = await step.run("verify-post-status", async () => {
            const [post] = await db
                .select()
                .from(socialPosts)
                .where(
                    and(
                        eq(socialPosts.id, post_id),
                        eq(socialPosts.tenantId, tenant_id)
                    )
                )
                .limit(1);

            return post && (post.status === "scheduled" || post.status === "publishing");
        });

        if (!shouldPublish) {
            return { skipped: "post-cancelled-or-already-published", post_id };
        }

        // Execute publication dispatch
        const publishedPost = await step.run("dispatch-publish", async () => {
            return await SocialService.dispatchPublish(tenant_id, post_id);
        });

        return { success: true, post_id, status: publishedPost.status };
    }
);

/**
 * Recurring cron job that sweeps any scheduled posts whose scheduled time
 * has passed and dispatches them immediately.
 */
export const sweepDueSocialPosts = inngest.createFunction(
    { id: "sweep-due-social-posts" },
    { cron: "*/10 * * * *" }, // Run every 10 minutes
    async ({ step }) => {
        const duePosts = await step.run("fetch-due-posts", async () => {
            const now = new Date();
            const rows = await db
                .select({
                    id: socialPosts.id,
                    tenantId: socialPosts.tenantId,
                    scheduledAt: socialPosts.scheduledAt,
                })
                .from(socialPosts)
                .where(
                    and(
                        eq(socialPosts.status, "scheduled"),
                        lte(socialPosts.scheduledAt, now)
                    )
                )
                .limit(50);

            return rows;
        });

        if (!duePosts || duePosts.length === 0) {
            return { processed: 0 };
        }

        let processed = 0;
        for (const p of duePosts) {
            await step.run(`dispatch-post-${p.id}`, async () => {
                await SocialService.dispatchPublish(p.tenantId, p.id);
            });
            processed++;
        }

        return { processed };
    }
);
