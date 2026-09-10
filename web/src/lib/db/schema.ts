import {
    pgTable,
    uuid,
    text,
    timestamp,
    boolean,
    integer,
    numeric,
    jsonb,
    time,
    date,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Tenants ───────────────────────────────────────────────────
export const tenants = pgTable("tenants", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    phoneNumber: text("phone_number"),
    industry: text("industry").default("general"),
    settings: jsonb("settings").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Users ─────────────────────────────────────────────────────
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    fullName: text("full_name"),
    role: text("role").default("member").notNull(), // 'owner' | 'admin' | 'member'
    onboardingCompleted: boolean("onboarding_completed").default(false),
    onboardingStep: integer("onboarding_step").default(1),
    industry: text("industry"),
    roleInCompany: text("role_in_company"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_users_tenant").on(table.tenantId),
]);

// ── Sessions ──────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_sessions_user").on(table.userId),
    index("idx_sessions_token").on(table.token),
]);

// ── Tenant Members ────────────────────────────────────────────
export const tenantMembers = pgTable("tenant_members", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    role: text("role").default("member").notNull(),
    invitedBy: uuid("invited_by").references(() => users.id),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex("uniq_tenant_member").on(table.tenantId, table.userId),
    index("idx_tenant_members_tenant").on(table.tenantId),
    index("idx_tenant_members_user").on(table.userId),
]);

// ── Tenant Invitations ────────────────────────────────────────
export const tenantInvitations = pgTable("tenant_invitations", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    email: text("email").notNull(),
    role: text("role").default("member").notNull(),
    token: uuid("token").defaultRandom().unique().notNull(),
    invitedBy: uuid("invited_by").references(() => users.id).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex("uniq_tenant_invitation").on(table.tenantId, table.email),
    index("idx_tenant_invitations_token").on(table.token),
    index("idx_tenant_invitations_email").on(table.email),
]);

// ── Contacts ──────────────────────────────────────────────────
export const contacts = pgTable("contacts", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    tags: text("tags").array().default(sql`'{}'`),
    source: text("source"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_contacts_tenant").on(table.tenantId),
]);

// ── Contact Activities ────────────────────────────────────────
export const contactActivities = pgTable("contact_activities", {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    type: text("type").notNull(), // 'note' | 'call_log' | 'sms' | 'email' | 'system'
    content: text("content"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id),
}, (table) => [
    index("idx_contact_activities_contact_id").on(table.contactId),
    index("idx_contact_activities_tenant").on(table.tenantId),
]);

// ── Contact Views (Saved Filters) ─────────────────────────────
export const contactViews = pgTable("contact_views", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    filters: jsonb("filters").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id),
}, (table) => [
    index("idx_contact_views_tenant_id").on(table.tenantId),
]);

// ── Conversations ─────────────────────────────────────────────
export const conversations = pgTable("conversations", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
    channel: text("channel").default("sms"), // 'sms' | 'email' | 'facebook' | 'instagram'
    status: text("status").default("open"), // 'open' | 'closed'
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_conversations_tenant").on(table.tenantId),
    index("idx_conversations_contact").on(table.contactId),
]);

// ── Messages ──────────────────────────────────────────────────
export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
    direction: text("direction").notNull(), // 'inbound' | 'outbound'
    channel: text("channel").default("sms"), // 'sms' | 'email'
    content: text("content").notNull(),
    metadata: jsonb("metadata").default({}),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_messages_conversation").on(table.conversationId),
    index("idx_messages_tenant").on(table.tenantId),
]);

// ── Forms ─────────────────────────────────────────────────────
export const forms = pgTable("forms", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    fields: jsonb("fields").default([]),
    theme: jsonb("theme").default({}),
    redirectUrl: text("redirect_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_forms_tenant").on(table.tenantId),
]);

// ── Form Submissions ──────────────────────────────────────────
export const formSubmissions = pgTable("form_submissions", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    formId: uuid("form_id").references(() => forms.id, { onDelete: "cascade" }).notNull(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    data: jsonb("data").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
});

