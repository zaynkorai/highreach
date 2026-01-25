-- Create Workflows Table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL, -- The primary trigger (e.g., 'contact.created') for indexing
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'paused'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_workflow_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view workflows" ON workflows FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Users can insert workflows" ON workflows FOR INSERT WITH CHECK (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Users can update workflows" ON workflows FOR UPDATE USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Users can delete workflows" ON workflows FOR DELETE USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);


-- Create Workflow Versions Table (Immutable Snapshots)
CREATE TABLE workflow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    definition JSONB NOT NULL, -- The React Flow nodes/edges and configuration logic
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID, -- User ID who saved this version

    CONSTRAINT fk_version_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view versions" ON workflow_versions FOR SELECT USING (
    EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_versions.workflow_id AND w.tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid)
);
CREATE POLICY "Users can insert versions" ON workflow_versions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_versions.workflow_id AND w.tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid)
);


-- Create Workflow Executions Table (Runtime Logs)
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL,
    version_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    trigger_data JSONB, -- The payload that started it
    status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'waiting'
    current_step_id TEXT, -- The node ID currently interacting with
    context JSONB, -- The running state/variables
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,

    CONSTRAINT fk_exec_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    CONSTRAINT fk_exec_version FOREIGN KEY (version_id) REFERENCES workflow_versions(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view executions" ON workflow_executions FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Users can update executions" ON workflow_executions FOR UPDATE USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Service role can all executions" ON workflow_executions USING (true); -- For Inngest/Backend

-- Indexes for performance
CREATE INDEX idx_workflows_tenant ON workflows(tenant_id);
CREATE INDEX idx_executions_tenant ON workflow_executions(tenant_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);
