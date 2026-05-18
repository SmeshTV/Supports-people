-- ============================================
-- MIGRATION: Add multi-language support
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add translation columns to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_text_translations JSONB DEFAULT '{}';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS hint_translations JSONB DEFAULT '{}';

-- 2. Update body column to support translations (JSONB)
-- Check if body already has text_translations structure
DO $$
BEGIN
  -- Update existing questions to have proper body structure with translations
  UPDATE questions
  SET body = jsonb_build_object(
    'text', CASE 
      WHEN body->>'text' IS NOT NULL THEN body->>'text'
      WHEN body IS NOT NULL AND jsonb_typeof(body) = 'string' THEN body::text
      ELSE ''
    END,
    'text_translations', '{}'::jsonb,
    'image_url', CASE WHEN body->>'image_url' IS NOT NULL THEN body->>'image_url' ELSE null END
  )
  WHERE body IS NOT NULL AND jsonb_typeof(body) != 'object';

  -- Add text_translations to existing body objects that don't have it
  UPDATE questions
  SET body = body || '{"text_translations": {}}'::jsonb
  WHERE body IS NOT NULL 
    AND jsonb_typeof(body) = 'object'
    AND body->'text_translations' IS NULL;
END $$;

-- 3. Update explanation column to support translations
DO $$
BEGIN
  UPDATE questions
  SET explanation = jsonb_build_object(
    'text', CASE 
      WHEN explanation->>'text' IS NOT NULL THEN explanation->>'text'
      WHEN explanation IS NOT NULL AND jsonb_typeof(explanation) = 'string' THEN explanation::text
      ELSE ''
    END,
    'text_translations', '{}'::jsonb
  )
  WHERE explanation IS NOT NULL AND jsonb_typeof(explanation) != 'object';

  UPDATE questions
  SET explanation = explanation || '{"text_translations": {}}'::jsonb
  WHERE explanation IS NOT NULL 
    AND jsonb_typeof(explanation) = 'object'
    AND explanation->'text_translations' IS NULL;
END $$;

-- 4. Update options column to support translations
DO $$
BEGIN
  -- Add text_translations to each option in the options array
  UPDATE questions
  SET options = (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->'text_translations' IS NOT NULL THEN elem
        ELSE elem || '{"text_translations": {}}'::jsonb
      END
    )
    FROM jsonb_array_elements(options) AS elem
  )
  WHERE options IS NOT NULL 
    AND jsonb_typeof(options) = 'array'
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(options) AS elem
      WHERE elem->'text_translations' IS NULL
    );
END $$;

-- 5. Add translation columns to test_sets table
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}';
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS description_translations JSONB DEFAULT '{}';
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS source_description_translations JSONB DEFAULT '{}';

-- 6. Add translation columns to subjects table
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description_translations JSONB DEFAULT '{}';

-- 7. Add translation columns to categories table  
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_translations JSONB DEFAULT '{}';

-- 8. Add translation columns to sections table
ALTER TABLE sections ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}';
ALTER TABLE sections ADD COLUMN IF NOT EXISTS description_translations JSONB DEFAULT '{}';
ALTER TABLE sections ADD COLUMN IF NOT EXISTS content_translations JSONB DEFAULT '{}';
ALTER TABLE sections ADD COLUMN IF NOT EXISTS lecture_content_translations JSONB DEFAULT '{}';

-- 9. Add translation columns to directions table
ALTER TABLE directions ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}';
ALTER TABLE directions ADD COLUMN IF NOT EXISTS description_translations JSONB DEFAULT '{}';

-- 10. Add translation columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_name_translations JSONB DEFAULT '{}';

-- 11. Add translation columns to disciplines table
ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}';
ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS description_translations JSONB DEFAULT '{}';

-- 12. Add translation columns to attestations table
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}';

-- 13. Add translation columns to attestation_exams table
ALTER TABLE attestation_exams ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}';
ALTER TABLE attestation_exams ADD COLUMN IF NOT EXISTS description_translations JSONB DEFAULT '{}';

-- 14. Add translation columns to helper_articles table
ALTER TABLE helper_articles ADD COLUMN IF NOT EXISTS title_translations JSONB DEFAULT '{}';
ALTER TABLE helper_articles ADD COLUMN IF NOT EXISTS content_translations JSONB DEFAULT '{}';

-- 15. Ensure RLS is disabled for admin access
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE directions DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines DISABLE ROW LEVEL SECURITY;
ALTER TABLE attestations DISABLE ROW LEVEL SECURITY;
ALTER TABLE attestation_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE helper_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE trash DISABLE ROW LEVEL SECURITY;
ALTER TABLE direction_types DISABLE ROW LEVEL SECURITY;

-- Verify the changes
SELECT 'Migration completed successfully!' as status;
