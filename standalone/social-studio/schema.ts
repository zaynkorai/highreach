import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex, index, sql } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
});

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
});

export const socialAccounts = pgTable("social_accounts", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    platform: text("platform").notNull(),
    accountName: text("account_name").notNull(),
    accountHandle: text("account_handle"),
    avatarUrl: text("avatar_url"),
    status: text("status").default("connected").notNull(),
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
    status: text("status").default("draft").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    settings: jsonb("settings").default({}),
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
    status: text("status").default("pending").notNull(),
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