// ── Pipelines & Kanban ────────────────────────────────────────
export const pipelines = pgTable("pipelines", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id),
});

export const pipelineStages = pgTable("pipeline_stages", {
    id: uuid("id").primaryKey().defaultRandom(),
    pipelineId: uuid("pipeline_id").references(() => pipelines.id, { onDelete: "cascade" }).notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    orderIndex: integer("order_index").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const opportunities = pgTable("opportunities", {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
    pipelineStageId: uuid("pipeline_stage_id").references(() => pipelineStages.id, { onDelete: "cascade" }).notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    title: text("title").notNull(),
    value: numeric("value", { precision: 12, scale: 2 }).default("0"),
    status: text("status").default("open").notNull(), // 'open' | 'won' | 'lost'
    orderIndex: integer("order_index").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id),
});

// ── External Accounts (Calendar Sync: Google / Outlook) ───────
export const externalAccounts = pgTable("external_accounts", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    provider: text("provider").notNull(), // 'google' | 'outlook'
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    scopes: text("scopes").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex("uniq_external_account").on(table.tenantId, table.provider, table.providerAccountId),
    index("idx_external_accounts_tenant").on(table.tenantId),
]);

// ── Calendars ─────────────────────────────────────────────────
export const calendars = pgTable("calendars", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    location: text("location"),
    timezone: text("timezone").default("UTC").notNull(),
    durationMinutes: integer("duration_minutes").default(30).notNull(),
    bufferMinutes: integer("buffer_minutes").default(0).notNull(),
    isActive: boolean("is_active").default(true),
    externalAccountId: uuid("external_account_id").references(() => externalAccounts.id, { onDelete: "set null" }),
    externalCalendarId: text("external_calendar_id"),
    syncDirection: text("sync_direction").default("off"), // 'off' | 'one_way' | 'bi_directional'
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex("uniq_calendar_slug").on(table.tenantId, table.slug),
]);

export const calendarAvailability = pgTable("calendar_availability", {
    id: uuid("id").primaryKey().defaultRandom(),
    calendarId: uuid("calendar_id").references(() => calendars.id, { onDelete: "cascade" }).notNull(),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
});

export const appointments = pgTable("appointments", {
    id: uuid("id").primaryKey().defaultRandom(),
    calendarId: uuid("calendar_id").references(() => calendars.id, { onDelete: "cascade" }).notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: text("status").default("confirmed").notNull(), // 'confirmed' | 'cancelled' | 'rescheduled' | 'no_show' | 'completed'
    location: text("location"),
    notes: text("notes"),
    externalEventId: text("external_event_id"),
    externalProvider: text("external_provider"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_appointments_external_id").on(table.externalEventId),
]);

export const calendarOverrides = pgTable("calendar_overrides", {
    id: uuid("id").primaryKey().defaultRandom(),
    calendarId: uuid("calendar_id").references(() => calendars.id, { onDelete: "cascade" }).notNull(),
    date: date("date").notNull(),
    isUnavailable: boolean("is_unavailable").default(false),
    startTime: time("start_time"),
    endTime: time("end_time"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Reputation / Reviews ──────────────────────────────────────
export const reviews = pgTable("reviews", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    platform: text("platform").default("google"), // 'google' | 'facebook' | 'other'
    reviewerName: text("reviewer_name").notNull(),
    reviewerPhotoUrl: text("reviewer_photo_url"),
    rating: integer("rating").notNull(),
    content: text("content"),
    replyContent: text("reply_content"),
    status: text("status").default("pending"), // 'pending' | 'replied' | 'ignored'
    externalId: text("external_id"),
    reviewDate: timestamp("review_date", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_reviews_tenant_id").on(table.tenantId),
    index("idx_reviews_status").on(table.tenantId, table.status),
]);

// ── Workflows Engine ──────────────────────────────────────────
export const workflows = pgTable("workflows", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    triggerType: text("trigger_type").notNull(),
    status: text("status").default("draft").notNull(), // 'draft' | 'published' | 'paused'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_workflows_tenant").on(table.tenantId),
]);

export const workflowVersions = pgTable("workflow_versions", {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "cascade" }).notNull(),
    versionNumber: integer("version_number").notNull(),
    definition: jsonb("definition").notNull(),
    isPublished: boolean("is_published").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id),
});

