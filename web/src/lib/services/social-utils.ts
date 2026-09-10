/**
 * HighReach Social Studio Pure Domain Utilities
 *
 * Contains platform specifications, character validation rules,
 * hashtag generators, and AI copywriting prompt engines.
 * Decoupled from database I/O for clean unit testing and portability.
 */

import type { SocialPlatform, TenantSocialSettings, ShortLinkingPreference } from "../types/database.ts";

// ── Platform Specifications & Constraints ───────────────────────
export interface PlatformSpec {
    name: string;
    maxCharacters: number;
    maxMedia: number;
    supportedMediaTypes: ("image" | "video")[];
    placeholder: string;
    brandColor: string;
}

export const PLATFORM_SPECS: Record<SocialPlatform, PlatformSpec> = {
    twitter: {
        name: "X (Twitter)",
        maxCharacters: 280,
        maxMedia: 4,
        supportedMediaTypes: ["image", "video"],
        placeholder: "What is happening?!",
        brandColor: "#000000",
    },
    linkedin: {
        name: "LinkedIn",
        maxCharacters: 3000,
        maxMedia: 9,
        supportedMediaTypes: ["image", "video"],
        placeholder: "Share an insight or milestone with your professional network...",
        brandColor: "#0A66C2",
    },
    facebook: {
        name: "Facebook",
        maxCharacters: 63206,
        maxMedia: 10,
        supportedMediaTypes: ["image", "video"],
        placeholder: "What's on your mind?",
        brandColor: "#1877F2",
    },
    instagram: {
        name: "Instagram",
        maxCharacters: 2200,
        maxMedia: 10,
        supportedMediaTypes: ["image", "video"],
        placeholder: "Write a captivating caption with hashtags...",
        brandColor: "#E4405F",
    },
    threads: {
        name: "Threads",
        maxCharacters: 500,
        maxMedia: 10,
        supportedMediaTypes: ["image", "video"],
        placeholder: "Start a thread...",
        brandColor: "#000000",
    },
    youtube: {
        name: "YouTube Community",
        maxCharacters: 5000,
        maxMedia: 5,
        supportedMediaTypes: ["image", "video"],
        placeholder: "Post an update to your subscribers...",
        brandColor: "#FF0000",
    },
    tiktok: {
        name: "TikTok",
        maxCharacters: 2200,
        maxMedia: 1,
        supportedMediaTypes: ["video"],
        placeholder: "Add description and hashtags...",
        brandColor: "#010101",
    },
    pinterest: {
        name: "Pinterest",
        maxCharacters: 500,
        maxMedia: 1,
        supportedMediaTypes: ["image", "video"],
        placeholder: "Tell everyone what your Pin is about...",
        brandColor: "#E60023",
    },
    twitch: {
        name: "Twitch",
        maxCharacters: 500,
        maxMedia: 1,
        supportedMediaTypes: ["image"],
        placeholder: "Broadcast chat message or announcement to your stream...",
        brandColor: "#9146FF",
    },
    kick: {
        name: "Kick",
        maxCharacters: 500,
        maxMedia: 1,
        supportedMediaTypes: ["image"],
        placeholder: "Send stream announcement or chat broadcast...",
        brandColor: "#53FC18",
    },
};

/**
 * Validates post text length across each selected social platform.
 * Returns an array of validation errors if any platform limits are exceeded.
 */
