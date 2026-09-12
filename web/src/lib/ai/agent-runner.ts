import type { AssembledAgentContext } from "./types.ts";
import type { AgentPolicy, AgentType } from "./agent-policy.ts";
import { buildSystemPromptContext } from "./prompt-builder.ts";

export interface AgentReasoningStep {
    step: string;
    thought: string;
}

export interface AgentDeliberationOptions {
    agentType: AgentType | string;
    triggerEvent: "call.missed" | "contact.created" | "message.received" | string;
    context: AssembledAgentContext;
    policy: AgentPolicy;
    metadata?: Record<string, unknown>;
}

export interface AgentDeliberationResult {
    agentType: string;
    triggerEvent: string;
    reasoning: AgentReasoningStep[];
    generatedResponse: string;
    confidence: number;
    recommendedActions: Array<{
        action: "send_sms" | "save_draft" | "escalate_to_human" | "update_pipeline";
        params?: Record<string, unknown>;
    }>;
    modelUsed: string;
    latencyMs: number;
}

/**
 * Checks whether the tenant is currently within operating hours.
 */
function isWithinBusinessHours(context: AssembledAgentContext): boolean {
    const hours = context.tenant.businessHours;
    if (!hours || hours.length === 0) return true; // Default open if no schedule specified

    try {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
        const dayHours = hours.find((h) => h.dayOfWeek === currentDay);
        if (!dayHours || !dayHours.open || !dayHours.close) return false;

        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [openH, openM] = dayHours.open.split(":").map(Number);
        const [closeH, closeM] = dayHours.close.split(":").map(Number);

        const openMinutes = openH * 60 + (openM || 0);
        const closeMinutes = closeH * 60 + (closeM || 0);

        return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    } catch {
        return true;
    }
}

/**
 * Safely extracts and parses JSON payload from LLM responses, handling
 * potential markdown code blocks (```json ... ```) or conversational wrappers.
 */
export function extractJsonFromResponse<T = Record<string, unknown>>(content: string): T | null {
    if (!content) return null;
    const trimmed = content.trim();

    // 1. Direct JSON parse
    try {
        return JSON.parse(trimmed) as T;
    } catch {
        // Fall through to pattern matching
    }

    // 2. Markdown fence extraction (```json ... ``` or ``` ... ```)
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch?.[1]) {
        try {
            return JSON.parse(codeBlockMatch[1].trim()) as T;
        } catch {
            // Fall through
        }
    }

    // 3. Outermost curly brackets extraction
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
            return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T;
        } catch {
            // Extraction failed
        }
    }

    return null;
}

/**
 * Core deliberation engine for HighReach Super Agents.
 * Evaluates multi-pillar grounded context, deliberates reasonings,
 * and produces calibrated confidence scores and response drafts.
 */
