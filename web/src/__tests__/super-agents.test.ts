import test from "node:test";
import assert from "node:assert/strict";
import { runAgentDeliberation, extractJsonFromResponse } from "../lib/ai/agent-runner.ts";
import { getAgentPolicy } from "../lib/ai/agent-policy.ts";
import type {
    AssembledAgentContext,
    TenantKnowledgeContext,
    ContactHistoryContext,
    ActiveThreadContext,
} from "../lib/ai/types.ts";
import type { AgentPolicy } from "../lib/ai/agent-policy.ts";

function createMockContext(overrides: {
    tenant?: Partial<TenantKnowledgeContext>;
    contact?: Partial<ContactHistoryContext>;
    thread?: Partial<ActiveThreadContext>;
} = {}): AssembledAgentContext {
    const tenantId = overrides.tenant?.tenantId || "t-1";
    return {
        tenantId,
        assembledAt: new Date().toISOString(),
        tenant: {
            tenantId,
            name: "Test Co",
            slug: "test-co",
            phoneNumber: "+15550000000",
            industry: "Services",
            timezone: "America/New_York",
            businessHours: [],
            knowledgeChunks: [],
            ...overrides.tenant,
        },
        contact: {
            contactId: overrides.contact?.contactId || null,
            isKnownContact: !!overrides.contact?.isKnownContact,
            profile: overrides.contact?.profile || null,
            opportunities: overrides.contact?.opportunities || [],
            appointments: overrides.contact?.appointments || [],
            activities: overrides.contact?.activities || [],
            formSubmissions: overrides.contact?.formSubmissions || [],
            ...overrides.contact,
        },
        thread: {
            conversationId: null,
            channel: "sms",
            status: "open",
            lastMessageAt: null,
            messages: [],
            totalMessagesCount: 0,
            hasInboundReplyPending: false,
            ...overrides.thread,
        },
        prompt: {
            systemPromptSnippet: "",
            formattedMessages: [],
            estimatedTokenCount: 100,
        },
        metadata: {
            retrievedChunksCount: 0,
            executionTimeMs: 5,
            truncatedMessagesCount: 0,
        },
    };
}

