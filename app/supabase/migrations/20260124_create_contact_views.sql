-- Create contact_views table
create table if not exists contact_views (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  filters jsonb not null default '{}'::jsonb, -- Stores { source, tags, searchQuery, sort }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table contact_views enable row level security;

-- Create Policies
create policy "Users can view saved views for their tenant"
  on contact_views for select
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can insert saved views for their tenant"
  on contact_views for insert
  with check (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy "Users can delete saved views for their tenant"
  on contact_views for delete
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

-- Index (though implied by PK, good to index tenant for multi-tenant queries)
create index if not exists idx_contact_views_tenant_id on contact_views(tenant_id);