export async function runAgentDeliberation(
    options: AgentDeliberationOptions
): Promise<AgentDeliberationResult> {
    const startTime = Date.now();
    const { agentType, triggerEvent, context, policy } = options;
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
    const openRouterModel = process.env.OPENROUTER_MODEL?.trim() || "deepseek/deepseek-v4";
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    // 1. Live LLM Generation via OpenRouter (Primary with DeepSeek)
    if (openRouterKey) {
        try {
            const systemPrompt = `You are an autonomous Super Agent representing "${context.tenant.name}".
Your role: ${agentType}.
Primary trigger: ${triggerEvent}.
Autonomy Mode: ${policy.autonomyMode}.

${policy.systemPromptOverride ? `TENANT PROMPT OVERRIDE:\n${policy.systemPromptOverride}\n` : ""}
GROUNDED OPERATIONAL CONTEXT:
${buildSystemPromptContext(context.tenant, context.contact, context.thread)}

INSTRUCTIONS:
1. Formulate a 2-3 step reasoning chain evaluating the customer's state, business hours, and past communications.
2. Draft an authentic, concise, high-converting SMS response (strictly under 160 characters when possible).
3. Assign a calibrated confidence score between 0.00 and 1.00.
4. Respond in valid JSON format matching this schema:
{
  "reasoning": [{"step": "context_evaluation", "thought": "..."}, {"step": "response_strategy", "thought": "..."}],
  "response": "...",
  "confidence": 0.95
}`;

            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${openRouterKey}`,
                    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://highreach.app",
                    "X-Title": "HighReach Super Agents",
                },
                body: JSON.stringify({
                    model: openRouterModel,
                    messages: [
                        { role: "system", content: systemPrompt },
                        {
                            role: "user",
                            content: `Deliberate the next action for ${triggerEvent}. Customer phone: ${context.contact.profile?.phone || "Unknown"}.`,
                        },
                    ],
                    temperature: 0.3,
                    max_tokens: 500,
                    response_format: { type: "json_object" },
                }),
            });

            if (res.ok) {
                const payload = (await res.json()) as {
                    choices?: Array<{ message?: { content?: string } }>;
                };
                const rawContent = payload.choices?.[0]?.message?.content;
                if (rawContent) {
                    const parsed = extractJsonFromResponse<{
                        reasoning?: Array<{ step: string; thought: string }>;
                        response?: string;
                        confidence?: number;
                    }>(rawContent);

                    if (parsed) {
                        const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.88;
                        const responseText = parsed.response?.trim() || "";
                        const reasoning = Array.isArray(parsed.reasoning) ? parsed.reasoning : [];

                        const actionType =
                            policy.autonomyMode === "auto_pilot" && confidence >= policy.confidenceThreshold
                                ? "send_sms"
                                : "save_draft";

                        return {
                            agentType,
                            triggerEvent,
                            reasoning,
                            generatedResponse: responseText,
                            confidence,
                            recommendedActions: [{ action: actionType, params: { text: responseText } }],
                            modelUsed: `openrouter/${openRouterModel}`,
                            latencyMs: Date.now() - startTime,
                        };
                    }
                }
            } else {
                console.warn(`[SuperAgent] OpenRouter returned status ${res.status}`);
            }
        } catch (openRouterErr) {
            console.warn("[SuperAgent] OpenRouter deliberation failed, trying fallback:", openRouterErr);
        }
    }

    // 2. Live LLM Generation via OpenAI fallback if configured
    if (apiKey && apiKey.startsWith("sk-")) {
        try {
            const systemPrompt = `You are an autonomous Super Agent representing "${context.tenant.name}".
Your role: ${agentType}.
Primary trigger: ${triggerEvent}.
Autonomy Mode: ${policy.autonomyMode}.

${policy.systemPromptOverride ? `TENANT PROMPT OVERRIDE:\n${policy.systemPromptOverride}\n` : ""}
GROUNDED OPERATIONAL CONTEXT:
${buildSystemPromptContext(context.tenant, context.contact, context.thread)}

INSTRUCTIONS:
1. Formulate a 2-3 step reasoning chain evaluating the customer's state, business hours, and past communications.
2. Draft an authentic, concise, high-converting SMS response (strictly under 160 characters when possible).
3. Assign a calibrated confidence score between 0.00 and 1.00.
4. Respond in valid JSON format matching this schema:
{
  "reasoning": [{"step": "context_evaluation", "thought": "..."}, {"step": "response_strategy", "thought": "..."}],
  "response": "...",
  "confidence": 0.95
}`;

            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        {
                            role: "user",
                            content: `Deliberate the next action for ${triggerEvent}. Customer phone: ${context.contact.profile?.phone || "Unknown"}.`,
                        },
                    ],
                    temperature: 0.3,
                    max_tokens: 500,
                    response_format: { type: "json_object" },
                }),
            });

            if (res.ok) {
                const payload = (await res.json()) as {
                    choices?: Array<{ message?: { content?: string } }>;
                };
                const rawContent = payload.choices?.[0]?.message?.content;
                if (rawContent) {
                    const parsed = extractJsonFromResponse<{
                        reasoning?: Array<{ step: string; thought: string }>;
                        response?: string;
                        confidence?: number;
                    }>(rawContent);

                    if (parsed) {
                        const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.88;
                        const responseText = parsed.response?.trim() || "";
                        const reasoning = Array.isArray(parsed.reasoning) ? parsed.reasoning : [];

                        const actionType =
                            policy.autonomyMode === "auto_pilot" && confidence >= policy.confidenceThreshold
                                ? "send_sms"
                                : "save_draft";

                        return {
                            agentType,
                            triggerEvent,
                            reasoning,
                            generatedResponse: responseText,
                            confidence,
                            recommendedActions: [{ action: actionType, params: { text: responseText } }],
                            modelUsed: "gpt-4o-mini",
                            latencyMs: Date.now() - startTime,
                        };
                    }
                }
            }
        } catch (llmErr) {
            console.warn("[SuperAgent] OpenAI deliberation failed, using deterministic fallback:", llmErr);
        }
    }

    // 2. Deterministic Grounded Reasoner (for offline, testing, or API fallbacks)
    const reasoning: AgentReasoningStep[] = [];
    const tenantName = context.tenant.name || "our team";
    const isKnown = context.contact.isKnownContact && context.contact.profile;
    const contactName = isKnown
        ? (context.contact.profile?.firstName || context.contact.profile?.fullName || "").trim()
        : "";
    const openInHours = isWithinBusinessHours(context);

    let generatedResponse = "";
    let confidence = 0.90;

    // Step 1: Context evaluation
    reasoning.push({
        step: "identity_and_crm_evaluation",
        thought: isKnown
            ? `Known contact "${contactName}" identified. CRM history available with ${context.contact.opportunities.length} deals and ${context.contact.appointments.length} appointments.`
            : "Unknown caller or new prospective lead. No previous CRM history found.",
    });

    // Step 2: Temporal evaluation
    reasoning.push({
        step: "temporal_evaluation",
        thought: openInHours
            ? "Event received during active operating hours. Quick follow-up expected."
            : `Event received outside operating hours (Timezone: ${context.tenant.timezone}). Acknowledge after-hours status.`,
    });

    // Step 3: Deliberate response based on trigger and specific grounding
    if (triggerEvent === "call.missed") {
        const nextAppointment = context.contact.appointments.find(
            (a) => a.status === "confirmed" || a.status === "scheduled"
        );
        const topOpportunity = context.contact.opportunities.find((o) => o.status === "open");

        if (nextAppointment && contactName) {
            reasoning.push({
                step: "crm_grounding",
                thought: `Customer has an upcoming appointment for "${nextAppointment.calendarName}". Reference this specifically to demonstrate awareness.`,
            });
            generatedResponse = `Hi ${contactName}, sorry we missed your call at ${tenantName}! Are you calling about your upcoming ${nextAppointment.calendarName}? Let us know how we can help!`;
            confidence = 0.96;
        } else if (topOpportunity && contactName) {
            reasoning.push({
                step: "crm_grounding",
                thought: `Customer has an active pipeline deal "${topOpportunity.title}". Acknowledge their proposal inquiry.`,
            });
            generatedResponse = `Hi ${contactName}, sorry we missed your call at ${tenantName}! We're ready to assist with your ${topOpportunity.title} proposal. How can we help?`;
            confidence = 0.93;
        } else if (openInHours) {
            reasoning.push({
                step: "response_generation",
                thought: "Active hours missed call. Send immediate 60-second speed-to-lead text back.",
            });
            generatedResponse = contactName
                ? `Hi ${contactName}, sorry we missed your call at ${tenantName}! Our team is currently on a job—how can we help you today?`
                : `Hi! Sorry we missed your call at ${tenantName}. Our team is currently assisting another customer—how can we help you today?`;
            confidence = 0.91;
        } else {
            reasoning.push({
                step: "response_generation",
                thought: "After-hours missed call. Inform caller and set expectations for first-thing morning callback.",
            });
            generatedResponse = contactName
                ? `Hi ${contactName}, thanks for calling ${tenantName}. We're closed for the day, but reply here and we'll prioritize you first thing tomorrow morning!`
                : `Hi! Thanks for calling ${tenantName}. We're closed right now, but reply here with details and we'll get back to you first thing tomorrow morning!`;
            confidence = 0.89;
        }
    } else if (triggerEvent === "contact.created" || triggerEvent === "form.submitted") {
        const recentForm = context.contact.formSubmissions[0];
        if (recentForm && contactName) {
            reasoning.push({
                step: "form_grounding",
                thought: `Lead submitted "${recentForm.formName}". Acknowledge web inquiry promptly.`,
            });
            generatedResponse = `Hi ${contactName}, thanks for submitting your inquiry to ${tenantName}! We received your details and are reviewing them now. When is a good time for a quick 5-min call?`;
            confidence = 0.94;
        } else if (contactName) {
            generatedResponse = `Hi ${contactName}, thanks for connecting with ${tenantName}! We're excited to assist you. How can our team help with your project?`;
            confidence = 0.92;
        } else {
            generatedResponse = `Hi! Thanks for reaching out to ${tenantName}. We received your inquiry and would love to help. What questions can we answer for you?`;
            confidence = 0.88;
        }
    } else {
        // General fallback
        generatedResponse = `Hi! Thanks for contacting ${tenantName}. How can we help you today?`;
        confidence = 0.85;
    }

    const actionType =
        policy.autonomyMode === "auto_pilot" && confidence >= policy.confidenceThreshold
            ? "send_sms"
            : "save_draft";

    return {
        agentType,
        triggerEvent,
        reasoning,
        generatedResponse,
        confidence,
        recommendedActions: [{ action: actionType, params: { text: generatedResponse } }],
        modelUsed: "deterministic-grounded-reasoner",
        latencyMs: Date.now() - startTime,
    };
}
