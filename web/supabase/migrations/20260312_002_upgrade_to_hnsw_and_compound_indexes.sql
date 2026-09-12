-- =============================================================
-- Migration: Upgrade to HNSW Vector Index & Add Compound Indexes
-- =============================================================

-- 1. Upgrade Knowledge Chunks to HNSW (Hierarchical Navigable Small World) Index
-- HNSW offers ~10x higher QPS than IVFFlat and does not require periodic rebuilding
DROP INDEX IF EXISTS knowledge_chunks_embedding_idx;

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_hnsw 
ON knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 2. Compound B-Tree Indexes for Context Assembler & Multi-Tenant Queries
-- Contact Activities: fast chronological timeline extraction per contact
CREATE INDEX IF NOT EXISTS idx_contact_activities_tenant_contact 
ON contact_activities(tenant_id, contact_id, created_at DESC);

-- Appointments: fast upcoming/recent appointment extraction per contact
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_contact 
ON appointments(tenant_id, contact_id, start_time DESC);

-- Opportunities: fast active pipeline deals extraction per contact
CREATE INDEX IF NOT EXISTS idx_opportunities_tenant_contact 
ON opportunities(tenant_id, contact_id, created_at DESC);

-- Form Submissions: fast form submission extraction per contact
CREATE INDEX IF NOT EXISTS idx_form_submissions_tenant_contact 
ON form_submissions(tenant_id, contact_id, submitted_at DESC);

-- Conversations: fast active thread discovery per contact
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_contact 
ON conversations(tenant_id, contact_id, last_message_at DESC);

-- Messages: fast chronological message stream extraction per conversation
CREATE INDEX IF NOT EXISTS idx_messages_tenant_conversation 
ON messages(tenant_id, conversation_id, created_at ASC);