export function validatePostContent(
    content: string,
    platforms: SocialPlatform[],
    overrides?: Partial<Record<SocialPlatform, { content?: string }>>
): { valid: boolean; errors: { platform: SocialPlatform; message: string }[] } {
    const errors: { platform: SocialPlatform; message: string }[] = [];

    for (const platform of platforms) {
        const spec = PLATFORM_SPECS[platform];
        if (!spec) continue;

        const effectiveContent = overrides?.[platform]?.content || content;
        if (effectiveContent.length > spec.maxCharacters) {
            errors.push({
                platform,
                message: `${spec.name} post exceeds limit by ${effectiveContent.length - spec.maxCharacters} characters (${effectiveContent.length}/${spec.maxCharacters})`,
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// ── AI Copilot Helper Functions ──────────────────────────────────
export type AiTone = "engaging" | "professional" | "viral_hook" | "storyteller" | "concise";

/**
 * Generates an optimized social media caption based on the prompt, tone, and target platform.
 * Provides high-converting formatting, hashtags, and hooks tailored for SMB lead generation.
 */
export function generateAiSocialPost(
    topic: string,
    tone: AiTone = "engaging",
    targetPlatform?: SocialPlatform
): string {
    const cleanTopic = topic.trim();
    const hashtagBase = `#${cleanTopic.split(/\s+/).slice(0, 2).map(w => w.replace(/[^a-zA-Z0-9]/g, "")).join("")} #HighReach #Growth #LeadGen`;

    switch (tone) {
        case "viral_hook":
            return `95% of businesses lose customers within the first 5 minutes of inquiry.\n\nHere is how we completely changed our lead capture strategy for ${cleanTopic}:\n\n1. Instant 60-second automated qualification\n2. Real-time calendar syncing\n3. Zero friction follow-ups\n\nWhat is your biggest bottleneck right now?\n\n${hashtagBase}`;

        case "professional":
            return `Delighted to share our latest framework around ${cleanTopic}.\n\nSpeed to lead continues to be the decisive factor in conversion rates across modern sales teams. By unifying omnichannel communications into a single intelligent inbox, response times drop by 80% while pipeline velocity increases dramatically.\n\nRead more or share your thoughts below.\n\n${hashtagBase}`;

        case "storyteller":
            return `Three months ago, a local business owner told us: "I'm losing deals because I'm on the job site when calls come in."\n\nThat problem inspired our focus on ${cleanTopic}.\n\nToday, missed calls are automatically engaged with an intelligent SMS text-back in under 30 seconds. The result? 42 new appointments booked last month alone with zero manual effort.\n\nNever let a warm lead go cold.\n\n${hashtagBase}`;

        case "concise":
            return `Speed is everything in sales. With ${cleanTopic}, convert leads before competitors even hit 'reply'.\n\n⚡️ Instant replies\n📅 Direct calendar booking\n📈 Proven pipeline ROI\n\n${hashtagBase}`;

        case "engaging":
        default:
            return `Are you still waiting hours to follow up with inbound inquiries? ⏳\n\nWhen someone reaches out about ${cleanTopic}, every minute counts. Research shows responding in under 5 minutes increases conversion odds by up to 21x.\n\nHow fast does your team currently reply to new leads? Drop your average time below! 👇\n\n${hashtagBase}`;
    }
}

/**
 * Suggests relevant hashtags based on a topic string.
 */
export function generateHashtags(topic: string): string[] {
    const keywords = topic.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
    const standard = ["LeadGeneration", "SpeedToLead", "SmallBusiness", "CustomerSuccess", "GrowthMarketing"];
    const custom = keywords.map(k => k.charAt(0).toUpperCase() + k.slice(1));
    return Array.from(new Set([...custom, ...standard])).slice(0, 7);
}

// ── UTM Attribution Link Builder ────────────────────────────────
/**
 * Safely constructs a URL tagged with UTM parameters for lead tracking.
 */
export function buildUtmUrl(
    rawUrl: string,
    platform: SocialPlatform,
    campaignName?: string
): string {
    const trimmed = rawUrl.trim();
    if (!trimmed) return "";

    try {
        const fullUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://")
            ? trimmed
            : `https://${trimmed}`;

        const urlObj = new URL(fullUrl);
        urlObj.searchParams.set("utm_source", platform);
        urlObj.searchParams.set("utm_medium", "social");
        urlObj.searchParams.set("utm_campaign", campaignName ? campaignName.toLowerCase().replace(/\s+/g, "_") : "highreach_social");
        return urlObj.toString();
    } catch {
        return rawUrl;
    }
}

// ── Smart Queue Scheduling Calculation ──────────────────────────
/**
 * Determines the next vacant schedule slot based on tenant preferences and existing bookings.
 * Default preferred slots: 9:00 AM, 1:00 PM, 6:00 PM.
 */
export function calculateNextAvailableSlot(
    existingScheduledDates: (string | Date)[],
    preferredTimes: string[] = ["09:00", "13:00", "18:00"],
    referenceDate: Date = new Date()
): Date {
    const occupiedTimestamps = new Set(
        existingScheduledDates.map(d => {
            const date = typeof d === "string" ? new Date(d) : d;
            return date.getTime();
        })
    );

    // Look up to 14 days ahead for next slot
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const candidateDay = new Date(referenceDate);
        candidateDay.setDate(candidateDay.getDate() + dayOffset);

        for (const timeStr of preferredTimes) {
            const [hoursStr, minutesStr] = timeStr.split(":");
            const candidate = new Date(candidateDay);
            candidate.setHours(parseInt(hoursStr, 10), parseInt(minutesStr, 10), 0, 0);

            // Must be at least 15 minutes into the future
            if (candidate.getTime() <= referenceDate.getTime() + 15 * 60 * 1000) {
                continue;
            }

            // Check if slot is within 25 minutes of any existing scheduled post
            const isColliding = Array.from(occupiedTimestamps).some(ts => {
                return Math.abs(ts - candidate.getTime()) < 25 * 60 * 1000;
            });

            if (!isColliding) {
                return candidate;
            }
        }
    }

    // Fallback: tomorrow at 09:00 AM
    const fallback = new Date(referenceDate);
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(9, 0, 0, 0);
    return fallback;
}

// ── Multi-Post Thread Validation ────────────────────────────────
/**
 * Validates each sequential post in a multi-post thread (for X/Twitter & Threads).
 */
export function validateThreadContent(
    threadItems: string[],
    platform: SocialPlatform
): { valid: boolean; errors: { index: number; message: string }[] } {
    const spec = PLATFORM_SPECS[platform] || PLATFORM_SPECS.twitter;
    const errors: { index: number; message: string }[] = [];

    threadItems.forEach((text, idx) => {
        if (!text.trim()) {
            errors.push({ index: idx, message: `Thread post #${idx + 1} cannot be empty` });
        } else if (text.length > spec.maxCharacters) {
            errors.push({
                index: idx,
                message: `Thread post #${idx + 1} exceeds ${spec.name} limit by ${text.length - spec.maxCharacters} chars`,
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

// ── Global Settings Defaults ────────────────────────────────────
export const DEFAULT_QUEUE_SLOTS = [
    { label: "Morning", time: "09:00" },
    { label: "Lunch", time: "13:00" },
    { label: "Evening", time: "18:00" },
    { label: "Night", time: "21:00" },
];

export const DEFAULT_SOCIAL_SETTINGS: TenantSocialSettings = {
    shortLinking: "always",
    defaultTimeSlots: ["09:00", "13:00", "18:00", "21:00"],
    defaultTags: ["SpeedToLead", "HighReach"],
    streakReminderEmail: true,
};

// ── Daily Posting Streak System ─────────────────────────────────
/**
 * Calculates posting consistency streak from an array of published/scheduled dates.
 * Returns current consecutive day streak, longest streak, and whether the streak is at risk today.
 */
export function calculatePostingStreak(
    postDates: (string | Date)[],
    referenceDate: Date = new Date()
): { currentStreak: number; longestStreak: number; isAtRisk: boolean } {
    if (!postDates || postDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0, isAtRisk: false };
    }

    // Normalize to unique YYYY-MM-DD strings in local timezone
    const uniqueDays = new Set<string>();
    for (const d of postDates) {
        const dateObj = typeof d === "string" ? new Date(d) : d;
        if (!isNaN(dateObj.getTime())) {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getDate()).padStart(2, "0");
            uniqueDays.add(`${y}-${m}-${day}`);
        }
    }

    const todayStr = (() => {
        const y = referenceDate.getFullYear();
        const m = String(referenceDate.getMonth() + 1).padStart(2, "0");
        const d = String(referenceDate.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    })();

    const yesterdayStr = (() => {
        const yest = new Date(referenceDate);
        yest.setDate(yest.getDate() - 1);
        const y = yest.getFullYear();
        const m = String(yest.getMonth() + 1).padStart(2, "0");
        const d = String(yest.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    })();

    const hasToday = uniqueDays.has(todayStr);
    const hasYesterday = uniqueDays.has(yesterdayStr);

    let currentStreak = 0;
    const startFromDate = hasToday
        ? new Date(referenceDate)
        : hasYesterday
        ? new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000)
        : null;

    if (startFromDate) {
        let checkDate = new Date(startFromDate);
        while (true) {
            const y = checkDate.getFullYear();
            const m = String(checkDate.getMonth() + 1).padStart(2, "0");
            const d = String(checkDate.getDate()).padStart(2, "0");
            const key = `${y}-${m}-${d}`;

            if (uniqueDays.has(key)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    }

    // If streak active from yesterday but today not posted yet, streak is at risk
    const isAtRisk = !hasToday && hasYesterday && currentStreak > 0;
    const longestStreak = Math.max(currentStreak, uniqueDays.size > 0 ? 1 : 0);

    return {
        currentStreak,
        longestStreak,
        isAtRisk,
    };
}
