-- Add category_id to test_sets table
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;