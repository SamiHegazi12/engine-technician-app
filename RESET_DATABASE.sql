-- WARNING: This will delete ALL repair agreements from your database.
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

DELETE FROM repair_agreements;

-- After running this, the app will automatically reset the counter to 0001 
-- for the current year because it calculates the count based on existing records.
