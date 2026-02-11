-- RLS is enabled on auth.users by default in Supabase
-- alter table auth.users enable row level security;

-- User Progress (Status, Notes)
create table if not exists public.user_progress (
  user_id uuid references auth.users not null,
  requirement_id integer not null,
  status text check (status in ('todo', 'learning', 'learned')),
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, requirement_id)
);

alter table public.user_progress enable row level security;

create policy "Users can view their own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert/update their own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);

-- User Folders
create table if not exists public.user_folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  requirement_id integer not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_folders enable row level security;

create policy "Users can view their own folders"
  on public.user_folders for select
  using (auth.uid() = user_id);

create policy "Users can manage their own folders"
  on public.user_folders for all
  using (auth.uid() = user_id);

-- User Media (Videos, Links)
create table if not exists public.user_media (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  requirement_id integer not null,
  type text check (type in ('video', 'link')) not null,
  title text not null,
  url text not null,
  notes text,
  folder_id uuid references public.user_folders(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_media enable row level security;

create policy "Users can view their own media"
  on public.user_media for select
  using (auth.uid() = user_id);

create policy "Users can manage their own media"
  on public.user_media for all
  using (auth.uid() = user_id);

-- User Groups (Custom Grouping)
create table if not exists public.user_groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  requirement_ids integer[] not null,
  collapsed boolean default false,
  list_order_index integer, -- To help persist order relative to other items if needed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_groups enable row level security;

create policy "Users can view their own groups"
  on public.user_groups for select
  using (auth.uid() = user_id);

create policy "Users can manage their own groups"
  on public.user_groups for all
  using (auth.uid() = user_id);

-- User Settings / List Order
-- We need a place to store the 'listOrder' from the store (which can contain mixed reqIds and groupIds)
create table if not exists public.user_settings (
  user_id uuid references auth.users primary key,
  list_order jsonb, -- Storing as JSON array of mixed types (strings for groups, numbers for reqs)
  selected_ids integer[],
  active_requirement_id integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can manage their own settings"
  on public.user_settings for all
  using (auth.uid() = user_id);

-- Function to handle handle_new_user (optional, but good practice)
-- create or replace function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer set search_path = public
-- as $$
-- begin
--   insert into public.user_settings (user_id)
--   values (new.id);
--   return new;
-- end;
-- $$;
-- 
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();
