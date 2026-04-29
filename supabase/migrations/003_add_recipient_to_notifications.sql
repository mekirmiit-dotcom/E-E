-- 003_add_recipient_to_notifications.sql
-- Adds missing recipient column to notifications table
-- and fixes type check constraint to include 'summary'

-- Add recipient column (defaults to 'both' for existing rows)
alter table public.notifications
  add column if not exists recipient text not null default 'both'
    check (recipient in ('emin', 'emre', 'both'));

-- Drop and recreate type constraint to include 'summary'
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
    check (type in ('reminder', 'overdue', 'completed', 'assigned', 'summary'));

-- Index for recipient-based filtering used in getNotifications()
create index if not exists notifications_recipient_idx
  on public.notifications(recipient);
