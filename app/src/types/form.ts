export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'checkbox';

export interface FormField {
    id: string;
    type: FormFieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For select type
}

export interface Form {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    fields: FormField[];
    redirect_url?: string;
    status: 'draft' | 'active' | 'archived';
    views: number; // We might want to track this, but for now we'll just query it or keep it 0
    created_at: string;
    updated_at: string;
}

export interface FormWithStats extends Form {
    submissions_count: number;
}

export interface FormSubmission {
    id: string;
    tenant_id: string;
    form_id: string;
    contact_id?: string;
    data: Record<string, any>;
    submitted_at: string;
}
