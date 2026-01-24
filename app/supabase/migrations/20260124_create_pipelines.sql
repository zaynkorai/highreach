-- Create pipelines table
create table if not exists pipelines (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Create pipeline_stages table
create table if not exists pipeline_stages (
  id uuid default gen_random_uuid() primary key,
  pipeline_id uuid references pipelines(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create opportunities table
create table if not exists opportunities (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references contacts(id) on delete cascade not null,
  pipeline_stage_id uuid references pipeline_stages(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  title text not null,
  value numeric(12, 2) default 0,
  status text not null check (status in ('open', 'won', 'lost')) default 'open',
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table pipelines enable row level security;
alter table pipeline_stages enable row level security;
alter table opportunities enable row level security;

-- Pipelines Policies
create policy "Users can view pipelines for their tenant"
  on pipelines for select
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can insert pipelines for their tenant"
  on pipelines for insert
  with check (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can update pipelines for their tenant"
  on pipelines for update
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can delete pipelines for their tenant"
  on pipelines for delete
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

-- Stages Policies
create policy "Users can view stages for their tenant"
  on pipeline_stages for select
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can insert stages for their tenant"
  on pipeline_stages for insert
  with check (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can update stages for their tenant"
  on pipeline_stages for update
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can delete stages for their tenant"
  on pipeline_stages for delete
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

-- Opportunities Policies
create policy "Users can view opportunities for their tenant"
  on opportunities for select
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can insert opportunities for their tenant"
  on opportunities for insert
  with check (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can update opportunities for their tenant"
  on opportunities for update
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can delete opportunities for their tenant"
  on opportunities for delete
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

-- Indexes for performance
create index if not exists idx_pipelines_tenant_id on pipelines(tenant_id);
create index if not exists idx_pipeline_stages_pipeline_id on pipeline_stages(pipeline_id);
create index if not exists idx_opportunities_pipeline_stage_id on opportunities(pipeline_stage_id);
create index if not exists idx_opportunities_contact_id on opportunities(contact_id);
create index if not exists idx_opportunities_tenant_id on opportunities(tenant_id);
