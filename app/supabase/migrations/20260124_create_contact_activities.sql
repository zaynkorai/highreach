-- Create contact_activities table
create table if not exists contact_activities (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references contacts(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  type text not null check (type in ('note', 'call_log', 'sms', 'email', 'system')),
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table contact_activities enable row level security;

-- Create Policy (inherit from contact/tenant)
create policy "Users can view activities for their tenant"
  on contact_activities for select
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can insert activities for their tenant"
  on contact_activities for insert
  with check (tenant_id = (select tenant_id from users where id = auth.uid()));

-- Index for faster timeline lookups
create index if not exists idx_contact_activities_contact_id on contact_activities(contact_id);
