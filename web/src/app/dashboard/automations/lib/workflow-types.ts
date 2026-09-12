// ============ TRIGGER TYPES ============

export const TRIGGER_CATEGORIES = [
    { id: "contacts", label: "Contacts" },
    { id: "forms", label: "Forms & Surveys" },
    { id: "appointments", label: "Appointments" },
    { id: "opportunities", label: "Opportunities" },
    { id: "payments", label: "Payments" },
    { id: "communication", label: "Communication" },
] as const;

export const TRIGGERS = [
    // Contacts
    { id: "contact.created", label: "Contact Created", category: "contacts", icon: "UserPlus", description: "When a new contact is added" },
    { id: "contact.tag_added", label: "Tag Added", category: "contacts", icon: "Tag", description: "When a tag is added to a contact" },
    { id: "contact.tag_removed", label: "Tag Removed", category: "contacts", icon: "TagX", description: "When a tag is removed from a contact" },
    { id: "contact.birthday", label: "Contact Birthday", category: "contacts", icon: "Cake", description: "On the contact's birthday" },
    { id: "contact.dnd_changed", label: "DND Status Changed", category: "contacts", icon: "BellOff", description: "When Do Not Disturb status changes" },

    // Forms
    { id: "form.submitted", label: "Form Submitted", category: "forms", icon: "FileText", description: "When a form is submitted" },
    { id: "survey.submitted", label: "Survey Submitted", category: "forms", icon: "ClipboardList", description: "When a survey is completed" },

    // Appointments
    { id: "appointment.booked", label: "Customer Booked Appointment", category: "appointments", icon: "CalendarCheck", description: "When a customer books" },
    { id: "appointment.cancelled", label: "Appointment Cancelled", category: "appointments", icon: "CalendarX", description: "When an appointment is cancelled" },
    { id: "appointment.rescheduled", label: "Appointment Rescheduled", category: "appointments", icon: "CalendarClock", description: "When an appointment is rescheduled" },
    { id: "appointment.status_changed", label: "Appointment Status Changed", category: "appointments", icon: "Calendar", description: "When appointment status updates" },
    { id: "appointment.no_show", label: "Appointment No-Show", category: "appointments", icon: "UserX", description: "When customer doesn't show up" },

    // Opportunities
    { id: "opportunity.created", label: "Opportunity Created", category: "opportunities", icon: "Target", description: "When a new opportunity is created" },
    { id: "opportunity.stage_changed", label: "Pipeline Stage Changed", category: "opportunities", icon: "GitBranch", description: "When opportunity moves stages" },
    { id: "opportunity.status_changed", label: "Opportunity Status Changed", category: "opportunities", icon: "Flag", description: "When opportunity status changes (won/lost)" },
    { id: "opportunity.stale", label: "Stale Opportunity", category: "opportunities", icon: "Clock", description: "When opportunity hasn't moved" },

    // Payments
    { id: "payment.received", label: "Payment Received", category: "payments", icon: "CreditCard", description: "When payment is received" },
    { id: "invoice.sent", label: "Invoice Sent", category: "payments", icon: "Receipt", description: "When an invoice is sent" },
    { id: "invoice.overdue", label: "Invoice Overdue", category: "payments", icon: "AlertCircle", description: "When invoice becomes overdue" },

    // Communication
    { id: "call.missed", label: "Missed Call", category: "communication", icon: "PhoneMissed", description: "When a call is missed" },
    { id: "call.completed", label: "Call Completed", category: "communication", icon: "PhoneCall", description: "When a call is completed" },
    { id: "sms.received", label: "SMS Received", category: "communication", icon: "MessageSquare", description: "When an SMS is received" },
    { id: "email.opened", label: "Email Opened", category: "communication", icon: "MailOpen", description: "When email is opened" },
    { id: "email.clicked", label: "Email Link Clicked", category: "communication", icon: "MousePointerClick", description: "When email link is clicked" },
] as const;

// ============ ACTION TYPES ============

export const ACTION_CATEGORIES = [
    { id: "communication", label: "Communication" },
    { id: "contact", label: "Contact Management" },
    { id: "opportunity", label: "Opportunities" },
    { id: "internal", label: "Internal Tools" },
    { id: "logic", label: "Logic & Flow" },
] as const;

