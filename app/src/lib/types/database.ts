// Database Types for GHL Lite
// These should be generated from Supabase, but we define them manually for now

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    phone_number?: string;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    tenant_id: string;
    email: string;
    full_name?: string;
    role: "owner" | "admin" | "member";
    created_at: string;
    updated_at: string;
}

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
