-- =============================================================
-- Migration: Create HighReach Social Studio (Postiz Engine)
-- =============================================================

-- 1. Extend app_permission enum if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') THEN
    ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'social.read';
    ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'social.write';
    ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'social.delete';
  END IF;
END $$;

-- 2. Grant social permissions to roles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
    INSERT INTO role_permissions (role, permission)
    VALUES
      ('owner', 'social.read'),
      ('owner', 'social.write'),
      ('owner', 'social.delete'),
      ('admin', 'social.read'),
      ('admin', 'social.write'),
      ('admin', 'social.delete'),
      ('member', 'social.read'),
      ('member', 'social.write')
    ON CONFLICT (role, permission) DO NOTHING;
  END IF;
END $$;

-- 3. Social Accounts Table
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'threads' | 'pinterest'
  account_name TEXT NOT NULL,
  account_handle TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'connected' NOT NULL, -- 'connected' | 'disconnected' | 'expired'
  external_account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(tenant_id, platform, external_account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_tenant ON social_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(tenant_id, platform);

-- 4. Social Posts Table
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}' NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL, -- 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb, -- platform specific overrides, first comment, hashtags
  error_message TEXT,
  metrics JSONB DEFAULT '{"likes": 0, "shares": 0, "comments": 0, "views": 0, "clicks": 0}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_social_posts_tenant ON social_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at);

-- 5. Social Post Channels (Dispatch Tracker)
CREATE TABLE IF NOT EXISTS social_post_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending' | 'published' | 'failed'
  external_post_id TEXT,
  external_post_url TEXT,
  error_message TEXT,
  published_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_post_channels_tenant ON social_post_channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_post_channels_post ON social_post_channels(post_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_channels ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'social_accounts_tenant_isolation') THEN
    CREATE POLICY social_accounts_tenant_isolation ON social_accounts
      FOR ALL USING (
        tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
        OR auth.jwt() IS NULL
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'social_posts_tenant_isolation') THEN
    CREATE POLICY social_posts_tenant_isolation ON social_posts
      FOR ALL USING (
        tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
        OR auth.jwt() IS NULL
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'social_post_channels_tenant_isolation') THEN
    CREATE POLICY social_post_channels_tenant_isolation ON social_post_channels
      FOR ALL USING (
        tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
        OR auth.jwt() IS NULL
      );
  END IF;
END $$;
