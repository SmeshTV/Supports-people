-- Disable RLS on users table to allow service role key to work
-- This is needed because app uses Firebase Auth, not Supabase Auth

ALTER TABLE users DISABLE ROW LEVEL SECURITY;