test("Super Agents Deliberation & Policy Unit Tests", async (t) => {
    // ─────────────────────────────────────────────────────────────
    // 1. Policy Defaults & Safety Fallbacks
    // ─────────────────────────────────────────────────────────────
    await t.test("getAgentPolicy defaults to safe draft_only mode for unconfigured tenant", async () => {
        const policy = await getAgentPolicy("non-existent-tenant-id", "lead_qualifier");
        assert.equal(policy.isActive, true);
        assert.equal(policy.autonomyMode, "draft_only", "Safety default must be draft_only");
        assert.equal(policy.confidenceThreshold, 0.85);
        assert.equal(policy.agentType, "lead_qualifier");
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Deliberation Grounding: Known Contact with Upcoming Appointment
    // ─────────────────────────────────────────────────────────────
    await t.test("runAgentDeliberation grounds missed call in customer's upcoming appointment", async () => {
        const mockContext = createMockContext({
            tenant: {
                name: "Apex Heating & Air",
                slug: "apex-air",
                phoneNumber: "+15551112222",
                industry: "HVAC",
                businessHours: [{ dayOfWeek: 1, dayName: "Monday", open: "08:00", close: "18:00" }],
            },
            contact: {
                contactId: "c-10",
                isKnownContact: true,
                profile: {
                    id: "c-10",
                    tenantId: "t-1",
                    firstName: "Marcus",
                    lastName: "Vance",
                    fullName: "Marcus Vance",
                    phone: "+15559998888",
                    tags: ["vip"],
                    createdAt: "2026-01-01T00:00:00Z",
                    updatedAt: "2026-01-01T00:00:00Z",
                },
                appointments: [
                    {
                        id: "apt-1",
                        calendarName: "Furnace Safety Inspection",
                        startTime: "2026-03-15T14:00:00Z",
                        endTime: "2026-03-15T15:00:00Z",
                        status: "confirmed",
                    },
                ],
            },
            thread: {
                conversationId: "conv-10",
                hasInboundReplyPending: true,
            },
        });

        const draftPolicy: AgentPolicy = {
            tenantId: "t-1",
            agentType: "lead_qualifier",
            isActive: true,
            autonomyMode: "draft_only",
            confidenceThreshold: 0.85,
        };

        const result = await runAgentDeliberation({
            agentType: "lead_qualifier",
            triggerEvent: "call.missed",
            context: mockContext,
            policy: draftPolicy,
        });

        // Verify grounding in customer identity & appointment
        assert.ok(result.generatedResponse.includes("Marcus"), "Response must greet contact by name");
        assert.ok(result.generatedResponse.includes("Furnace Safety Inspection"), "Response must reference upcoming appointment");
        assert.ok(result.generatedResponse.includes("Apex Heating & Air"), "Response must mention business name");
        assert.ok(result.confidence >= 0.90, `Expected high confidence >= 0.90, got ${result.confidence}`);

        // Safety gate: in draft_only mode, recommended action must be save_draft
        assert.equal(result.recommendedActions[0].action, "save_draft");
        assert.ok(result.reasoning.length >= 2, "Must produce structured reasoning steps");
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Deliberation Grounding: Known Contact with Open Proposal
    // ─────────────────────────────────────────────────────────────
    await t.test("runAgentDeliberation grounds missed call in active sales proposal", async () => {
        const mockContext = createMockContext({
            tenant: {
                name: "Apex Roofing",
                phoneNumber: "+15552223333",
            },
            contact: {
                contactId: "c-20",
                isKnownContact: true,
                profile: {
                    id: "c-20",
                    tenantId: "t-1",
                    firstName: "Sarah",
                    fullName: "Sarah Connor",
                    phone: "+15554443333",
                    tags: ["commercial"],
                    createdAt: "2026-01-01T00:00:00Z",
                    updatedAt: "2026-01-01T00:00:00Z",
                },
                opportunities: [
                    {
                        id: "opp-1",
                        title: "Metal Roof Replacement",
                        pipelineName: "Commercial",
                        stageName: "Estimate Sent",
                        orderIndex: 2,
                        value: 12000,
                        status: "open",
                        createdAt: "2026-03-01T00:00:00Z",
                    },
                ],
            },
        });

        const autoPilotPolicy: AgentPolicy = {
            tenantId: "t-1",
            agentType: "lead_qualifier",
            isActive: true,
            autonomyMode: "auto_pilot",
            confidenceThreshold: 0.85,
        };

        const result = await runAgentDeliberation({
            agentType: "lead_qualifier",
            triggerEvent: "call.missed",
            context: mockContext,
            policy: autoPilotPolicy,
        });

        assert.ok(result.generatedResponse.includes("Sarah"));
        assert.ok(result.generatedResponse.includes("Metal Roof Replacement"));
        assert.ok(result.confidence >= 0.90);

        // Auto-pilot mode with confidence >= 0.85 should trigger send_sms
        assert.equal(result.recommendedActions[0].action, "send_sms");
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Unknown Lead Deliberation
    // ─────────────────────────────────────────────────────────────
    await t.test("runAgentDeliberation handles unknown inbound caller gracefully", async () => {
        const mockContext = createMockContext({
            tenant: {
                name: "Premier Solar",
                phoneNumber: "+15557778888",
            },
            contact: {
                contactId: null,
                isKnownContact: false,
                profile: null,
            },
        });

        const policy: AgentPolicy = {
            tenantId: "t-1",
            agentType: "lead_qualifier",
            isActive: true,
            autonomyMode: "auto_pilot",
            confidenceThreshold: 0.85,
        };

        const result = await runAgentDeliberation({
            agentType: "lead_qualifier",
            triggerEvent: "call.missed",
            context: mockContext,
            policy,
        });

        assert.ok(result.generatedResponse.includes("Premier Solar"));
        assert.ok(result.generatedResponse.includes("how can we help you today?"));
        assert.ok(result.confidence >= 0.85);
        assert.equal(result.recommendedActions[0].action, "send_sms");
    });

    // ─────────────────────────────────────────────────────────────
    // 5. Speed-to-Lead: New Contact Form Submission
    // ─────────────────────────────────────────────────────────────
    await t.test("runAgentDeliberation acknowledges new web form submission", async () => {
        const mockContext = createMockContext({
            tenant: {
                name: "Apex Auto Glass",
                phoneNumber: "+15553334444",
            },
            contact: {
                contactId: "c-30",
                isKnownContact: true,
                profile: {
                    id: "c-30",
                    tenantId: "t-1",
                    firstName: "Liam",
                    fullName: "Liam Neeson",
                    phone: "+15552221111",
                    tags: ["web-lead"],
                    createdAt: "2026-01-01T00:00:00Z",
                    updatedAt: "2026-01-01T00:00:00Z",
                },
                formSubmissions: [
                    {
                        id: "form-1",
                        formName: "Windshield Replacement Quote",
                        data: { make: "Toyota", model: "Tacoma" },
                        submittedAt: new Date().toISOString(),
                    },
                ],
            },
        });

        const policy: AgentPolicy = {
            tenantId: "t-1",
            agentType: "lead_qualifier",
            isActive: true,
            autonomyMode: "auto_pilot",
            confidenceThreshold: 0.85,
        };

        const result = await runAgentDeliberation({
            agentType: "lead_qualifier",
            triggerEvent: "contact.created",
            context: mockContext,
            policy,
        });

        assert.ok(result.generatedResponse.includes("Liam"));
        assert.ok(result.generatedResponse.includes("Apex Auto Glass"));
        assert.ok(result.generatedResponse.includes("quick 5-min call") || result.generatedResponse.includes("questions"));
        assert.ok(result.confidence >= 0.90);
    });

    // ─────────────────────────────────────────────────────────────
    // 6. Confidence Threshold Safety Gate
    // ─────────────────────────────────────────────────────────────
    await t.test("High threshold forces save_draft even when auto_pilot is enabled", async () => {
        const mockContext = createMockContext({
            tenant: {
                name: "Test Co",
            },
            contact: {
                contactId: null,
                isKnownContact: false,
                profile: null,
            },
        });

        // Ultra-high threshold (0.99) that the deliberation will not satisfy
        const strictPolicy: AgentPolicy = {
            tenantId: "t-1",
            agentType: "lead_qualifier",
            isActive: true,
            autonomyMode: "auto_pilot",
            confidenceThreshold: 0.99,
        };

        const result = await runAgentDeliberation({
            agentType: "lead_qualifier",
            triggerEvent: "unknown.event",
            context: mockContext,
            policy: strictPolicy,
        });

        assert.equal(result.recommendedActions[0].action, "save_draft", "Must downgrade to save_draft when below threshold");
    });

    // ─────────────────────────────────────────────────────────────
    // 7. extractJsonFromResponse Resilience Tests
    // ─────────────────────────────────────────────────────────────
    await t.test("extractJsonFromResponse parses direct JSON strings", () => {
        const input = '{"response": "Hello world", "confidence": 0.95}';
        const parsed = extractJsonFromResponse<{ response: string; confidence: number }>(input);
        assert.ok(parsed);
        assert.equal(parsed.response, "Hello world");
        assert.equal(parsed.confidence, 0.95);
    });

    await t.test("extractJsonFromResponse extracts JSON from markdown code fence", () => {
        const input = '```json\n{"response": "Extracted from markdown", "confidence": 0.92}\n```';
        const parsed = extractJsonFromResponse<{ response: string; confidence: number }>(input);
        assert.ok(parsed);
        assert.equal(parsed.response, "Extracted from markdown");
        assert.equal(parsed.confidence, 0.92);
    });

    await t.test("extractJsonFromResponse extracts JSON from surrounding conversational text", () => {
        const input = 'Here is the planned deliberation:\n{"response": "Text with preamble", "confidence": 0.89}\nHope this helps!';
        const parsed = extractJsonFromResponse<{ response: string; confidence: number }>(input);
        assert.ok(parsed);
        assert.equal(parsed.response, "Text with preamble");
        assert.equal(parsed.confidence, 0.89);
    });

    await t.test("extractJsonFromResponse returns null on invalid JSON", () => {
        const input = "This is just raw text without any JSON at all.";
        const parsed = extractJsonFromResponse(input);
        assert.equal(parsed, null);
    });

    // ─────────────────────────────────────────────────────────────
    // 8. OpenRouter Deliberation with DeepSeek V4 Model
    // ─────────────────────────────────────────────────────────────
    await t.test("runAgentDeliberation routes through OpenRouter with DeepSeek V4 when configured", async () => {
        const originalFetch = globalThis.fetch;
        const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
        const originalOpenRouterModel = process.env.OPENROUTER_MODEL;

        let capturedUrl = "";
        let capturedHeaders: Record<string, string> = {};
        let capturedBody: any = null;

        try {
            process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key";
            delete process.env.OPENROUTER_MODEL; // Should default to deepseek/deepseek-v4

            globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
                capturedUrl = url.toString();
                capturedHeaders = (init?.headers as Record<string, string>) || {};
                capturedBody = init?.body ? JSON.parse(init.body.toString()) : null;

                return new Response(
                    JSON.stringify({
                        choices: [
                            {
                                message: {
                                    content: JSON.stringify({
                                        reasoning: [{ step: "test", thought: "DeepSeek V4 deliberated" }],
                                        response: "Hello from DeepSeek V4 via OpenRouter!",
                                        confidence: 0.94,
                                    }),
                                },
                            },
                        ],
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            }) as typeof fetch;

            const mockContext = createMockContext({
                tenant: { name: "Apex Pro Services" },
            });

            const policy: AgentPolicy = {
                tenantId: "t-1",
                agentType: "lead_qualifier",
                isActive: true,
                autonomyMode: "auto_pilot",
                confidenceThreshold: 0.85,
            };

            const result = await runAgentDeliberation({
                agentType: "lead_qualifier",
                triggerEvent: "call.missed",
                context: mockContext,
                policy,
            });

            // Verify OpenRouter endpoint and headers
            assert.equal(capturedUrl, "https://openrouter.ai/api/v1/chat/completions");
            assert.equal(capturedHeaders["Authorization"], "Bearer sk-or-v1-test-key");
            assert.equal(capturedHeaders["X-Title"], "HighReach Super Agents");

            // Verify default DeepSeek V4 model and cost guardrail
            assert.equal(capturedBody?.model, "deepseek/deepseek-v4");
            assert.equal(capturedBody?.max_tokens, 500, "Must cap max_tokens to prevent runaway token spend");
            assert.equal(result.modelUsed, "openrouter/deepseek/deepseek-v4");
            assert.equal(result.generatedResponse, "Hello from DeepSeek V4 via OpenRouter!");
            assert.equal(result.confidence, 0.94);
            assert.equal(result.recommendedActions[0].action, "send_sms");
        } finally {
            globalThis.fetch = originalFetch;
            if (originalOpenRouterKey !== undefined) {
                process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
            } else {
                delete process.env.OPENROUTER_API_KEY;
            }
            if (originalOpenRouterModel !== undefined) {
                process.env.OPENROUTER_MODEL = originalOpenRouterModel;
            } else {
                delete process.env.OPENROUTER_MODEL;
            }
        }
    });

    await t.test("runAgentDeliberation respects custom OPENROUTER_MODEL override", async () => {
        const originalFetch = globalThis.fetch;
        const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
        const originalOpenRouterModel = process.env.OPENROUTER_MODEL;

        let capturedBody: any = null;

        try {
            process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key";
            process.env.OPENROUTER_MODEL = "deepseek/deepseek-v4:flash";

            globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
                capturedBody = init?.body ? JSON.parse(init.body.toString()) : null;

                return new Response(
                    JSON.stringify({
                        choices: [
                            {
                                message: {
                                    content: JSON.stringify({
                                        reasoning: [{ step: "test", thought: "DeepSeek V4 Flash deliberated" }],
                                        response: "Hello from DeepSeek V4 Flash!",
                                        confidence: 0.96,
                                    }),
                                },
                            },
                        ],
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            }) as typeof fetch;

            const mockContext = createMockContext({
                tenant: { name: "Apex Pro Services" },
            });

            const policy: AgentPolicy = {
                tenantId: "t-1",
                agentType: "lead_qualifier",
                isActive: true,
                autonomyMode: "draft_only",
                confidenceThreshold: 0.85,
            };

            const result = await runAgentDeliberation({
                agentType: "lead_qualifier",
                triggerEvent: "call.missed",
                context: mockContext,
                policy,
            });

            assert.equal(capturedBody?.model, "deepseek/deepseek-v4:flash");
            assert.equal(result.modelUsed, "openrouter/deepseek/deepseek-v4:flash");
            assert.equal(result.generatedResponse, "Hello from DeepSeek V4 Flash!");
            assert.equal(result.recommendedActions[0].action, "save_draft");
        } finally {
            globalThis.fetch = originalFetch;
            if (originalOpenRouterKey !== undefined) {
                process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
            } else {
                delete process.env.OPENROUTER_API_KEY;
            }
            if (originalOpenRouterModel !== undefined) {
                process.env.OPENROUTER_MODEL = originalOpenRouterModel;
            } else {
                delete process.env.OPENROUTER_MODEL;
            }
        }
    });
});
