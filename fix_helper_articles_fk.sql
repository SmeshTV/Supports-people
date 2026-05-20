-- Fix helper_articles parent_id foreign key constraint
-- Drop the FK constraint so parent_id can reference any table
ALTER TABLE helper_articles DROP CONSTRAINT IF EXISTS helper_articles_parent_id_fkey;

-- Ensure parent_id column exists as plain UUID (no FK)
ALTER TABLE helper_articles ADD COLUMN IF NOT EXISTS parent_id UUID;

-- Add helper direction_type if not exists
INSERT INTO direction_types (type, name_ru, name_kz, description, icon, color, order_index) 
VALUES ('helper', 'Вспомогательные предметы', 'Көмекші пәндер', 'Дополнительные материалы и статьи', 'help', '#ec4899', 3) 
ON CONFLICT (type) DO NOTHING;
