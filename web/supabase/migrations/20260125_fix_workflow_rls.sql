-- Drop failing policy
DROP POLICY IF EXISTS "Users can insert workflows" ON workflows;
DROP POLICY IF EXISTS "Users can view workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete workflows" ON workflows;

-- Recreate robust policies that check the users table instead of JWT claims
CREATE POLICY "Users can view workflows" ON workflows FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can insert workflows" ON workflows FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update workflows" ON workflows FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can delete workflows" ON workflows FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- Fix Versions Policies as well
DROP POLICY IF EXISTS "Users can view versions" ON workflow_versions;
DROP POLICY IF EXISTS "Users can insert versions" ON workflow_versions;

CREATE POLICY "Users can view versions" ON workflow_versions FOR SELECT USING (
    workflow_id IN (
        SELECT w.id FROM workflows w 
        WHERE w.tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can insert versions" ON workflow_versions FOR INSERT WITH CHECK (
    workflow_id IN (
        SELECT w.id FROM workflows w 
        WHERE w.tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
);

-- Fix Executions Policies as well
DROP POLICY IF EXISTS "Users can view executions" ON workflow_executions;
DROP POLICY IF EXISTS "Users can update executions" ON workflow_executions;

CREATE POLICY "Users can view executions" ON workflow_executions FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update executions" ON workflow_executions FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);
