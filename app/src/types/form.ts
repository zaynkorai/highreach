export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio' | 'date';

export type LogicOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';

export interface LogicCondition {
    fieldId: string;
    operator: LogicOperator;
    value: string;
}

export interface LogicRule {
    id: string;
    action: 'show' | 'hide';
    conditions: LogicCondition[];
}

export interface FormField {
    id: string;
    type: FormFieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    helperText?: string;
    options?: { label: string; value: string }[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
    hidden?: boolean;
    logic?: LogicRule[];
    width?: "50%" | "100%";
}

export interface FormTheme {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
    fontFamily?: 'sans' | 'serif' | 'mono' | 'modern';
}

export interface Form {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    fields: FormField[];
    theme?: FormTheme;
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
