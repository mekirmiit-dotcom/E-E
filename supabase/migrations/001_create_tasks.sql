-- 001_create_tasks.sql
-- Run this in your Supabase SQL editor

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner text not null check (owner in ('emin', 'emre', 'shared')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  due_date date,
  tags text[] default '{}',
  checklist jsonb default '[]',
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  message text not null,
  type text not null check (type in ('reminder', 'overdue', 'completed', 'assigned')),
  read boolean default false,
  created_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function update_updated_at();

-- Enable RLS
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;

-- Allow all for now (customize per user auth later)
create policy "Allow all on tasks" on public.tasks for all using (true) with check (true);
create policy "Allow all on notifications" on public.notifications for all using (true) with check (true);

-- Indexes
create index tasks_owner_idx on public.tasks(owner);
create index tasks_status_idx on public.tasks(status);
create index tasks_due_date_idx on public.tasks(due_date);
create index notifications_task_id_idx on public.notifications(task_id);
create index notifications_read_idx on public.notifications(read);
