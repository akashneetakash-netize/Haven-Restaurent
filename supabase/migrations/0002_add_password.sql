-- Add password storage columns to the users table
-- password_hash is nullable — Google/OTP-only users will not have one set
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_reset_requested_at TIMESTAMPTZ;

-- Note: no migration needed for RLS policies — existing service_role policy
-- already covers the new columns.
