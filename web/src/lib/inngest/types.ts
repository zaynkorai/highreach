
import { EventSchemas } from "inngest";

type ContactCreated = {
    data: {
        contact_id: string;
        tenant_id: string;
        source?: string;
        [key: string]: any;
    };
};

type FormSubmitted = {
    data: {
        form_id: string;
        submission_id: string;
        tenant_id: string;
        contact_id?: string;
        email?: string;
        phone?: string;
        contact?: any;
        fields?: Record<string, any>;
        [key: string]: any;
    };
};

type OpportunityCreated = {
    data: {
        opportunity_id: string;
        tenant_id: string;
        contact_id?: string;
        stage_id?: string;
        title?: string;
        value?: number;
        status?: string;
        [key: string]: any;
    };
};

type OpportunityStageChanged = {
    data: {
        opportunity_id: string;
        tenant_id: string;
        stage_id?: string;
        previous_stage_id?: string;
        status?: "open" | "won" | "lost" | "abandoned" | string;
        [key: string]: any;
    };
};

type OpportunityStatusChanged = {
    data: {
        opportunity_id: string;
        tenant_id: string;
        status: string;
        previous_status?: string;
        [key: string]: any;
    };
};

type ContactTagAdded = {
    data: {
        contact_id: string;
        tenant_id: string;
        tag: string;
        [key: string]: any;
    };
};

type ContactTagRemoved = {
    data: {
        contact_id: string;
        tenant_id: string;
        tag: string;
        [key: string]: any;
    };
};

type CallMissed = {
    data: {
        call_control_id?: string;
        from_number: string;
        to_number?: string;
        tenant_id: string;
        direction?: string;
        contact_id?: string;
        [key: string]: any;
    };
};

type AppointmentBooked = {
    data: {
        appointment_id: string;
        tenant_id: string;
        contact_id?: string;
        calendar_id?: string;
        start_time?: string;
        rescheduled?: boolean;
        [key: string]: any;
    };
};

type WorkflowExecute = {
    data: {
        workflow_id: string;
        tenant_id: string;
        original_event: any;
        trigger_data: any;
    };
};

type SocialPostScheduled = {
    data: {
        post_id: string;
        tenant_id: string;
        scheduled_at: string;
    };
};

export const schemas = new EventSchemas().fromRecord<{
    "contact.created": ContactCreated;
    "contact.tag_added": ContactTagAdded;
    "contact.tag_removed": ContactTagRemoved;
    "form.submitted": FormSubmitted;
    "opportunity.created": OpportunityCreated;
    "opportunity.stage_changed": OpportunityStageChanged;
    "opportunity.status_changed": OpportunityStatusChanged;
    "call.missed": CallMissed;
    "appointment.booked": AppointmentBooked;
    "workflow.execute": WorkflowExecute;
    "test/hello.world": { data: any };
    "social/post.scheduled": SocialPostScheduled;
}>();

export type WorkflowNode = {
    id: string;
    type: string;
    data: Record<string, any>;
    filter?: Record<string, any>;
    position?: { x: number; y: number };
};

export type WorkflowEdge = {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    label?: string;
    type?: string;
};
