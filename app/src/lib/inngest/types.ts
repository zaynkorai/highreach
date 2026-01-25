
import { EventSchemas } from "inngest";

type ContactCreated = {
    data: {
        contact_id: string;
        tenant_id: string;
        source?: string;
    };
};

type FormSubmitted = {
    data: {
        form_id: string;
        submission_id: string;
        tenant_id: string;
    };
};

type OpportunityStageChanged = {
    data: {
        opportunity_id: string;
        tenant_id: string;
        stage_id: string;
        previous_stage_id?: string;
        status: "open" | "won" | "lost" | "abandoned";
    };
};

type CallMissed = {
    data: {
        call_control_id: string;
        from_number: string;
        to_number: string;
        tenant_id: string;
        direction: string;
    }
}

type AppointmentBooked = {
    data: {
        appointment_id: string;
        tenant_id: string;
        contact_id: string;
        calendar_id: string;
        start_time: string;
    }
}

type WorkflowExecute = {
    data: {
        workflow_id: string;
        tenant_id: string;
        original_event: any;
        trigger_data: any;
    }
}

export const schemas = new EventSchemas().fromRecord<{
    "contact.created": ContactCreated;
    "form.submitted": FormSubmitted;
    "opportunity.stage_changed": OpportunityStageChanged;
    "call.missed": CallMissed;
    "appointment.booked": AppointmentBooked;
    "workflow.execute": WorkflowExecute;
    "test/hello.world": { data: any };
}>();
