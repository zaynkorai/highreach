-- =============================================================
-- Phase 1, Migration 7: Rewrite ALL RLS Policies
-- =============================================================
-- Drops every existing RLS policy and recreates them using
-- JWT claims (auth.jwt() -> 'app_metadata') instead of the
-- get_user_tenant_id() sub-select helper.
--
-- Pattern:
--   SELECT → tenant isolation only (all roles can read their data)
--   INSERT/UPDATE → tenant isolation + authorize('resource.write')
--   DELETE → tenant isolation + authorize('resource.delete')
-- =============================================================

-- Helper alias for tenant check (for readability)
-- We use inline expressions since Postgres doesn't support DEFINE.

-- ============================
-- Drop old helper function
-- ============================
DROP FUNCTION IF EXISTS get_user_tenant_id() CASCADE;

-- ============================
-- TENANTS
-- ============================
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenant" ON tenants;

CREATE POLICY "tenants_select" ON tenants
  FOR SELECT USING (
    id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "tenants_update" ON tenants
  FOR UPDATE USING (
    id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('settings.write')
  );

-- Insert: only via SECURITY DEFINER RPCs (signup flow)
CREATE POLICY "tenants_insert" ON tenants
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================
-- USERS
-- ============================
DROP POLICY IF EXISTS "Users can view team members" ON users;
DROP POLICY IF EXISTS "Users can insert self" ON users;
DROP POLICY IF EXISTS "Users can update self" ON users;

CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (id = auth.uid());

-- ============================
-- CONTACTS
-- ============================
DROP POLICY IF EXISTS "Tenant isolation for contacts" ON contacts;

CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('contacts.write')
  );

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('contacts.write')
  );

CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('contacts.delete')
  );

-- ============================
-- CONVERSATIONS
-- ============================
DROP POLICY IF EXISTS "Tenant isolation for conversations" ON conversations;

CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('conversations.write')
  );

CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('conversations.write')
  );

CREATE POLICY "conversations_delete" ON conversations
  FOR DELETE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('conversations.write')
  );

-- ============================
-- MESSAGES
-- ============================
DROP POLICY IF EXISTS "Tenant isolation for messages" ON messages;

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('conversations.write')
  );

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('conversations.write')
  );

-- ============================
-- FORMS
-- ============================
DROP POLICY IF EXISTS "Tenant isolation for forms" ON forms;

CREATE POLICY "forms_select" ON forms
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "forms_insert" ON forms
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('forms.write')
  );

CREATE POLICY "forms_update" ON forms
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('forms.write')
  );

CREATE POLICY "forms_delete" ON forms
  FOR DELETE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('forms.delete')
  );

-- ============================
-- FORM SUBMISSIONS
-- ============================
DROP POLICY IF EXISTS "Tenant isolation for form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Anyone can submit forms" ON form_submissions;

CREATE POLICY "form_submissions_select" ON form_submissions
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- Public insert remains (form submissions from anonymous users)
CREATE POLICY "form_submissions_insert" ON form_submissions
  FOR INSERT WITH CHECK (true);

-- ============================
-- WORKFLOW SETTINGS
-- ============================
DROP POLICY IF EXISTS "Users can view their own tenant settings" ON workflow_settings;
DROP POLICY IF EXISTS "Users can update their own tenant settings" ON workflow_settings;
DROP POLICY IF EXISTS "Users can insert their own tenant settings" ON workflow_settings;

CREATE POLICY "workflow_settings_select" ON workflow_settings
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "workflow_settings_insert" ON workflow_settings
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('automations.write')
  );

CREATE POLICY "workflow_settings_update" ON workflow_settings
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('automations.write')
  );
