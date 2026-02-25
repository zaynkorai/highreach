import { Contact } from "./contact";

export type OpportunityStatus = 'open' | 'won' | 'lost';

export interface Pipeline {
    id: string;
    tenant_id: string;
    name: string;
    created_at: string;
    created_by: string;
}

export interface PipelineStage {
    id: string;
    pipeline_id: string;
    tenant_id: string;
    name: string;
    order_index: number;
    created_at: string;
}

export interface Opportunity {
    id: string;
    contact_id: string;
    pipeline_stage_id: string;
    tenant_id: string;
    title: string;
    value: number;
    status: OpportunityStatus;
    order_index: number;
    created_at: string;
    created_by: string;
    // Joined data
    contact?: Contact;
}

export interface PipelineWithStages extends Pipeline {
    stages: PipelineStage[];
}
