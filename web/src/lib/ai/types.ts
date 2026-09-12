import type { ChannelType } from "../../types/inbox.ts";

export interface KnowledgeItem {
    id: string;
    sourceId: string;
    title: string;
    sourceType: "faq" | "document" | "url" | "service_catalog" | string;
    content: string;
    similarityScore?: number;
    metadata?: Record<string, unknown>;
}

export interface BusinessHoursItem {
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    dayName: string;
    open: string;
    close: string;
}

export interface TenantKnowledgeContext {
    tenantId: string;
    name: string;
    slug: string;
    phoneNumber?: string | null;
    industry?: string | null;
    timezone: string;
    businessHours: BusinessHoursItem[];
    knowledgeChunks: KnowledgeItem[];
    rawSummary?: string;
}

export interface OpportunityItem {
    id: string;
    title: string;
    pipelineName?: string;
    stageName: string;
    orderIndex: number;
    value: number;
    status: "open" | "won" | "lost";
    createdAt: string;
}

export interface AppointmentItem {
    id: string;
    calendarName?: string;
    startTime: string;
    endTime: string;
    status: "confirmed" | "cancelled" | "rescheduled" | "no_show" | "completed" | string;
    location?: string | null;
    notes?: string | null;
}

export interface ActivityItem {
    id: string;
    type: "note" | "call_log" | "sms" | "email" | "system" | string;
    content: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
    createdByName?: string | null;
}

export interface FormSubmissionItem {
    id: string;
    formName: string;
    data: Record<string, unknown>;
    submittedAt: string;
}

export interface ContactProfile {
    id: string;
    tenantId: string;
    firstName: string;
    lastName?: string | null;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    tags: string[];
    source?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ContactHistoryContext {
    contactId?: string | null;
    isKnownContact: boolean;
    profile?: ContactProfile | null;
    opportunities: OpportunityItem[];
    appointments: AppointmentItem[];
    activities: ActivityItem[];
    formSubmissions: FormSubmissionItem[];
}

export type ChatRole = "user" | "assistant" | "system";

export interface ThreadMessage {
    id: string;
    conversationId: string;
    direction: "inbound" | "outbound";
    role: ChatRole;
    channel: ChannelType | string;
    content: string;
    sentAt: string;
    metadata?: Record<string, unknown>;
}

export interface ActiveThreadContext {
    conversationId?: string | null;
    channel: ChannelType | string;
    status: "open" | "closed" | string;
    lastMessageAt?: string | null;
    messages: ThreadMessage[];
    totalMessagesCount: number;
    hasInboundReplyPending: boolean;
}

export interface FormattedPromptContext {
    systemPromptSnippet: string;
    formattedMessages: Array<{ role: ChatRole; content: string }>;
    estimatedTokenCount: number;
}

export interface AssembledAgentContext {
    assembledAt: string;
    tenantId: string;
    contactId?: string | null;
    conversationId?: string | null;
    tenant: TenantKnowledgeContext;
    contact: ContactHistoryContext;
    thread: ActiveThreadContext;
    prompt: FormattedPromptContext;
    metadata: {
        queryText?: string;
        retrievedChunksCount: number;
        executionTimeMs: number;
        truncatedMessagesCount: number;
    };
}

export interface AssembleContextOptions {
    tenantId: string;
    contactId?: string | null;
    conversationId?: string | null;
    queryText?: string;
    queryEmbedding?: number[];
    maxKnowledgeChunks?: number;
    minSimilarityScore?: number;
    maxThreadMessages?: number;
    maxActivities?: number;
    maxTokens?: number;
    includeOpportunities?: boolean;
    includeAppointments?: boolean;
    includeFormSubmissions?: boolean;
    includeActivities?: boolean;
}