export const ACTIONS = [
    // Communication
    { id: "send_sms", label: "Send SMS", category: "communication", icon: "MessageSquare", description: "Send an SMS message", hasTemplate: true },
    { id: "send_email", label: "Send Email", category: "communication", icon: "Mail", description: "Send an email", hasTemplate: true },
    { id: "send_voicemail", label: "Send Voicemail Drop", category: "communication", icon: "Voicemail", description: "Leave a voicemail", hasTemplate: true },
    { id: "make_call", label: "Initiate Call", category: "communication", icon: "Phone", description: "Start an outbound call" },
    { id: "send_slack", label: "Send Slack Message", category: "communication", icon: "Hash", description: "Post to Slack channel", hasTemplate: true },

    // Contact Management
    { id: "add_tag", label: "Add Tag", category: "contact", icon: "Tag", description: "Add a tag to contact" },
    { id: "remove_tag", label: "Remove Tag", category: "contact", icon: "TagX", description: "Remove a tag from contact" },
    { id: "update_contact", label: "Update Contact Field", category: "contact", icon: "UserCog", description: "Update a contact field" },
    { id: "add_to_workflow", label: "Add to Another Workflow", category: "contact", icon: "GitFork", description: "Enroll in another workflow" },
    { id: "remove_from_workflow", label: "Remove from Workflow", category: "contact", icon: "LogOut", description: "Remove from a workflow" },
    { id: "create_task", label: "Create Task", category: "contact", icon: "CheckSquare", description: "Create a task for follow-up" },

    // Opportunities
    { id: "create_opportunity", label: "Create Opportunity", category: "opportunity", icon: "Target", description: "Create a new opportunity" },
    { id: "update_opportunity", label: "Update Opportunity", category: "opportunity", icon: "Edit", description: "Update opportunity details" },
    { id: "move_pipeline_stage", label: "Move Pipeline Stage", category: "opportunity", icon: "ArrowRight", description: "Move to a different stage" },

    // Internal Tools
    { id: "internal_notification", label: "Send Internal Notification", category: "internal", icon: "Bell", description: "Notify team member" },
    { id: "webhook", label: "Send Webhook", category: "internal", icon: "Webhook", description: "Send data to external URL" },
    { id: "assign_user", label: "Assign to User", category: "internal", icon: "UserCheck", description: "Assign contact to team member" },

    // Logic & Flow (these are special)
    { id: "wait", label: "Wait", category: "logic", icon: "Clock", description: "Add a delay before next step", isWait: true },
    { id: "if_else", label: "If/Else Condition", category: "logic", icon: "GitBranch", description: "Branch based on conditions", isBranch: true },
    { id: "go_to", label: "Go To Step", category: "logic", icon: "CornerDownRight", description: "Jump to another step" },
    { id: "end", label: "End Workflow", category: "logic", icon: "Flag", description: "End this workflow path" },
] as const;

// ============ WAIT STEP TYPES ============

export const WAIT_TYPES = [
    { id: "time_delay", label: "Time Delay", description: "Wait for a specific duration" },
    { id: "event_time", label: "Event/Appointment Time", description: "Wait until before/after an event" },
    { id: "condition", label: "Wait for Condition", description: "Wait until a condition is met" },
    { id: "contact_reply", label: "Contact Reply", description: "Wait for contact to respond" },
    { id: "trigger_link", label: "Trigger Link Clicked", description: "Wait for a link to be clicked" },
    { id: "email_event", label: "Email Event", description: "Wait for email open/click/bounce" },
] as const;

export const TIME_UNITS = [
    { id: "seconds", label: "Seconds" },
    { id: "minutes", label: "Minutes" },
    { id: "hours", label: "Hours" },
    { id: "days", label: "Days" },
    { id: "weeks", label: "Weeks" },
] as const;

// ============ CONDITION OPERATORS ============

export const CONDITION_OPERATORS = [
    { id: "equals", label: "Is" },
    { id: "not_equals", label: "Is Not" },
    { id: "contains", label: "Contains" },
    { id: "not_contains", label: "Does Not Contain" },
    { id: "starts_with", label: "Starts With" },
    { id: "ends_with", label: "Ends With" },
    { id: "is_empty", label: "Is Empty" },
    { id: "is_not_empty", label: "Is Not Empty" },
    { id: "greater_than", label: "Greater Than" },
    { id: "less_than", label: "Less Than" },
] as const;

