export interface Contact {
    id: string;
    tenant_id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    source: string | null;
    tags: string[];
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export type CreateContactDTO = Pick<
    Contact,
    "first_name" | "last_name" | "email" | "phone" | "source" | "tags"
>;


export type UpdateContactDTO = Partial<CreateContactDTO>;

export interface ContactActivity {
    id: string;
    contact_id: string;
    tenant_id: string;
    type: 'note' | 'call_log' | 'sms' | 'email' | 'system';
    content: string | null;
    metadata: Record<string, any>;
    created_at: string;
    created_by: string;
}

export interface ContactView {
    id: string;
    tenant_id: string;
    name: string;
    filters: {
        source?: string;
        tags?: string[];
        searchQuery?: string;
        sort?: { key: string; direction: "asc" | "desc" };
    };
    created_at: string;
}
