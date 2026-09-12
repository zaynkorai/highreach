import test from "node:test";
import assert from "node:assert/strict";
import {
    estimateTokens,
    buildSystemPromptContext,
    buildChatMessages,
    buildPromptContext,
} from "../lib/ai/prompt-builder.ts";
import { assembleAgentContext } from "../lib/ai/context.ts";
import { assembleTenantKnowledge } from "../lib/ai/knowledge.ts";
import { MemoryCache, tenantKnowledgeCache, invalidateTenantKnowledgeCache } from "../lib/ai/cache.ts";
import type {
    TenantKnowledgeContext,
    ContactHistoryContext,
    ActiveThreadContext,
    ThreadMessage,
} from "../lib/ai/types.ts";

test("Context Assembler Engine Unit Tests", async (t) => {
    // ─────────────────────────────────────────────────────────────
    // 1. Token Estimation Tests
    // ─────────────────────────────────────────────────────────────
    await t.test("estimateTokens accurately calculates token budget", () => {
        assert.equal(estimateTokens(""), 0);
        assert.equal(estimateTokens("abcd"), 1);
        assert.equal(estimateTokens("12345678"), 2);
        // ~100 characters should approximate 25 tokens
        const sampleText = "The quick brown fox jumps over the lazy dog. A fast heuristic for LLM context assembly.";
        const tokens = estimateTokens(sampleText);
        assert.ok(tokens >= 20 && tokens <= 30, `Estimated ${tokens} tokens for 88 chars`);
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Chat Message Mapping & Roles
    // ─────────────────────────────────────────────────────────────
    await t.test("buildChatMessages maps inbound to user, outbound to assistant, and internal to system", () => {
        const mockMessages: ThreadMessage[] = [
            {
                id: "msg-1",
                conversationId: "conv-1",
                direction: "inbound",
                role: "user",
                channel: "sms",
                content: "Hello, I need an emergency plumber.",
                sentAt: new Date().toISOString(),
            },
            {
                id: "msg-2",
                conversationId: "conv-1",
                direction: "outbound",
                role: "assistant",
                channel: "sms",
                content: "We have an emergency crew available. What is your address?",
                sentAt: new Date().toISOString(),
            },
            {
                id: "msg-3",
                conversationId: "conv-1",
                direction: "outbound",
                role: "system",
                channel: "sms",
                content: "Internal note: Lead marked high priority.",
                sentAt: new Date().toISOString(),
                metadata: { is_internal: true },
            },
        ];

        const thread: ActiveThreadContext = {
            conversationId: "conv-1",
            channel: "sms",
            status: "open",
            lastMessageAt: new Date().toISOString(),
            messages: mockMessages,
            totalMessagesCount: 3,
            hasInboundReplyPending: false,
        };

        const chat = buildChatMessages(thread);
        assert.equal(chat.length, 3);
        assert.equal(chat[0].role, "user");
        assert.equal(chat[0].content, "Hello, I need an emergency plumber.");
        assert.equal(chat[1].role, "assistant");
        assert.equal(chat[1].content, "We have an emergency crew available. What is your address?");
        assert.equal(chat[2].role, "system");
        assert.equal(chat[2].content, "Internal note: Lead marked high priority.");
    });

    // ─────────────────────────────────────────────────────────────
    // 3. System Prompt Formatting: Full Grounded Context
    // ─────────────────────────────────────────────────────────────
    await t.test("buildSystemPromptContext formats tenant knowledge, contact history, and active thread", () => {
        const mockTenant: TenantKnowledgeContext = {
            tenantId: "tenant-100",
            name: "Apex Plumbing Pros",
            slug: "apex-plumbing",
            phoneNumber: "+15551234567",
            industry: "Home Services / Plumbing",
            timezone: "America/New_York",
            businessHours: [
                { dayOfWeek: 1, dayName: "Monday", open: "08:00", close: "18:00" },
                { dayOfWeek: 2, dayName: "Tuesday", open: "08:00", close: "18:00" },
            ],
            knowledgeChunks: [
                {
                    id: "chunk-1",
                    sourceId: "src-1",
                    title: "Emergency Dispatch Fee",
                    sourceType: "service_catalog",
                    content: "Emergency diagnostic callout is $99 flat. Waived if service is approved.",
                    similarityScore: 0.92,
                },
                {
                    id: "chunk-2",
                    sourceId: "src-2",
                    title: "Warranty Policy",
                    sourceType: "faq",
                    content: "All pipe repairs come with a 2-year parts and labor guarantee.",
                    similarityScore: 0.88,
                },
            ],
        };

        const mockContact: ContactHistoryContext = {
            contactId: "contact-200",
            isKnownContact: true,
            profile: {
                id: "contact-200",
                tenantId: "tenant-100",
                firstName: "Jane",
                lastName: "Doe",
                fullName: "Jane Doe",
                email: "jane.doe@example.com",
                phone: "+15559876543",
                tags: ["residential", "vip"],
                source: "Google Local Services",
                notes: "Prefers morning appointments. Dogs on premise.",
                createdAt: "2026-01-15T10:00:00Z",
                updatedAt: "2026-03-01T12:00:00Z",
            },
            opportunities: [
                {
                    id: "opp-1",
                    title: "Main Water Line Replacement",
                    pipelineName: "Residential Sales",
                    stageName: "Proposal Sent",
                    orderIndex: 2,
                    value: 4500,
                    status: "open",
                    createdAt: "2026-03-05T14:30:00Z",
                },
            ],
            appointments: [
                {
                    id: "apt-1",
                    calendarName: "Dispatch Inspection",
                    startTime: "2026-03-15T09:00:00Z",
                    endTime: "2026-03-15T10:00:00Z",
                    status: "confirmed",
                    location: "123 Elm St, Austin TX",
                    notes: "Check basement sump pump",
                },
            ],
            activities: [
                {
                    id: "act-1",
                    type: "call_log",
                    content: "Customer called inquiring about line pressure drop.",
                    metadata: { duration: 180 },
                    createdAt: "2026-03-10T11:00:00Z",
                    createdByName: "Alex Dispatcher",
                },
            ],
            formSubmissions: [
                {
                    id: "sub-1",
                    formName: "Emergency Request Form",
                    data: { issue: "Low pressure", location: "Basement" },
                    submittedAt: "2026-03-10T10:45:00Z",
                },
            ],
        };

        const mockThread: ActiveThreadContext = {
            conversationId: "conv-1",
            channel: "sms",
            status: "open",
            lastMessageAt: "2026-03-12T08:30:00Z",
            messages: [
                {
                    id: "m-1",
                    conversationId: "conv-1",
                    direction: "inbound",
                    role: "user",
                    channel: "sms",
                    content: "Hi, will the tech arrive before 10am?",
                    sentAt: "2026-03-12T08:30:00Z",
                },
            ],
            totalMessagesCount: 1,
            hasInboundReplyPending: true,
        };

        const promptText = buildSystemPromptContext(mockTenant, mockContact, mockThread);

        // Verify Business Profile Grounding
        assert.ok(promptText.includes("Apex Plumbing Pros"));
        assert.ok(promptText.includes("+15551234567"));
        assert.ok(promptText.includes("Monday: 08:00 – 18:00"));
        assert.ok(promptText.includes("Emergency diagnostic callout is $99 flat"));
        assert.ok(promptText.includes("2-year parts and labor guarantee"));

        // Verify Customer Profile Grounding
        assert.ok(promptText.includes("Jane Doe"));
        assert.ok(promptText.includes("Prefers morning appointments. Dogs on premise."));
        assert.ok(promptText.includes('"Main Water Line Replacement" ($4,500)'));
        assert.ok(promptText.includes("Proposal Sent"));
        assert.ok(promptText.includes("Dispatch Inspection"));
        assert.ok(promptText.includes("123 Elm St, Austin TX"));
        assert.ok(promptText.includes("Alex Dispatcher"));
        assert.ok(promptText.includes("Emergency Request Form"));

        // Verify Active Thread Context
        assert.ok(promptText.includes("**Channel**: SMS"));
        assert.ok(promptText.includes("**Awaiting Response**: YES"));
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Unknown Lead / Cold Inbound Contact Handling
    // ─────────────────────────────────────────────────────────────
    await t.test("buildSystemPromptContext handles unknown contact gracefully", () => {
        const mockTenant: TenantKnowledgeContext = {
            tenantId: "tenant-100",
            name: "Apex Plumbing Pros",
            slug: "apex-plumbing",
            timezone: "America/New_York",
            businessHours: [],
            knowledgeChunks: [],
        };

        const unknownContact: ContactHistoryContext = {
            contactId: null,
            isKnownContact: false,
            profile: null,
            opportunities: [],
            appointments: [],
            activities: [],
            formSubmissions: [],
        };

        const mockThread: ActiveThreadContext = {
            conversationId: "conv-new",
            channel: "sms",
            status: "open",
            lastMessageAt: new Date().toISOString(),
            messages: [],
            totalMessagesCount: 0,
            hasInboundReplyPending: false,
        };

        const promptText = buildSystemPromptContext(mockTenant, unknownContact, mockThread);

        assert.ok(promptText.includes("Unregistered / New prospective lead"));
        assert.ok(!promptText.includes("Pipeline Deals"));
        assert.ok(!promptText.includes("Appointments & Bookings"));
        assert.ok(promptText.includes("**Awaiting Response**: NO"));
    });

    // ─────────────────────────────────────────────────────────────
    // 5. Prompt Token Budgeting and Message Window Truncation
    // ─────────────────────────────────────────────────────────────
    await t.test("buildPromptContext enforces token budgets by trimming oldest messages", () => {
        const mockTenant: TenantKnowledgeContext = {
            tenantId: "tenant-100",
            name: "Tenant Co",
            slug: "tenant-co",
            timezone: "UTC",
            businessHours: [],
            knowledgeChunks: [],
        };

        const mockContact: ContactHistoryContext = {
            contactId: "c-1",
            isKnownContact: true,
            profile: {
                id: "c-1",
                tenantId: "tenant-100",
                firstName: "Bob",
                fullName: "Bob",
                tags: [],
                createdAt: "2026-01-01T00:00:00Z",
                updatedAt: "2026-01-01T00:00:00Z",
            },
            opportunities: [],
            appointments: [],
            activities: [],
            formSubmissions: [],
        };

        // Create 10 long messages (each ~200 chars = ~50 tokens)
        const messages: ThreadMessage[] = Array.from({ length: 10 }).map((_, i) => ({
            id: `msg-${i}`,
            conversationId: "conv-1",
            direction: (i % 2 === 0 ? "inbound" : "outbound"),
            role: (i % 2 === 0 ? "user" : "assistant"),
            channel: "sms",
            content: `Message ${i + 1}: ${"Long text chunk that consumes token budget. ".repeat(6)}`,
            sentAt: new Date().toISOString(),
        }));

        const mockThread: ActiveThreadContext = {
            conversationId: "conv-1",
            channel: "sms",
            status: "open",
            lastMessageAt: new Date().toISOString(),
            messages,
            totalMessagesCount: 10,
            hasInboundReplyPending: true,
        };

        // Restrict max tokens to a small budget that forces message trimming
        const promptResult = buildPromptContext(mockTenant, mockContact, mockThread, 350);

        assert.ok(promptResult.estimatedTokenCount <= 400);
        // Oldest messages should have been dropped, preserving the most recent turns
        assert.ok(promptResult.formattedMessages.length < 10);
        const lastTurn = promptResult.formattedMessages[promptResult.formattedMessages.length - 1];
        assert.ok(lastTurn.content.startsWith("Message 10:"), "Most recent turn is retained");
    });

    // ─────────────────────────────────────────────────────────────
    // 6. Validation: assembleAgentContext rejects missing tenantId
    // ─────────────────────────────────────────────────────────────
    await t.test("assembleAgentContext throws error if tenantId is missing or invalid", async () => {
        await assert.rejects(
            async () => await assembleAgentContext({ tenantId: "" }),
            /assembleAgentContext requires a valid tenantId string/
        );

        await assert.rejects(
            // @ts-expect-error testing runtime validation
            async () => await assembleAgentContext({}),
            /assembleAgentContext requires a valid tenantId string/
        );
    });

    // ─────────────────────────────────────────────────────────────
    // 7. Edge Cases: Contact History with Null or Missing Contact ID
    // ─────────────────────────────────────────────────────────────
    await t.test("assembleContactHistory handles null or missing contactId safely", async () => {
        const { assembleContactHistory } = await import("../lib/ai/contact-history.ts");
        const resNull = await assembleContactHistory("tenant-123", null);
        assert.equal(resNull.contactId, null);
        assert.equal(resNull.isKnownContact, false);
        assert.equal(resNull.profile, null);
        assert.deepEqual(resNull.opportunities, []);
        assert.deepEqual(resNull.appointments, []);
        assert.deepEqual(resNull.activities, []);
        assert.deepEqual(resNull.formSubmissions, []);

        const resUndefined = await assembleContactHistory("tenant-123", undefined);
        assert.equal(resUndefined.isKnownContact, false);
    });

    // ─────────────────────────────────────────────────────────────
    // 8. Edge Cases: Active Thread with No Identifiers
    // ─────────────────────────────────────────────────────────────
    await t.test("assembleActiveThread handles empty identifiers safely", async () => {
        const { assembleActiveThread } = await import("../lib/ai/active-thread.ts");
        const res = await assembleActiveThread("tenant-123", null, null);
        assert.equal(res.conversationId, null);
        assert.equal(res.messages.length, 0);
        assert.equal(res.totalMessagesCount, 0);
        assert.equal(res.hasInboundReplyPending, false);
    });

    // ─────────────────────────────────────────────────────────────
    // 9. Markdown Delimitation & Pillar Independence
    // ─────────────────────────────────────────────────────────────
    await t.test("buildSystemPromptContext maintains 3-pillar separation with Markdown dividers", () => {
        const mockTenant: TenantKnowledgeContext = {
            tenantId: "t-1",
            name: "Alpha Corp",
            slug: "alpha-corp",
            timezone: "UTC",
            businessHours: [{ dayOfWeek: 1, dayName: "Monday", open: "09:00", close: "17:00" }],
            knowledgeChunks: [{ id: "k-1", sourceId: "s-1", title: "Terms", sourceType: "document", content: "Net 30 terms." }],
        };
        const mockContact: ContactHistoryContext = {
            contactId: "c-1",
            isKnownContact: true,
            profile: { id: "c-1", tenantId: "t-1", firstName: "Alice", fullName: "Alice", tags: ["vip"], createdAt: "", updatedAt: "" },
            opportunities: [],
            appointments: [],
            activities: [],
            formSubmissions: [],
        };
        const mockThread: ActiveThreadContext = {
            conversationId: "conv-1",
            channel: "email",
            status: "open",
            lastMessageAt: null,
            messages: [{ id: "m-1", conversationId: "conv-1", direction: "inbound", role: "user", channel: "email", content: "Quote please", sentAt: "" }],
            totalMessagesCount: 1,
            hasInboundReplyPending: true,
        };

        const markdown = buildSystemPromptContext(mockTenant, mockContact, mockThread);
        const sections = markdown.split("\n\n---\n\n");
        assert.equal(sections.length, 3, "Expected exactly 3 top-level pillar sections separated by dividers");
        assert.ok(sections[0].includes("BUSINESS PROFILE & OPERATING CONTEXT"));
        assert.ok(sections[1].includes("CUSTOMER PROFILE & CRM HISTORY"));
        assert.ok(sections[2].includes("ACTIVE CONVERSATION CONTEXT"));
    });

    // ─────────────────────────────────────────────────────────────
    // 10. In-Memory TTL Cache Operations
    // ─────────────────────────────────────────────────────────────
    await t.test("MemoryCache stores, retrieves, and respects TTL expiration", async () => {
        const cache = new MemoryCache<string>(1); // 1-second default TTL
        cache.set("key1", "value1");
        assert.equal(cache.get("key1"), "value1");

        // Custom short TTL (50ms)
        cache.set("quickKey", "quickVal", 0.05);
        assert.equal(cache.get("quickKey"), "quickVal");

        await new Promise((resolve) => setTimeout(resolve, 60));
        assert.equal(cache.get("quickKey"), undefined, "Expired key should return undefined");
        assert.equal(cache.get("key1"), "value1", "Non-expired key should still be accessible");
    });

    // ─────────────────────────────────────────────────────────────
    // 11. MemoryCache delete, clear, and size methods
    // ─────────────────────────────────────────────────────────────
    await t.test("MemoryCache handles delete, clear, and size correctly", () => {
        const cache = new MemoryCache<{ data: number }>(60);
        assert.equal(cache.size(), 0);

        cache.set("item1", { data: 1 });
        cache.set("item2", { data: 2 });
        assert.equal(cache.size(), 2);

        const deleted = cache.delete("item1");
        assert.equal(deleted, true);
        assert.equal(cache.get("item1"), undefined);
        assert.equal(cache.size(), 1);

        cache.clear();
        assert.equal(cache.size(), 0);
        assert.equal(cache.get("item2"), undefined);
    });

    // ─────────────────────────────────────────────────────────────
    // 12. assembleTenantKnowledge Cache Hit
    // ─────────────────────────────────────────────────────────────
    await t.test("assembleTenantKnowledge serves from tenantKnowledgeCache without hitting DB", async () => {
        const cachedTenantId = "test-cached-tenant-999";
        const mockCachedContext: TenantKnowledgeContext = {
            tenantId: cachedTenantId,
            name: "Cached Plumbing Co",
            slug: "cached-plumbing",
            phoneNumber: "+15550001111",
            industry: "Plumbing",
            timezone: "America/Chicago",
            businessHours: [
                { dayOfWeek: 1, dayName: "Monday", open: "08:00", close: "17:00" },
            ],
            knowledgeChunks: [
                {
                    id: "chunk-cached-1",
                    sourceId: "src-cached-1",
                    title: "Standard Pricing",
                    sourceType: "faq",
                    content: "Standard callout is $75.",
                    similarityScore: 1.0,
                },
            ],
        };

        // Populate cache directly
        tenantKnowledgeCache.set(cachedTenantId, mockCachedContext);

        // Call assembleTenantKnowledge without search query
        const result = await assembleTenantKnowledge(cachedTenantId);

        assert.equal(result.tenantId, cachedTenantId);
        assert.equal(result.name, "Cached Plumbing Co");
        assert.equal(result.businessHours.length, 1);
        assert.equal(result.knowledgeChunks.length, 1);
        assert.equal(result.knowledgeChunks[0].title, "Standard Pricing");

        // Clean up
        invalidateTenantKnowledgeCache(cachedTenantId);
        assert.equal(tenantKnowledgeCache.get(cachedTenantId), undefined);
    });

    // ─────────────────────────────────────────────────────────────
    // 13. invalidateTenantKnowledgeCache invalidates tenant entry
    // ─────────────────────────────────────────────────────────────
    await t.test("invalidateTenantKnowledgeCache invalidates target tenant entry", () => {
        const tenantId = "tenant-to-invalidate";
        tenantKnowledgeCache.set(tenantId, {
            tenantId,
            name: "Invalidation Test",
            slug: "invalidation-test",
            timezone: "UTC",
            businessHours: [],
            knowledgeChunks: [],
        });

        assert.ok(tenantKnowledgeCache.get(tenantId));
        const deleted = invalidateTenantKnowledgeCache(tenantId);
        assert.equal(deleted, true);
        assert.equal(tenantKnowledgeCache.get(tenantId), undefined);
    });
});

