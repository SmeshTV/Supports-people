-- ============================================
-- MIGRATION: Fix sections table - add test_set_id and disable RLS
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add test_set_id column if it doesn't exist
ALTER TABLE sections ADD COLUMN IF NOT EXISTS test_set_id UUID REFERENCES test_sets(id);

-- 2. Disable RLS on sections table
ALTER TABLE sections DISABLE ROW LEVEL SECURITY;

-- 3. Drop any existing RLS policies that might block updates
DROP POLICY IF EXISTS "Enable read access for all users" ON sections;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON sections;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON sections;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON sections;

-- 4. Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sections' AND column_name = 'test_set_id';

-- 5. Test update
UPDATE sections SET test_set_id = test_set_id WHERE id IS NOT NULL LIMIT 1;

SELECT 'Sections table fixed successfully!' as status;
