-- ============================================================================
-- MIGRATION: Add parent_id to tables for flexible hierarchy
-- Created: 2026-05-19
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add parent_id to test_sets for universal parent reference
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES sections(id) ON DELETE SET NULL;

-- Add parent_id to attestation_exams for universal parent reference
ALTER TABLE attestation_exams ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES attestations(id) ON DELETE SET NULL;

-- Add parent_id to disciplines
ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS parent_id UUID ON DELETE SET NULL;

-- Add parent_id to attestations
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS parent_id UUID ON DELETE SET NULL;

-- Add parent_id to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS parent_id UUID ON DELETE SET NULL;

-- Add parent_id to directions
ALTER TABLE directions ADD COLUMN IF NOT EXISTS parent_id UUID ON DELETE SET NULL;

-- Create indexes for faster parent_id lookups
CREATE INDEX IF NOT EXISTS idx_test_sets_parent ON test_sets(parent_id);
CREATE INDEX IF NOT EXISTS idx_attestation_exams_parent ON attestation_exams(parent_id);
CREATE INDEX IF NOT EXISTS idx_disciplines_parent ON disciplines(parent_id);
CREATE INDEX IF NOT EXISTS idx_attestations_parent ON attestations(parent_id);
CREATE INDEX IF NOT EXISTS idx_courses_parent ON courses(parent_id);
CREATE INDEX IF NOT EXISTS idx_directions_parent ON directions(parent_id);

-- Disable RLS (should already be disabled, but ensuring)
ALTER TABLE test_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE attestation_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines DISABLE ROW LEVEL SECURITY;
ALTER TABLE attestations DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE directions DISABLE ROW LEVEL SECURITY;

SELECT 'parent_id columns added successfully!' as status;
