-- Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies (allow users to manage only their own profile)
create policy profiles_insert_own
  on public.profiles
  for insert
  with check ( auth.uid() = id );

create policy profiles_select_own
  on public.profiles
  for select
  using ( auth.uid() = id );

create policy profiles_update_own
  on public.profiles
  for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

create policy profiles_delete_own
  on public.profiles
  for delete
  using ( auth.uid() = id );

-- Trigger function to auto-create a profile when an auth user is created
create or replace function public.handle_auth_user_created()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'fullName', ''),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

-- Create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_auth_user_created();
