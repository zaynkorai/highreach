"use server";

/**
 * HighReach Social Studio Server Actions
 *
 * Implements session validation, RBAC checks, and triggers
 * for social account management, post authoring, AI copywriting,
 * and Inngest durable scheduling.
 */

import { getSessionWithRole } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import {
    SocialService,
    generateAiSocialPost,
    generateHashtags,
    type AiTone,
} from "@/lib/services/social.service";
import { inngest } from "@/lib/inngest/client";
import type {
    SocialPlatform,
    SocialPostStatus,
    SocialPostSettings,
    SocialAccount,
    SocialPost,
    TenantSocialSettings,
} from "@/lib/types/database";

/**
 * Fetch connected social accounts for current tenant.
 * Auto-seeds demo accounts if tenant has zero connections for immediate testing.
 */
export async function getSocialAccountsAction(): Promise<{ success: boolean; accounts: SocialAccount[]; error?: string }> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, accounts: [], error: "Unauthorized" };

        const accounts = await SocialService.seedDefaultMockAccountsIfEmpty(session.tenantId);
        return { success: true, accounts };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load accounts";
        return { success: false, accounts: [], error: message };
    }
}

/**
 * Connect a new social channel to current tenant.
 */
export async function connectSocialAccountAction(data: {
    platform: SocialPlatform;
    accountName: string;
    accountHandle?: string;
    avatarUrl?: string;
}): Promise<{ success: boolean; account?: SocialAccount; error?: string }> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const account = await SocialService.connectAccount(session.tenantId, data);
        revalidatePath("/dashboard/social");
        return { success: true, account };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to connect account";
        return { success: false, error: message };
    }
}

/**
 * Disconnect an existing social channel.
 */
export async function disconnectSocialAccountAction(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        await SocialService.disconnectAccount(session.tenantId, accountId);
        revalidatePath("/dashboard/social");
        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to disconnect account";
        return { success: false, error: message };
    }
}

/**
 * Fetch social posts with optional filters.
 */
export async function getSocialPostsAction(filters?: {
    status?: SocialPostStatus;
    platform?: SocialPlatform;
    startDate?: string;
    endDate?: string;
}): Promise<{ success: boolean; posts: SocialPost[]; error?: string }> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, posts: [], error: "Unauthorized" };

        const posts = await SocialService.getPosts(session.tenantId, {
            status: filters?.status,
            platform: filters?.platform,
            startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
        });

        return { success: true, posts };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch posts";
        return { success: false, posts: [], error: message };
    }
}

/**
 * Create a new post (Draft, Scheduled, or Publish Immediately).
 */
export async function createSocialPostAction(data: {
    content: string;
    platforms: SocialPlatform[];
    mediaUrls?: string[];
    scheduledAt?: string | null;
    settings?: SocialPostSettings;
    publishNow?: boolean;
}): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const post = await SocialService.createPost(session.tenantId, session.user.id, {
            content: data.content,
            platforms: data.platforms,
            mediaUrls: data.mediaUrls,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
            settings: data.settings,
            publishNow: data.publishNow,
        });

        // Trigger durable scheduler if scheduled for a future time
        if (post.status === "scheduled" && post.scheduled_at) {
            try {
                await inngest.send({
                    name: "social/post.scheduled",
                    data: {
                        post_id: post.id,
                        tenant_id: session.tenantId,
                        scheduled_at: post.scheduled_at,
                    },
                });
            } catch (inngestErr) {
                console.warn("[Social Studio] Inngest scheduling trigger warning:", inngestErr);
            }
        }

        revalidatePath("/dashboard/social");
        return { success: true, post };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create post";
        return { success: false, error: message };
    }
}

/**
 * Delete a social post.
 */
export async function deleteSocialPostAction(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        await SocialService.deletePost(session.tenantId, postId);
        revalidatePath("/dashboard/social");
        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to delete post";
        return { success: false, error: message };
    }
}

/**
 * Publish a scheduled or draft post immediately.
 */
export async function publishSocialPostNowAction(postId: string): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const post = await SocialService.dispatchPublish(session.tenantId, postId);
        revalidatePath("/dashboard/social");
        return { success: true, post };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to publish post";
        return { success: false, error: message };
    }
}

/**
 * AI Assistant: Generate high-converting social caption.
 */
export async function generateAiSocialDraftAction(
    topic: string,
    tone: AiTone = "engaging",
    targetPlatform?: SocialPlatform
): Promise<{ success: boolean; content?: string; hashtags?: string[]; error?: string }> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const content = generateAiSocialPost(topic, tone, targetPlatform);
        const hashtags = generateHashtags(topic);
        return { success: true, content, hashtags };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "AI generation failed";
        return { success: false, error: message };
    }
}

/**
 * Fetch Studio analytics and summary stats.
 */
export async function getSocialStatsAction(): Promise<{
    success: boolean;
    stats?: {
        totalPosts: number;
        scheduledCount: number;
        publishedCount: number;
        draftsCount: number;
        totalImpressions: number;
        totalEngagements: number;
        connectedAccountsCount: number;
    };
    error?: string;
}> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const stats = await SocialService.getStats(session.tenantId);
        return { success: true, stats };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch stats";
        return { success: false, error: message };
    }
}

/**
 * Duplicate a post into a draft for repurposing.
 */
export async function duplicateSocialPostAction(postId: string): Promise<{
    success: boolean;
    post?: SocialPost;
    error?: string;
}> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const post = await SocialService.duplicatePost(session.tenantId, postId, session.user.id);
        revalidatePath("/dashboard/social");
        return { success: true, post };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to duplicate post";
        return { success: false, error: message };
    }
}

/**
 * Calculate the next available queue time slot.
 */
export async function getNextAvailableQueueSlotAction(): Promise<{
    success: boolean;
    slot?: string;
    error?: string;
}> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const slotDate = await SocialService.getNextQueueSlot(session.tenantId);
        return { success: true, slot: slotDate.toISOString() };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to calculate slot";
        return { success: false, error: message };
    }
}

/**
 * Fetch channel-specific performance metrics.
 */
export async function getChannelAnalyticsBreakdownAction(): Promise<{
    success: boolean;
    breakdown?: {
        platform: SocialPlatform;
        name: string;
        impressions: number;
        engagements: number;
        postCount: number;
    }[];
    error?: string;
}> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const breakdown = await SocialService.getChannelAnalyticsBreakdown(session.tenantId);
        return { success: true, breakdown };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch breakdown";
        return { success: false, error: message };
    }
}

/**
 * Retrieve tenant social studio settings.
 */
export async function getTenantSocialSettingsAction(): Promise<{
    success: boolean;
    settings?: TenantSocialSettings;
    error?: string;
}> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const settings = await SocialService.getTenantSocialSettings(session.tenantId);
        return { success: true, settings };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load settings";
        return { success: false, error: message };
    }
}

/**
 * Update tenant social studio settings (short-linking, time slots, default tags, reminders).
 */
export async function updateTenantSocialSettingsAction(
    updates: Partial<TenantSocialSettings>
): Promise<{
    success: boolean;
    settings?: TenantSocialSettings;
    error?: string;
}> {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const settings = await SocialService.updateTenantSocialSettings(session.tenantId, updates);
        revalidatePath("/dashboard/social");
        return { success: true, settings };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update settings";
        return { success: false, error: message };
    }
}

