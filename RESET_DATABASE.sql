-- WARNING: This will delete ALL repair agreements and recreate the table.
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- Drop the table if you want a completely fresh start (WARNING: DELETES ALL DATA)
-- DROP TABLE IF EXISTS repair_agreements;

CREATE TABLE IF NOT EXISTS repair_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expected_delivery_date TEXT, -- Nullable to avoid constraint errors
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

-- If you just want to clear data without deleting the table:
-- DELETE FROM repair_agreements;

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE repair_agreements ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all access for now (since the app uses the anon key)
CREATE POLICY "Allow all access" ON repair_agreements FOR ALL USING (true) WITH CHECK (true);
