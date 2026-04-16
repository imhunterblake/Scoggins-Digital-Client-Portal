-- ============================================================
-- SCOGGINS DIGITAL CLIENT PORTAL — SUPABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────
-- Extends Supabase auth.users with business info and role
create table public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  role            text not null default 'client' check (role in ('client', 'admin')),
  first_name      text,
  last_name       text,
  business_name   text,
  email           text,
  phone           text,
  created_at      timestamptz default now()
);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── PROJECTS ─────────────────────────────────────────────────
create table public.projects (
  id                      uuid default uuid_generate_v4() primary key,
  client_id               uuid references public.profiles(id) on delete cascade,
  name                    text not null,
  project_type            text,
  status                  text default 'awaiting_contract',
  progress                integer default 0 check (progress >= 0 and progress <= 100),
  total_price             numeric(10,2),
  deposit_received        boolean default false,
  final_payment_received  boolean default false,
  review_1_complete       boolean default false,
  final_approved          boolean default false,
  kickoff_date            date,
  est_completion          date,
  deadline                date,
  live_url                text,
  notes                   text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.update_updated_at();

-- ── MILESTONES ────────────────────────────────────────────────
create table public.milestones (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade,
  label        text not null,
  description  text,
  completed    boolean default false,
  completed_at timestamptz,
  sort_order   integer default 0,
  created_at   timestamptz default now()
);

-- ── ASSETS ───────────────────────────────────────────────────
create table public.assets (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade,
  type         text not null, -- 'logo' | 'photos' | 'video_url' | 'doc' | 'other'
  name         text not null,
  url          text not null,
  size_bytes   bigint,
  created_at   timestamptz default now()
);

-- ── FEEDBACK ─────────────────────────────────────────────────
create table public.feedback (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade,
  message      text not null,
  from_admin   boolean default false,
  created_at   timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles   enable row level security;
alter table public.projects   enable row level security;
alter table public.milestones enable row level security;
alter table public.assets     enable row level security;
alter table public.feedback   enable row level security;

-- Profiles: users can read/update their own, admins can read all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Projects: clients see only their own, admins see all
create policy "Clients see own projects"
  on public.projects for select
  using (client_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert projects"
  on public.projects for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update projects"
  on public.projects for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Milestones: same as projects
create policy "Milestones access"
  on public.milestones for all
  using (
    exists (select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or
      exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
  );

-- Assets: clients can insert for own project, admins can all
create policy "Assets select"
  on public.assets for select
  using (
    exists (select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or
      exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
  );

create policy "Clients can upload assets"
  on public.assets for insert
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.client_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Feedback: project members can read/insert
create policy "Feedback access"
  on public.feedback for all
  using (
    exists (select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or
      exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
  );

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run this in Supabase Dashboard > Storage > New bucket:
-- Name: client-assets
-- Public: true (so files are accessible via URL)

-- ============================================================
-- MAKE YOURSELF ADMIN
-- After signing up, run this in SQL Editor (replace with your email):
-- update public.profiles set role = 'admin' where email = 'hunter@scoggins.digital';
-- ============================================================

-- ============================================================
-- REALTIME
-- ============================================================
-- Enable realtime on feedback table in Supabase Dashboard:
-- Database > Replication > Enable for 'feedback' table
