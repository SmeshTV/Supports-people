-- ============================================
-- MIGRATION: Add course_id to test_sets table
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS direction_id UUID REFERENCES directions(id);
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES disciplines(id);

-- Disable RLS on test_sets
ALTER TABLE test_sets DISABLE ROW LEVEL SECURITY;

SELECT 'test_sets columns added successfully!' as status;
