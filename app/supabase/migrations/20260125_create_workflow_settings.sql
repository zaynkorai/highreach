
create table if not exists workflow_settings (
    id uuid default gen_random_uuid() primary key,
    tenant_id uuid references tenants(id) on delete cascade not null,
    key text not null, -- 'missed_call_sms', 'new_lead_sms', 'deal_won_notification', 'review_request_sms'
    enabled boolean default false,
    config jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(tenant_id, key)
);

alter table workflow_settings enable row level security;

create policy "Users can view their own tenant settings"
    on workflow_settings for select
    using (tenant_id in (select tenant_id from users where id = auth.uid()));

create policy "Users can update their own tenant settings"
    on workflow_settings for update
    using (tenant_id in (select tenant_id from users where id = auth.uid()));

create policy "Users can insert their own tenant settings"
    on workflow_settings for insert
    with check (tenant_id in (select tenant_id from users where id = auth.uid()));