export const CONDITION_FIELDS = [
    { id: "contact.email", label: "Contact Email" },
    { id: "contact.phone", label: "Contact Phone" },
    { id: "contact.tags", label: "Contact Tags" },
    { id: "contact.source", label: "Contact Source" },
    { id: "trigger_link.clicked", label: "Trigger Link Clicked" },
    { id: "response.type", label: "Response Type (Positive/Negative)" },
    { id: "appointment.status", label: "Appointment Status" },
    { id: "opportunity.status", label: "Opportunity Status" },
    { id: "opportunity.value", label: "Opportunity Value" },
] as const;

// ============ WORKFLOW RECIPES ============

export const WORKFLOW_RECIPES = [
    {
        id: "missed_call_textback",
        name: "Missed Call Text-Back",
        description: "Automatically text customers when you miss their call",
        category: "communication",
        icon: "PhoneMissed",
        nodes: [
            { id: "1", type: "trigger", position: { x: 300, y: 0 }, data: { triggerId: "call.missed", label: "Missed Call" } },
            { id: "2", type: "wait", position: { x: 300, y: 120 }, data: { waitType: "time_delay", duration: 30, unit: "seconds", label: "Wait 30 seconds" } },
            { id: "3", type: "action", position: { x: 300, y: 240 }, data: { actionId: "send_sms", label: "Send SMS", template: "Hey! Sorry I missed your call. How can I help you?" } },
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", type: "smart" },
            { id: "e2-3", source: "2", target: "3", type: "smart" },
        ]
    },
    {
        id: "new_lead_nurture",
        name: "New Lead Nurturing Sequence",
        description: "Welcome new leads with email and SMS follow-up",
        category: "marketing",
        icon: "UserPlus",
        nodes: [
            { id: "1", type: "trigger", position: { x: 300, y: 0 }, data: { triggerId: "contact.created", label: "Contact Created" } },
            { id: "2", type: "action", position: { x: 300, y: 120 }, data: { actionId: "send_email", label: "Send Welcome Email", subject: "Welcome to HighReach", template: "Welcome {{contact.name}}! Thanks for getting in touch. We're excited to partner with you." } },
            { id: "3", type: "wait", position: { x: 300, y: 240 }, data: { waitType: "time_delay", duration: 1, unit: "days", label: "Wait 1 day" } },
            { id: "4", type: "action", position: { x: 300, y: 360 }, data: { actionId: "send_sms", label: "Send SMS Follow-up", template: "Hi {{contact.name}}! Just checking in to see if you have any questions." } },
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", type: "smart" },
            { id: "e2-3", source: "2", target: "3", type: "smart" },
            { id: "e3-4", source: "3", target: "4", type: "smart" },
        ]
    },
    {
        id: "appointment_reminder",
        name: "Appointment Reminder Sequence",
        description: "Send reminders before scheduled appointments",
        category: "appointments",
        icon: "CalendarCheck",
        nodes: [
            { id: "1", type: "trigger", position: { x: 300, y: 0 }, data: { triggerId: "appointment.booked", label: "Appointment Booked" } },
            { id: "2", type: "wait", position: { x: 300, y: 120 }, data: { waitType: "time_delay", duration: 2, unit: "hours", label: "Wait 2 hours" } },
            { id: "3", type: "action", position: { x: 300, y: 240 }, data: { actionId: "send_sms", label: "Send Confirmation", template: "Your appointment is confirmed! We look forward to seeing you." } },
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", type: "smart" },
            { id: "e2-3", source: "2", target: "3", type: "smart" },
        ]
    },
    {
        id: "form_submission_followup",
        name: "Form Submission Follow-up",
        description: "Automatically respond to form submissions",
        category: "forms",
        icon: "FileText",
        nodes: [
            { id: "1", type: "trigger", position: { x: 300, y: 0 }, data: { triggerId: "form.submitted", label: "Form Submitted" } },
            { id: "2", type: "action", position: { x: 300, y: 120 }, data: { actionId: "send_email", label: "Send Thank You", subject: "Thank you for your submission", template: "Thanks {{contact.name}}! We received your submission and will get back to you shortly." } },
            { id: "3", type: "action", position: { x: 300, y: 240 }, data: { actionId: "create_task", label: "Create Follow-up Task", taskTitle: "Review submission from {{contact.name}}" } },
            { id: "4", type: "action", position: { x: 300, y: 360 }, data: { actionId: "internal_notification", label: "Notify Team", message: "New submission received from {{contact.name}}" } },
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", type: "smart" },
            { id: "e2-3", source: "2", target: "3", type: "smart" },
            { id: "e3-4", source: "3", target: "4", type: "smart" },
        ]
    },
    {
        id: "deal_won_celebration",
        name: "Deal Won Celebration",
        description: "Celebrate closed deals with thank you messages",
        category: "opportunities",
        icon: "Trophy",
        nodes: [
            { id: "1", type: "trigger", position: { x: 300, y: 0 }, data: { triggerId: "opportunity.status_changed", label: "Deal Won", filter: { status: "won" } } },
            { id: "2", type: "action", position: { x: 300, y: 120 }, data: { actionId: "send_email", label: "Send Onboarding Email", subject: "Welcome to HighReach!", template: "Thank you for choosing us! Here's what happens next..." } },
            { id: "3", type: "action", position: { x: 300, y: 240 }, data: { actionId: "add_tag", label: "Add Customer Tag", tag: "customer" } },
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", type: "smart" },
            { id: "e2-3", source: "2", target: "3", type: "smart" },
        ]
    },
    {
        id: "review_request",
        name: "Post-Service Review Request",
        description: "Ask for reviews after successful interactions",
        category: "marketing",
        icon: "Star",
        nodes: [
            { id: "1", type: "trigger", position: { x: 300, y: 0 }, data: { triggerId: "opportunity.status_changed", label: "Opportunity Won", filter: { status: "won" } } },
            { id: "2", type: "wait", position: { x: 300, y: 120 }, data: { waitType: "time_delay", duration: 1, unit: "days", label: "Wait 1 day" } },
            { id: "3", type: "action", position: { x: 300, y: 240 }, data: { actionId: "send_sms", label: "Send Review Request", template: "Hi {{contact.name}}! Thank you for working with us. Would you mind leaving us a quick review?" } },
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", type: "smart" },
            { id: "e2-3", source: "2", target: "3", type: "smart" },
        ]
    },
    {
        id: "email_drip_3day",
        name: "3-Day Email Follow-up",
        description: "Nurture new leads with follow-up emails",
        category: "marketing",
        icon: "Mail",
        nodes: [
            { id: "1", type: "trigger", position: { x: 300, y: 0 }, data: { triggerId: "contact.created", label: "Contact Created" } },
            { id: "2", type: "action", position: { x: 300, y: 100 }, data: { actionId: "send_email", label: "Day 1 Email", subject: "Welcome to HighReach", template: "Day 1: Welcome! Thanks for joining us." } },
            { id: "3", type: "wait", position: { x: 300, y: 200 }, data: { waitType: "time_delay", duration: 1, unit: "days", label: "Wait 1 day" } },
            { id: "4", type: "action", position: { x: 300, y: 300 }, data: { actionId: "send_email", label: "Day 2 Email", subject: "Tips & Best Practices", template: "Day 2: Here are some tips to get the most out of our service." } },
            { id: "5", type: "wait", position: { x: 300, y: 400 }, data: { waitType: "time_delay", duration: 1, unit: "days", label: "Wait 1 day" } },
            { id: "6", type: "action", position: { x: 300, y: 500 }, data: { actionId: "send_email", label: "Day 3 Email", subject: "Special Offer", template: "Day 3: Exclusive offer for you this week!" } },
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", type: "smart" },
            { id: "e2-3", source: "2", target: "3", type: "smart" },
            { id: "e3-4", source: "3", target: "4", type: "smart" },
            { id: "e4-5", source: "4", target: "5", type: "smart" },
            { id: "e5-6", source: "5", target: "6", type: "smart" },
        ]
    }
];

// ============ TYPESCRIPT TYPES ============

export type TriggerId = typeof TRIGGERS[number]["id"];
export type ActionId = typeof ACTIONS[number]["id"];
export type WaitTypeId = typeof WAIT_TYPES[number]["id"];
export type TimeUnit = typeof TIME_UNITS[number]["id"];

export interface WorkflowNode {
    id: string;
    type: "trigger" | "action" | "wait" | "if_else" | "end";
    position: { x: number; y: number };
    data: Record<string, any>;
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    type?: "yes" | "no" | "default";
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    status: "draft" | "published";
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    created_at: string;
    updated_at: string;
    tenant_id: string;
}
