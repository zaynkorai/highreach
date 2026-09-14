// Standalone Social Studio Type Definitions

// =============================================================
// Social Studio Entities (Postiz Alternative)
// =============================================================

export type SocialPlatform =
    | 'twitter'
    | 'linkedin'
    | 'facebook'
    | 'instagram'
    | 'youtube'
    | 'tiktok'
    | 'threads'
    | 'pinterest'
    | 'twitch'
    | 'kick'
    | 'skool'
    | 'whop';

export type ShortLinkingPreference = 'always' | 'never' | 'ask';

export interface TenantSocialSettings {
    shortLinking: ShortLinkingPreference;
    defaultTimeSlots: string[]; // e.g. ["09:00", "13:00", "18:00", "21:00"]
    defaultTags: string[];
    streakReminderEmail: boolean;
}

export interface ClientConnectToken {
    token: string;
    tenantId: string;
    clientName: string;
    allowedPlatforms: SocialPlatform[];
    expiresAt: string;
    createdAt: string;
}

export type SocialPostStatus =
    | 'draft'
    | 'scheduled'
    | 'publishing'
    | 'published'
    | 'failed';

export interface SocialAccount {
    id: string;
    tenant_id: string;
    platform: SocialPlatform;
    account_name: string;
    account_handle?: string | null;
    avatar_url?: string | null;
    status: 'connected' | 'disconnected' | 'expired';
    external_account_id?: string | null;
    settings?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface SocialPostMetrics {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
    clicks?: number;
}

export interface CommentToLeadSettings {
    enabled: boolean;
    triggerKeyword: string; // e.g. "GROWTH", "AUDIT", "LINK"
    dmMessage: string;
    resourceUrl?: string;
    autoCreateContact?: boolean;
}

export interface EvergreenSettings {
    enabled: boolean;
    recycleIntervalDays: number; // e.g. 14, 30 days
    maxRecycles: number; // e.g. 3, 5, or 0 for unlimited
    recyclesCount?: number;
    aiVariation?: boolean;
}

export interface CarouselSlide {
    id: string;
    title: string;
    body: string;
}

export interface CarouselSettings {
    enabled: boolean;
    slides: CarouselSlide[];
    theme?: "dark" | "blue" | "crimson" | "emerald";
}

export interface SocialPostSettings {
    firstComment?: string;
    tags?: string[];
    thread?: string[];
    utm?: {
        url?: string;
        campaign?: string;
    };
    platformOverrides?: Partial<Record<SocialPlatform, { content?: string }>>;
    commentToLead?: CommentToLeadSettings;
    evergreen?: EvergreenSettings;
    carousel?: CarouselSettings;
}

export interface SocialPost {
    id: string;
    tenant_id: string;
    content: string;
    media_urls?: string[];
    platforms: SocialPlatform[];
    status: SocialPostStatus;
    scheduled_at?: string | null;
    published_at?: string | null;
    settings?: SocialPostSettings;
    error_message?: string | null;
    metrics?: SocialPostMetrics;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
    channels?: SocialPostChannel[];
}

export interface SocialPostChannel {
    id: string;
    tenant_id: string;
    post_id: string;
    account_id: string;
    platform: SocialPlatform;
    status: 'pending' | 'published' | 'failed';
    external_post_id?: string | null;
    external_post_url?: string | null;
    error_message?: string | null;
    published_at?: string | null;
    metrics?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// =============================================================
// AI Knowledge Base & Semantic Retrieval
