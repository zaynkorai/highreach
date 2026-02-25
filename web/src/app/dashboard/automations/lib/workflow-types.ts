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
            { id: "1", type: "trigger", triggerId: "call.missed", position: { x: 300, y: 0 } },
            { id: "2", type: "wait", waitType: "time_delay", duration: 30, unit: "seconds", position: { x: 300, y: 120 } },
            { id: "3", type: "action", actionId: "send_sms", template: "Hey! Sorry I missed your call. How can I help you?", position: { x: 300, y: 240 } },
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
        ]
    },
    {
        id: "new_lead_nurture",
        name: "New Lead Nurturing Sequence",
        description: "Welcome new leads with email and SMS follow-up",
        category: "marketing",
        icon: "UserPlus",
        nodes: [
            { id: "1", type: "trigger", triggerId: "contact.created", position: { x: 300, y: 0 } },
            { id: "2", type: "action", actionId: "send_email", template: "Welcome! Thanks for signing up...", position: { x: 300, y: 120 } },
            { id: "3", type: "wait", waitType: "time_delay", duration: 1, unit: "days", position: { x: 300, y: 240 } },
            { id: "4", type: "action", actionId: "send_sms", template: "Hi {{contact.name}}! Just checking in...", position: { x: 300, y: 360 } },
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
        ]
    },
    {
        id: "appointment_reminder",
        name: "Appointment Reminder Sequence",
        description: "Send reminders before scheduled appointments",
        category: "appointments",
        icon: "CalendarCheck",
        nodes: [
            { id: "1", type: "trigger", triggerId: "appointment.booked", position: { x: 300, y: 0 } },
            { id: "2", type: "wait", waitType: "event_time", beforeEvent: true, duration: 1, unit: "days", position: { x: 300, y: 120 } },
            { id: "3", type: "action", actionId: "send_sms", template: "Reminder: Your appointment is tomorrow at {{appointment.time}}", position: { x: 300, y: 240 } },
            { id: "4", type: "wait", waitType: "time_delay", duration: 22, unit: "hours", position: { x: 300, y: 360 } },
            { id: "5", type: "action", actionId: "send_sms", template: "Your appointment is in 2 hours. See you soon!", position: { x: 300, y: 480 } },
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
        ]
    },
    {
        id: "form_submission_followup",
        name: "Form Submission Follow-up",
        description: "Automatically respond to form submissions",
        category: "forms",
        icon: "FileText",
        nodes: [
            { id: "1", type: "trigger", triggerId: "form.submitted", position: { x: 300, y: 0 } },
            { id: "2", type: "action", actionId: "send_email", template: "Thanks for contacting us! We'll be in touch shortly.", position: { x: 300, y: 120 } },
            { id: "3", type: "action", actionId: "create_task", taskTitle: "Follow up with {{contact.name}}", position: { x: 300, y: 240 } },
            { id: "4", type: "action", actionId: "internal_notification", message: "New form submission from {{contact.email}}", position: { x: 300, y: 360 } },
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
        ]
    },
    {
        id: "deal_won_celebration",
        name: "Deal Won Celebration",
        description: "Celebrate closed deals with thank you messages",
        category: "opportunities",
        icon: "Trophy",
        nodes: [
            { id: "1", type: "trigger", triggerId: "opportunity.status_changed", filter: { status: "won" }, position: { x: 300, y: 0 } },
            { id: "2", type: "action", actionId: "send_email", template: "Thank you for choosing us! Here's what happens next...", position: { x: 300, y: 120 } },
            { id: "3", type: "wait", waitType: "time_delay", duration: 1, unit: "hours", position: { x: 300, y: 240 } },
            { id: "4", type: "action", actionId: "send_sms", template: "We're excited to work with you! Your dedicated account manager will reach out shortly.", position: { x: 300, y: 360 } },
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
        ]
    },
    {
        id: "review_request",
        name: "Post-Service Review Request",
        description: "Ask for reviews after successful interactions",
        category: "marketing",
        icon: "Star",
        nodes: [
            { id: "1", type: "trigger", triggerId: "opportunity.status_changed", filter: { status: "won" }, position: { x: 300, y: 0 } },
            { id: "2", type: "wait", waitType: "time_delay", duration: 7, unit: "days", position: { x: 300, y: 120 } },
            { id: "3", type: "action", actionId: "send_sms", template: "Hi {{contact.name}}! Would you mind leaving us a review? {{review_link}}", position: { x: 300, y: 240 } },
            { id: "4", type: "wait", waitType: "trigger_link", linkId: "review_link", position: { x: 300, y: 360 } },
            { id: "5", type: "if_else", condition: { field: "trigger_link.clicked", operator: "equals", value: true }, position: { x: 300, y: 480 } },
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
        ]
    },
    {
        id: "email_drip_5day",
        name: "5-Day Email Drip Campaign",
        description: "Nurture leads with a 5-email sequence",
        category: "marketing",
        icon: "Mail",
        nodes: [
            { id: "1", type: "trigger", triggerId: "contact.tag_added", filter: { tag: "newsletter" }, position: { x: 300, y: 0 } },
            { id: "2", type: "action", actionId: "send_email", template: "Day 1: Welcome to our community!", position: { x: 300, y: 100 } },
            { id: "3", type: "wait", waitType: "time_delay", duration: 1, unit: "days", position: { x: 300, y: 200 } },
            { id: "4", type: "action", actionId: "send_email", template: "Day 2: Here's what you need to know...", position: { x: 300, y: 300 } },
            { id: "5", type: "wait", waitType: "time_delay", duration: 1, unit: "days", position: { x: 300, y: 400 } },
            { id: "6", type: "action", actionId: "send_email", template: "Day 3: Tips and tricks...", position: { x: 300, y: 500 } },
            { id: "7", type: "wait", waitType: "time_delay", duration: 1, unit: "days", position: { x: 300, y: 600 } },
            { id: "8", type: "action", actionId: "send_email", template: "Day 4: Success stories...", position: { x: 300, y: 700 } },
            { id: "9", type: "wait", waitType: "time_delay", duration: 1, unit: "days", position: { x: 300, y: 800 } },
            { id: "10", type: "action", actionId: "send_email", template: "Day 5: Special offer just for you!", position: { x: 300, y: 900 } },
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
            { source: "5", target: "6" },
            { source: "6", target: "7" },
            { source: "7", target: "8" },
            { source: "8", target: "9" },
            { source: "9", target: "10" },
        ]
    },
    {
        id: "no_show_followup",
        name: "Appointment No-Show Follow-up",
        description: "Re-engage customers who missed appointments",
        category: "appointments",
        icon: "UserX",
        nodes: [
            { id: "1", type: "trigger", triggerId: "appointment.no_show", position: { x: 300, y: 0 } },
            { id: "2", type: "wait", waitType: "time_delay", duration: 1, unit: "hours", position: { x: 300, y: 120 } },
            { id: "3", type: "action", actionId: "send_sms", template: "We missed you today! Would you like to reschedule? Reply YES to book a new time.", position: { x: 300, y: 240 } },
            { id: "4", type: "wait", waitType: "contact_reply", position: { x: 300, y: 360 } },
            { id: "5", type: "if_else", condition: { field: "response.type", operator: "equals", value: "positive" }, position: { x: 300, y: 480 } },
        ],
        edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" },
            { source: "4", target: "5" },
        ]
    },
] as const;

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
