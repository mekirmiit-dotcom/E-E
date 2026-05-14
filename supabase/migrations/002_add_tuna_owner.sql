-- Add 'tuna' as a valid owner value
-- If owner column is an enum type, alter it:
ALTER TYPE owner_enum ADD VALUE IF NOT EXISTS 'tuna';

-- If owner column is a text column with a CHECK constraint, run this instead:
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_owner_check;
-- ALTER TABLE tasks ADD CONSTRAINT tasks_owner_check
--   CHECK (owner IN ('emin', 'emre', 'tuna', 'shared'));

-- Same for notifications recipient column if it has a CHECK constraint:
-- ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_recipient_check;
-- ALTER TABLE notifications ADD CONSTRAINT notifications_recipient_check
--   CHECK (recipient IN ('emin', 'emre', 'tuna', 'both'));

-- Same for comments author column if it has a CHECK constraint:
-- ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_author_check;
-- ALTER TABLE comments ADD CONSTRAINT comments_author_check
--   CHECK (author IN ('emin', 'emre', 'tuna'));
