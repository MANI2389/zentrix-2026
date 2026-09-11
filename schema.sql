-- ==========================================================================
-- ZENTRIX 2K26 — Supabase PostgreSQL Database Schema
-- Host: The Kavery Engineering College (Autonomous, NAAC A+ Accredited)
-- Departments: CSE, IT & AI&DS
-- ==========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    college_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(50) NOT NULL,
    section VARCHAR(50) NOT NULL,
    register_number VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    non_technical_events JSONB DEFAULT '[]'::jsonb,
    team_members JSONB DEFAULT '[]'::jsonb,
    total_amount INTEGER NOT NULL,
    payment_ref VARCHAR(100) NOT NULL,
    payment_screenshot TEXT,
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for lightning fast searching and filtering on the Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_reg_no ON public.registrations(register_number);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.registrations(event_name);
CREATE INDEX IF NOT EXISTS idx_registrations_dept ON public.registrations(department);
CREATE INDEX IF NOT EXISTS idx_registrations_year ON public.registrations(year);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at DESC);

-- 3. Create Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
-- Crucial Security Guard: All reads and writes must pass through the Python backend
-- using the Supabase service_role key. No direct public/anon access from client browsers.
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Block anonymous public access directly to tables
DROP POLICY IF EXISTS "Service role only for registrations" ON public.registrations;
CREATE POLICY "Service role only for registrations"
ON public.registrations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role only for admins" ON public.admins;
CREATE POLICY "Service role only for admins"
ON public.admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Seed Initial Administrator Account
-- Email: admin@thekavery.org
-- Default Password: admin@zentrix2026
INSERT INTO public.admins (email, password_hash, role)
VALUES (
    'admin@thekavery.org',
    '$2b$12$Kx9aj/kxCfn7OGn48C1v0e1L5FNZZk.Od0DR.hTeVCYV4Umi/ckFe',
    'superadmin'
)
ON CONFLICT (email) DO NOTHING;

