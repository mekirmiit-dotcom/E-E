-- Add optional time component to task deadlines
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME;
