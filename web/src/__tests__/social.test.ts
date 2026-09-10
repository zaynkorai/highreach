import test from "node:test";
import assert from "node:assert/strict";
import {
    validatePostContent,
    generateAiSocialPost,
    generateHashtags,
    buildUtmUrl,
    calculateNextAvailableSlot,
    validateThreadContent,
    PLATFORM_SPECS,
    calculatePostingStreak,
    DEFAULT_SOCIAL_SETTINGS,
} from "../lib/services/social-utils.ts";

test("Social Studio (Postiz Engine) unit tests", async (t) => {
    await t.test("Platform specs include required social networks and streaming channels", () => {
        assert.ok(PLATFORM_SPECS.twitter, "Twitter/X spec defined");
        assert.equal(PLATFORM_SPECS.twitter.maxCharacters, 280);

        assert.ok(PLATFORM_SPECS.linkedin, "LinkedIn spec defined");
        assert.equal(PLATFORM_SPECS.linkedin.maxCharacters, 3000);

        assert.ok(PLATFORM_SPECS.facebook, "Facebook spec defined");
        assert.ok(PLATFORM_SPECS.instagram, "Instagram spec defined");
        assert.equal(PLATFORM_SPECS.instagram.maxCharacters, 2200);

        assert.ok(PLATFORM_SPECS.threads, "Threads spec defined");
        assert.ok(PLATFORM_SPECS.youtube, "YouTube Community spec defined");

        // Twitch & Kick (Postiz parity additions)
        assert.ok(PLATFORM_SPECS.twitch, "Twitch spec defined");
        assert.equal(PLATFORM_SPECS.twitch.maxCharacters, 500);
        assert.equal(PLATFORM_SPECS.twitch.brandColor, "#9146FF");

        assert.ok(PLATFORM_SPECS.kick, "Kick spec defined");
        assert.equal(PLATFORM_SPECS.kick.maxCharacters, 500);
        assert.equal(PLATFORM_SPECS.kick.brandColor, "#53FC18");
    });

    await t.test("validatePostContent enforces Twitter 280-char limit", () => {
        const shortContent = "Speed to lead matters! We reply to calls in under 60 seconds.";
        const validRes = validatePostContent(shortContent, ["twitter", "linkedin"]);
        assert.equal(validRes.valid, true);
        assert.equal(validRes.errors.length, 0);

        const longContent = "A".repeat(281);
        const invalidRes = validatePostContent(longContent, ["twitter", "linkedin"]);
        assert.equal(invalidRes.valid, false);
        assert.equal(invalidRes.errors.length, 1);
        assert.equal(invalidRes.errors[0].platform, "twitter");
        assert.match(invalidRes.errors[0].message, /exceeds limit by 1/);
    });

    await t.test("validatePostContent honors platform-specific content overrides", () => {
        const globalContent = "A".repeat(300); // Exceeds Twitter 280, fits LinkedIn 3000
        const overrides = {
            twitter: { content: "Short tweet under 280 chars!" },
        };

        const res = validatePostContent(globalContent, ["twitter", "linkedin"], overrides);
        assert.equal(res.valid, true);
        assert.equal(res.errors.length, 0);
    });

    await t.test("generateAiSocialPost produces structured copy with hooks and hashtags", () => {
        const viralPost = generateAiSocialPost("Speed to lead for plumbers", "viral_hook");
        assert.ok(viralPost.length > 50);
        assert.match(viralPost, /Speed to lead for plumbers/);
        assert.match(viralPost, /#HighReach/);

        const professionalPost = generateAiSocialPost("AI Omnichannel Inbox", "professional");
        assert.ok(professionalPost.length > 50);
        assert.match(professionalPost, /AI Omnichannel Inbox/);

        const concisePost = generateAiSocialPost("Instant Booking", "concise");
        assert.ok(concisePost.length < 300);
        assert.match(concisePost, /⚡️/);
    });

    await t.test("generateHashtags returns relevant sanitized tags", () => {
        const tags = generateHashtags("Emergency HVAC Repair & Quotes");
        assert.ok(tags.length >= 3);
        assert.ok(tags.includes("Emergency"));
        assert.ok(tags.includes("Hvac"));
        assert.ok(tags.includes("SpeedToLead"));
    });

    await t.test("buildUtmUrl appends platform and campaign tracking parameters", () => {
        const url = "https://highreach.io/demo";
        const tagged = buildUtmUrl(url, "linkedin", "Spring Promo 2026");
        assert.match(tagged, /utm_source=linkedin/);
        assert.match(tagged, /utm_medium=social/);
        assert.match(tagged, /utm_campaign=spring_promo_2026/);
    });

    await t.test("calculateNextAvailableSlot finds unoccupied preferred queue slot", () => {
        const baseDate = new Date();
        baseDate.setHours(8, 0, 0, 0);
        const existing = [new Date(baseDate)];
        existing[0].setHours(9, 0, 0, 0);

        const nextSlot = calculateNextAvailableSlot(existing, ["09:00", "13:00", "18:00"], baseDate);
        assert.equal(nextSlot.getHours(), 13);
    });

    await t.test("validateThreadContent validates multi-post threads", () => {
        const validThread = ["Tweet 1 of the thread", "Tweet 2 with insights"];
        const res = validateThreadContent(validThread, "twitter");
        assert.equal(res.valid, true);
        assert.equal(res.errors.length, 0);

        const invalidThread = ["Valid tweet", "A".repeat(300)];
        const badRes = validateThreadContent(invalidThread, "twitter");
        assert.equal(badRes.valid, false);
        assert.equal(badRes.errors.length, 1);
        assert.equal(badRes.errors[0].index, 1);
    });

    await t.test("calculatePostingStreak computes active streaks and detects at-risk status", () => {
        const refDate = new Date(2026, 2, 10, 14, 0, 0); // March 10, 2026

        // Case 1: Empty dates returns zero
        const zeroRes = calculatePostingStreak([], refDate);
        assert.equal(zeroRes.currentStreak, 0);
        assert.equal(zeroRes.longestStreak, 0);
        assert.equal(zeroRes.isAtRisk, false);

        // Case 2: Posted today (March 10) and yesterday (March 9) -> 2-day streak, not at risk
        const activeRes = calculatePostingStreak([
            new Date(2026, 2, 10, 10, 0, 0),
            new Date(2026, 2, 9, 15, 30, 0),
        ], refDate);
        assert.equal(activeRes.currentStreak, 2);
        assert.equal(activeRes.isAtRisk, false);

        // Case 3: Posted yesterday (March 9) but NOT yet today (March 10) -> streak active from yesterday, at risk!
        const atRiskRes = calculatePostingStreak([
            new Date(2026, 2, 9, 12, 0, 0),
            new Date(2026, 2, 8, 14, 0, 0),
        ], refDate);
        assert.equal(atRiskRes.currentStreak, 2);
        assert.equal(atRiskRes.isAtRisk, true);

        // Case 4: Gap of 2 days (last post March 7) -> streak broken, returns 0
        const brokenRes = calculatePostingStreak([
            new Date(2026, 2, 7, 12, 0, 0),
        ], refDate);
        assert.equal(brokenRes.currentStreak, 0);
        assert.equal(brokenRes.isAtRisk, false);
    });

    await t.test("DEFAULT_SOCIAL_SETTINGS has required Postiz feature defaults", () => {
        assert.equal(DEFAULT_SOCIAL_SETTINGS.shortLinking, "always");
        assert.ok(Array.isArray(DEFAULT_SOCIAL_SETTINGS.defaultTimeSlots));
        assert.ok(DEFAULT_SOCIAL_SETTINGS.defaultTimeSlots.includes("09:00"));
        assert.ok(DEFAULT_SOCIAL_SETTINGS.defaultTimeSlots.includes("18:00"));
        assert.ok(Array.isArray(DEFAULT_SOCIAL_SETTINGS.defaultTags));
        assert.equal(DEFAULT_SOCIAL_SETTINGS.streakReminderEmail, true);
    });
});

