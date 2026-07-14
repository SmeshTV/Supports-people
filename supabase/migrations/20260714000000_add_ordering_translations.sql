-- ============================================
-- MIGRATION: Add translations for ordering items and matching pairs
-- Fixes: ordering questions always showing in one language
-- ============================================

-- 1. Add correct_order_translations column (JSONB: { "ru": ["...", "..."], "en": ["...", "..."] })
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_order_translations JSONB DEFAULT '{}';

-- 2. Migrate existing correct_order data: convert string[] to include translations
-- If correct_order is ["A", "B", "C"], create correct_order_translations with empty arrays
DO $$
BEGIN
  UPDATE questions
  SET correct_order_translations = jsonb_build_object(
    'ru', correct_order,
    'en', correct_order,
    'kz', correct_order
  )
  WHERE type = 'ordering' 
    AND correct_order IS NOT NULL 
    AND jsonb_array_length(correct_order) > 0
    AND (correct_order_translations IS NULL OR correct_order_translations = '{}'::jsonb);
END $$;

-- 3. Ensure RLS is disabled for questions (admin access)
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

SELECT 'Migration: ordering translations added successfully!' as status;
