create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  trigger_type text not null,
  message text not null,
  action text not null
);

create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  last_active timestamptz not null default now(),
  mood text,
  unique(user_id)
);
