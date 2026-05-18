-- Allow full admin access for all operations

-- Directions - allow all operations
DROP POLICY IF EXISTS "Public read directions" ON directions;
DROP POLICY IF EXISTS "Admin manage directions" ON directions;
CREATE POLICY "Full access directions" ON directions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Full access directions auth" ON directions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Courses - allow all operations  
DROP POLICY IF EXISTS "Public read courses" ON courses;
DROP POLICY IF EXISTS "Admin manage courses" ON courses;
CREATE POLICY "Full access courses" ON courses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Full access courses auth" ON courses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Semesters
DROP POLICY IF EXISTS "Public read semesters" ON semesters;
DROP POLICY IF EXISTS "Admin manage semesters" ON semesters;
CREATE POLICY "Full access semesters" ON semesters FOR ALL TO anon USING (true) WITH CHECK (true);

-- Sessions
DROP POLICY IF EXISTS "Public read sessions" ON sessions;
DROP POLICY IF EXISTS "Admin manage sessions" ON sessions;
CREATE POLICY "Full access sessions" ON sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Disciplines
DROP POLICY IF EXISTS "Public read disciplines" ON disciplines;
DROP POLICY IF EXISTS "Admin manage disciplines" ON disciplines;
CREATE POLICY "Full access disciplines" ON disciplines FOR ALL TO anon USING (true) WITH CHECK (true);

-- Sections
DROP POLICY IF EXISTS "Public read sections" ON sections;
DROP POLICY IF EXISTS "Admin manage sections" ON sections;
CREATE POLICY "Full access sections" ON sections FOR ALL TO anon USING (true) WITH CHECK (true);

-- Exams
DROP POLICY IF EXISTS "Public read exams" ON exams;
DROP POLICY IF EXISTS "Admin manage exams" ON exams;
CREATE POLICY "Full access exams" ON exams FOR ALL TO anon USING (true) WITH CHECK (true);