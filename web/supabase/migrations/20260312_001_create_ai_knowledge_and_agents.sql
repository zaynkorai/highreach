-- =============================================================
-- Migration: Create HighReach AI Knowledge Base & Agent Engine
-- =============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Extend app_permission enum if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') THEN
    ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'knowledge.read';
    ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'knowledge.write';
    ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'ai.manage';
  END IF;
END $$;

-- 3. Grant AI/Knowledge permissions to roles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
    INSERT INTO role_permissions (role, permission)
    VALUES
      ('owner', 'knowledge.read'),
      ('owner', 'knowledge.write'),
      ('owner', 'ai.manage'),
      ('admin', 'knowledge.read'),
      ('admin', 'knowledge.write'),
      ('admin', 'ai.manage'),
      ('member', 'knowledge.read'),
      ('member', 'knowledge.write')
    ON CONFLICT (role, permission) DO NOTHING;
  END IF;
END $$;

-- 4. Knowledge Sources Table
CREATE TABLE IF NOT EXISTS tenant_knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('faq', 'document', 'url', 'service_catalog')),
    raw_content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_tenant ON tenant_knowledge_sources(tenant_id);

-- 5. Document Embeddings (Chunked Semantic Vectors)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES tenant_knowledge_sources(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    token_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_tenant ON knowledge_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks(source_id);

-- Cosine similarity IVFFlat index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'knowledge_chunks_embedding_idx'
  ) THEN
    CREATE INDEX knowledge_chunks_embedding_idx 
    ON knowledge_chunks 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
  END IF;
EXCEPTION
  WHEN undefined_table OR OTHERS THEN
    -- In environments where ivfflat or data count is small, index creation might require rows or fallback
    NULL;
END $$;

-- 6. Agent Configurations
CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('lead_qualifier', 'booking_concierge', 'review_guardian')),
    is_active BOOLEAN DEFAULT false NOT NULL,
    autonomy_mode TEXT NOT NULL DEFAULT 'draft_only' CHECK (autonomy_mode IN ('draft_only', 'auto_pilot')),
    system_prompt_override TEXT,
    confidence_threshold NUMERIC(3, 2) DEFAULT 0.85 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (tenant_id, agent_type)
);

CREATE INDEX IF NOT EXISTS idx_agent_configs_tenant ON agent_configs(tenant_id);

-- 7. Agent Execution Audit Log (Traces & Memory)
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    trigger_event TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'draft_pending', 'failed', 'escalated')),
    input_context JSONB NOT NULL,
    reasoning_steps JSONB DEFAULT '[]'::jsonb,
    actions_taken JSONB DEFAULT '[]'::jsonb,
    draft_output TEXT,
    human_approved BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_tenant ON agent_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_contact ON agent_runs(contact_id);

-- 8. Row Level Security Policies
ALTER TABLE tenant_knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'tenant_knowledge_sources_isolation'
  ) THEN
    CREATE POLICY tenant_knowledge_sources_isolation ON tenant_knowledge_sources
      FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'knowledge_chunks_isolation'
  ) THEN
    CREATE POLICY knowledge_chunks_isolation ON knowledge_chunks
      FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'agent_configs_isolation'
  ) THEN
    CREATE POLICY agent_configs_isolation ON agent_configs
      FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'agent_runs_isolation'
  ) THEN
    CREATE POLICY agent_runs_isolation ON agent_runs
      FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
  END IF;
END $$;
