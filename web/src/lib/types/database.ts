// Database Types for HighReach


// =============================================================
// RBAC Types
// =============================================================

export type AppRole = 'owner' | 'admin' | 'member';

export type AppPermission =
    // Contacts
    | 'contacts.read' | 'contacts.write' | 'contacts.delete'
    // Conversations / Inbox
    | 'conversations.read' | 'conversations.write'
    // Forms
    | 'forms.read' | 'forms.write' | 'forms.delete'
    // Pipelines
    | 'pipelines.read' | 'pipelines.write' | 'pipelines.delete'
    // Calendars
    | 'calendars.read' | 'calendars.write'
    // Reputation / Reviews
    | 'reputation.read' | 'reputation.write'
    // Automations / Workflows
    | 'automations.read' | 'automations.write' | 'automations.delete'
    // Settings
    | 'settings.read' | 'settings.write'
    // Team Management
    | 'team.read' | 'team.invite' | 'team.remove' | 'team.change_role'
    // Billing
    | 'billing.read' | 'billing.write'
    // Social Studio
    | 'social.read' | 'social.write' | 'social.delete';

// =============================================================
// Core Entities
// =============================================================

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    phone_number?: string;
    industry?: string;
    settings?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    tenant_id: string;
    email: string;
    full_name?: string;
    role: AppRole;
    onboarding_completed?: boolean;
    onboarding_step?: number;
    industry?: string;
    role_in_company?: string;
    created_at: string;
    updated_at: string;
}

export interface TenantMember {
    id: string;
    tenant_id: string;
    user_id: string;
    role: AppRole;
    invited_by?: string;
    invited_at?: string;
    accepted_at?: string;
    created_at: string;
    updated_at: string;
}

export interface TenantInvitation {
    id: string;
    tenant_id: string;
    email: string;
    role: AppRole;
    token: string;
    invited_by: string;
    expires_at: string;
    accepted_at?: string;
    created_at: string;
}

// =============================================================
// Business Entities
// =============================================================

export interface Contact {
    id: string;
    tenant_id: string;
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    tags: string[];
    source?: string;
    created_at: string;
    updated_at: string;
}

export interface Conversation {
    id: string;
    tenant_id: string;
    contact_id: string;
    channel: "sms" | "email" | "facebook" | "instagram";
    status: "open" | "closed";
    last_message_at: string;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    tenant_id: string;
    direction: "inbound" | "outbound";
    channel: "sms" | "email";
    content: string;
    sent_at: string;
    created_at: string;
}

export interface Form {
    id: string;
    tenant_id: string;
    name: string;
    fields: FormField[];
    redirect_url?: string;
    created_at: string;
    updated_at: string;
}

export interface FormField {
    id: string;
    type: "text" | "email" | "phone" | "textarea" | "select";
    label: string;
    required: boolean;
    options?: string[];
}

export interface FormSubmission {
    id: string;
    form_id: string;
    tenant_id: string;
    contact_id?: string;
    data: Record<string, string>;
    submitted_at: string;
}

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
    | 'kick';

export type ShortLinkingPreference = 'always' | 'never' | 'ask';

export interface TenantSocialSettings {
    shortLinking: ShortLinkingPreference;
    defaultTimeSlots: string[]; // e.g. ["09:00", "13:00", "18:00", "21:00"]
    defaultTags: string[];
    streakReminderEmail: boolean;
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

export interface SocialPostSettings {
    firstComment?: string;
    tags?: string[];
    thread?: string[];
    utm?: {
        url?: string;
        campaign?: string;
    };
    platformOverrides?: Partial<Record<SocialPlatform, { content?: string }>>;
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
