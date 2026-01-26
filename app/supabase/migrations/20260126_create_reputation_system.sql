-- Create Enums
create type review_platform as enum ('google', 'facebook', 'other');
create type review_status as enum ('pending', 'replied', 'ignored');

-- Create Reviews Table
create table if not exists reviews (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id) on delete cascade not null,
    contact_id uuid references contacts(id) on delete set null,
    platform review_platform default 'google',
    reviewer_name text not null,
    reviewer_photo_url text, -- Avatar from Google
    rating integer check (rating >= 1 and rating <= 5) not null,
    content text,
    reply_content text,
    status review_status default 'pending',
    external_id text, -- Unique ID from the platform (e.g., Google Review ID)
    review_date timestamptz default now(), -- When the review was actually posted
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS
alter table reviews enable row level security;

-- RLS Policies
create policy "Users can view reviews for their tenant"
    on reviews for select
    using (exists (
        select 1 from users
        where users.id = auth.uid()
        and users.tenant_id = reviews.tenant_id
    ));

create policy "Users can update reviews for their tenant"
    on reviews for update
    using (exists (
        select 1 from users
        where users.id = auth.uid()
        and users.tenant_id = reviews.tenant_id
    ));

create policy "Users can insert reviews for their tenant"
    on reviews for insert
    with check (exists (
        select 1 from users
        where users.id = auth.uid()
        and users.tenant_id = reviews.tenant_id
    ));

create policy "Users can delete reviews for their tenant"
    on reviews for delete
    using (exists (
        select 1 from users
        where users.id = auth.uid()
        and users.tenant_id = reviews.tenant_id
    ));

-- Create Index for Performance
create index idx_reviews_tenant_id on reviews(tenant_id);
create index idx_reviews_status on reviews(tenant_id, status);

-- Add Mock Data (Optional, but helpful for development)
-- This assumes a tenant exists. We'll skip inserting actual rows in migration to avoid errors if no tenant.
