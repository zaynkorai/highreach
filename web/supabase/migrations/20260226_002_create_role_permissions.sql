-- =============================================================
-- Phase 1, Migration 2: Role ↔ Permission Mapping
-- =============================================================

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission app_permission NOT NULL,
  UNIQUE(role, permission)
);

-- Owners get EVERY permission
INSERT INTO role_permissions (role, permission)
SELECT 'owner'::app_role, unnest(enum_range(NULL::app_permission));

-- Admins get everything EXCEPT billing.write
-- We grant all and rely on application-layer logic for owner-protect rules
INSERT INTO role_permissions (role, permission)
SELECT 'admin'::app_role, p
FROM unnest(enum_range(NULL::app_permission)) AS p
WHERE p != 'billing.write'::app_permission;

-- Members: read access + limited write
INSERT INTO role_permissions (role, permission) VALUES
  -- Contacts
  ('member', 'contacts.read'),
  ('member', 'contacts.write'),
  -- Conversations
  ('member', 'conversations.read'),
  ('member', 'conversations.write'),
  -- Forms (read only)
  ('member', 'forms.read'),
  -- Pipelines
  ('member', 'pipelines.read'),
  ('member', 'pipelines.write'),
  -- Calendars
  ('member', 'calendars.read'),
  ('member', 'calendars.write'),
  -- Reputation (read only)
  ('member', 'reputation.read'),
  -- Automations (read only)
  ('member', 'automations.read'),
  -- Settings (read only)
  ('member', 'settings.read'),
  -- Team (read only — can see who's on the team)
  ('member', 'team.read');

-- RLS: role_permissions is a public lookup table, readable by all authenticated
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_select" ON role_permissions
  FOR SELECT TO authenticated USING (true);
