-- Migration: Create Usage Logs for resource monitoring
create type usage_type as enum ('sms', 'email', 'review_ai', 'form_submission');

create table if not exists usage_logs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id) on delete cascade not null,
    resource_type usage_type not null,
    quantity integer default 1,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- Enable RLS
alter table usage_logs enable row level security;

-- Policies
create policy "Users can view their tenant's usage"
    on usage_logs for select
    using (exists (
        select 1 from users
        where users.id = auth.uid()
        and users.tenant_id = usage_logs.tenant_id
    ));

-- Index for aggregate performance
create index idx_usage_logs_tenant_resource on usage_logs(tenant_id, resource_type, created_at);
