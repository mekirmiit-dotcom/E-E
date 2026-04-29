-- 004_push_subscriptions_owner.sql
-- Adds owner column to push_subscriptions so push notifications
-- can be filtered by recipient instead of broadcasting to all devices

ALTER TABLE public.push_subscriptions
ADD COLUMN IF NOT EXISTS owner text CHECK (owner IN ('emin', 'emre'));

CREATE INDEX IF NOT EXISTS push_subscriptions_owner_idx
  ON public.push_subscriptions(owner);
