-- SQL Script to reset the repair agreement counter
-- This script deletes all records from the 'repair_agreements' table.
-- Since the app calculates the next serial number based on the count of existing records for the current year,
-- deleting the records will effectively reset the counter to 0001 for the next entry.

-- WARNING: This will delete ALL repair agreements from your database.
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

DELETE FROM repair_agreements;

-- After running this, the next agreement created in the app will start from 0001.
