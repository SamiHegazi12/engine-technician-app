-- SQL Script to fix the 'repair_agreements' table schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Add the missing 'repair_agreement_link' column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='repair_agreements' AND column_name='repair_agreement_link') THEN
        ALTER TABLE repair_agreements ADD COLUMN repair_agreement_link TEXT;
    END IF;
END $$;

-- 2. Ensure all other columns are present (Full schema for reference)
/*
CREATE TABLE IF NOT EXISTS repair_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expected_delivery_date TEXT,
    job_card_number TEXT,
    vehicle JSONB NOT NULL,
    customer JSONB NOT NULL,
    claims JSONB NOT NULL,
    discount_percent NUMERIC DEFAULT 0,
    photos TEXT[] DEFAULT '{}',
    signature TEXT,
    status TEXT NOT NULL,
    terms_accepted BOOLEAN DEFAULT FALSE,
    repair_agreement_link TEXT
);
*/

-- 3. Refresh the PostgREST schema cache (Supabase does this automatically, but good to keep in mind)
-- If the error persists, try running: NOTIFY pgrst, 'reload schema';
