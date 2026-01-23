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
    "first_name" | "last_name" | "email" | "phone"
>;

export type UpdateContactDTO = Partial<CreateContactDTO>;
