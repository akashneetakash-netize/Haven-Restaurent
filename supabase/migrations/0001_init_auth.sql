-- Create custom enum types for auth_provider and role if they don't exist
DO $$ BEGIN
    CREATE TYPE user_auth_provider AS ENUM ('google', 'email_otp', 'whatsapp_otp');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT UNIQUE,
    avatar_url TEXT,
    auth_provider user_auth_provider NOT NULL DEFAULT 'email_otp',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read and update their own profile
CREATE POLICY "Users can read own record" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Service role has full access for backend operations
CREATE POLICY "Service role full access" ON public.users
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