export const workflowExecutions = pgTable("workflow_executions", {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "cascade" }).notNull(),
    versionId: uuid("version_id").notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    triggerData: jsonb("trigger_data"),
    status: text("status").default("running").notNull(), // 'running' | 'completed' | 'failed' | 'waiting'
    currentStepId: text("current_step_id"),
    context: jsonb("context"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
});

export const workflowSettings = pgTable("workflow_settings", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    key: text("key").notNull(),
    enabled: boolean("enabled").default(false),
    config: jsonb("config").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex("uniq_workflow_settings").on(table.tenantId, table.key),
]);

// ── Audit Logs ────────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(),
    resourceType: text("resource_type"),
    resourceId: uuid("resource_id"),
    metadata: jsonb("metadata").default({}),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_audit_logs_tenant").on(table.tenantId),
    index("idx_audit_logs_action").on(table.action),
    index("idx_audit_logs_created").on(table.createdAt),
]);

// ── Usage Logs ────────────────────────────────────────────────
export const usageLogs = pgTable("usage_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    resourceType: text("resource_type").notNull(), // 'sms' | 'email' | 'review_ai' | 'form_submission'
    quantity: integer("quantity").default(1),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_usage_logs_tenant_resource").on(table.tenantId, table.resourceType, table.createdAt),
]);

// ── Social Studio (Postiz Alternative) ────────────────────────
export const socialAccounts = pgTable("social_accounts", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    platform: text("platform").notNull(), // 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'threads' | 'pinterest'
    accountName: text("account_name").notNull(),
    accountHandle: text("account_handle"),
    avatarUrl: text("avatar_url"),
    status: text("status").default("connected").notNull(), // 'connected' | 'disconnected' | 'expired'
    externalAccountId: text("external_account_id"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    settings: jsonb("settings").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex("uniq_social_account_platform").on(table.tenantId, table.platform, table.externalAccountId),
    index("idx_social_accounts_tenant").on(table.tenantId),
    index("idx_social_accounts_platform").on(table.tenantId, table.platform),
]);

export const socialPosts = pgTable("social_posts", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    content: text("content").notNull(),
    mediaUrls: text("media_urls").array().default(sql`'{}'`),
    platforms: text("platforms").array().notNull(),
    status: text("status").default("draft").notNull(), // 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    settings: jsonb("settings").default({}), // overrides, firstComment, hashtags
    errorMessage: text("error_message"),
    metrics: jsonb("metrics").default({ likes: 0, shares: 0, comments: 0, views: 0, clicks: 0 }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("idx_social_posts_tenant").on(table.tenantId),
    index("idx_social_posts_status").on(table.tenantId, table.status),
    index("idx_social_posts_scheduled").on(table.scheduledAt),
]);

export const socialPostChannels = pgTable("social_post_channels", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    postId: uuid("post_id").references(() => socialPosts.id, { onDelete: "cascade" }).notNull(),
    accountId: uuid("account_id").references(() => socialAccounts.id, { onDelete: "cascade" }).notNull(),
    platform: text("platform").notNull(),
    status: text("status").default("pending").notNull(), // 'pending' | 'published' | 'failed'
    externalPostId: text("external_post_id"),
    externalPostUrl: text("external_post_url"),
    errorMessage: text("error_message"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    metrics: jsonb("metrics").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex("uniq_social_post_channel").on(table.postId, table.accountId),
    index("idx_social_post_channels_tenant").on(table.tenantId),
    index("idx_social_post_channels_post").on(table.postId),
]);
