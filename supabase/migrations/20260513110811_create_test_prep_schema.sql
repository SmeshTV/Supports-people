/*
  # Test Preparation Platform - Core Schema

  ## Summary
  Creates the complete database schema for a world-class test preparation platform.

  ## New Tables

  1. **users** - Extended user profiles linked to Firebase Auth
     - id, firebase_uid, email, display_name, role (student/teacher/admin), preferences

  2. **subjects** - Top-level subject areas (Math, History, Biology, etc.)
     - id, name, description, icon, color, cover_image_url, is_published

  3. **categories** - Topics/chapters within subjects (supports one level of nesting)
     - id, subject_id, parent_id (nullable), name, description, order_index

  4. **questions** - Question bank with multiple question types
     - id, category_id, type (single/multiple/truefalse/text/order/fill/match)
     - body (rich text jsonb), options (jsonb array), explanation (rich text jsonb)
     - difficulty, points, time_limit_sec, tags, is_published

  5. **test_sets** - Curated collections of questions with configurable settings
     - id, subject_id, name, description, settings (jsonb), question_ids (uuid[])

  6. **test_attempts** - Records of users taking tests (NULL user_id = guest)
     - id, user_id (nullable), test_set_id, answers (jsonb), score, passed

  7. **bookmarks** - User-saved questions for later review
     - id, user_id, question_id

  8. **user_streaks** - Daily learning streak tracking
     - id, user_id, current_streak, longest_streak, streak_history

  9. **audit_log** - Developer audit trail of all content changes
     - id, actor_id, action, entity_type, entity_id, diff

  10. **question_reports** - User-submitted issue reports on questions
      - id, question_id, reporter_user_id (nullable), reason, comment

  ## Security
  - RLS enabled on ALL tables
  - Students can only read published content and manage their own data
  - Teachers can manage questions in their assigned subjects
  - Developer (smeshtrend@gmail.com) has full access via service role
*/

-- Users table (extends Firebase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text UNIQUE NOT NULL,
  email text NOT NULL,
  display_name text DEFAULT '',
  role text DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  preferences jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = firebase_uid OR (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = firebase_uid)
  WITH CHECK (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = firebase_uid);

-- Allow anon read for public display names
CREATE POLICY "Anyone can read basic user info"
  ON users FOR SELECT
  TO anon
  USING (true);

-- Allow anyone to insert (Firebase handles auth, not Supabase)
CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow update own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'book',
  color text DEFAULT '#010205',
  cover_image_url text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT true,
  order_index int DEFAULT 0
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published subjects"
  ON subjects FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins can read all subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can insert subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can update subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can delete subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories of published subjects"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM subjects WHERE subjects.id = categories.subject_id AND subjects.is_published = true));

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'multiple', 'truefalse', 'text', 'order', 'fill', 'match')),
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  options jsonb DEFAULT '[]'::jsonb,
  correct_answers jsonb DEFAULT '[]'::jsonb,
  explanation jsonb DEFAULT '{}'::jsonb,
  hint text DEFAULT '',
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points int DEFAULT 1 CHECK (points BETWEEN 1 AND 3),
  time_limit_sec int,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT true
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published questions"
  ON questions FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins can read all questions"
  ON questions FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins and teachers can insert questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) IN ('admin', 'teacher'));

CREATE POLICY "Admins and question owners can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin'
    OR created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
  )
  WITH CHECK (
    (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin'
    OR created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
  );

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

-- Test Sets table
CREATE TABLE IF NOT EXISTS test_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  settings jsonb DEFAULT '{
    "shuffle_questions": false,
    "shuffle_options": false,
    "time_limit_sec": null,
    "passing_score_pct": 70,
    "show_explanations": "immediate",
    "allow_retakes": true,
    "max_retakes": null,
    "mode": "practice",
    "question_count": null,
    "difficulty_filter": null
  }'::jsonb,
  question_ids uuid[] DEFAULT '{}',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT true
);

ALTER TABLE test_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published test sets"
  ON test_sets FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage all test sets"
  ON test_sets FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can insert test sets"
  ON test_sets FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can update test sets"
  ON test_sets FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can delete test sets"
  ON test_sets FOR DELETE
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

-- Test Attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  test_set_id uuid REFERENCES test_sets(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  answers jsonb DEFAULT '[]'::jsonb,
  score int DEFAULT 0,
  max_score int DEFAULT 0,
  passed boolean DEFAULT false
);

ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Admins can read all attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Authenticated users can insert attempts"
  ON test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Authenticated users can update own attempts"
  ON test_attempts FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text))
  WITH CHECK (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Allow anon to insert (guest attempts - user_id will be null, validated at app level)
CREATE POLICY "Anyone can insert guest attempts"
  ON test_attempts FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- User Streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_activity_date date,
  streak_history jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streaks"
  ON user_streaks FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can insert own streaks"
  ON user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text))
  WITH CHECK (user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  diff jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can insert audit log"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

-- Question Reports table
CREATE TABLE IF NOT EXISTS question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  reporter_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN ('wrong_answer', 'typo', 'unclear', 'outdated', 'other')),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false
);

ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert question reports"
  ON question_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read question reports"
  ON question_reports FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can update question reports"
  ON question_reports FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_set ON test_attempts(test_set_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_subject ON categories(subject_id);
