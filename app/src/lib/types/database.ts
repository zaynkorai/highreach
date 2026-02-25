// Database Types for GHL Lite
// These should be generated from Supabase, but we define them manually for now

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
    | 'billing.read' | 'billing.write';

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
