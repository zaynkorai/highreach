-- =============================================================
-- Phase 1, Migration 1: Permission & Role Enums
-- =============================================================

-- Role enum (replaces CHECK constraint on users.role)
CREATE TYPE app_role AS ENUM ('owner', 'admin', 'member');

-- Permission enum — every gated action in the system
CREATE TYPE app_permission AS ENUM (
  -- Contacts
  'contacts.read',
  'contacts.write',
  'contacts.delete',
  -- Conversations / Inbox
  'conversations.read',
  'conversations.write',
  -- Forms
  'forms.read',
  'forms.write',
  'forms.delete',
  -- Pipelines
  'pipelines.read',
  'pipelines.write',
  'pipelines.delete',
  -- Calendars
  'calendars.read',
  'calendars.write',
  -- Reputation / Reviews
  'reputation.read',
  'reputation.write',
  -- Automations / Workflows
  'automations.read',
  'automations.write',
  'automations.delete',
  -- Settings (org profile, integrations)
  'settings.read',
  'settings.write',
  -- Team Management
  'team.read',
  'team.invite',
  'team.remove',
  'team.change_role',
  -- Billing
  'billing.read',
  'billing.write'
);
