-- Disable RLS for admin operations - allows service role to work

ALTER TABLE directions DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE semesters DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines DISABLE ROW LEVEL SECURITY;
ALTER TABLE sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_sets DISABLE ROW LEVEL SECURITY;

-- Also allow anon to read for users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop and recreate simpler policies for directions
DROP POLICY IF EXISTS "Admin manage directions" ON directions;
DROP POLICY IF EXISTS "Admin manage courses" ON courses;
DROP POLICY IF EXISTS "Admin manage semesters" ON semesters;
DROP POLICY IF EXISTS "Admin manage sessions" ON sessions;
DROP POLICY IF EXISTS "Admin manage disciplines" ON disciplines;
DROP POLICY IF EXISTS "Admin manage sections" ON sections;
DROP POLICY IF EXISTS "Admin manage exams" ON exams;

-- Allow anyone to do anything (since we use service role on backend)
CREATE POLICY "Allow all for anon" ON directions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON courses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON semesters FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON disciplines FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sections FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON exams FOR ALL TO anon USING (true) WITH CHECK (true);