-- ============================================================================
-- Learning Management System - Full Structure with Trash/Recovery
-- Created: 2025-05-17
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Drop ALL tables and types with CASCADE to handle dependencies
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS trash CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS disciplines CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS directions CASCADE;
DROP TABLE IF EXISTS direction_types CASCADE;

-- Drop existing types (with CASCADE)
DROP TYPE IF EXISTS direction_type CASCADE;
DROP TYPE IF EXISTS session_type CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;

-- Type of learning direction
CREATE TYPE direction_type AS ENUM ('ent', 'university', 'school');

-- Type of exam session
CREATE TYPE session_type AS ENUM ('midterm', 'final', 'credit');

-- Type of content item (for trash)
CREATE TYPE content_type AS ENUM (
  'subject', 'direction', 'course', 'semester', 
  'discipline', 'section', 'test_set', 'question', 'exam'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Direction Types (ЕНТ, Университет, Школа)
CREATE TABLE IF NOT EXISTS direction_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type direction_type NOT NULL UNIQUE,
  name_ru text NOT NULL,
  name_kz text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'book',
  color text DEFAULT '#6366f1',
  order_index int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Directions/Specializations (Направления: Программирование, Математика...)
CREATE TABLE IF NOT EXISTS directions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction_type direction_type NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'book',
  color text DEFAULT '#6366f1',
  order_index int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Courses (Курсы: 1 курс, 2 курс...)
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction_id uuid REFERENCES directions(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_name text DEFAULT '',
  order_index int DEFAULT 1,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Semesters (Семестры: Осень 2025, Весна 2026)
CREATE TABLE IF NOT EXISTS semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  order_index int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sessions/Экзаменационные сессии
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id uuid REFERENCES semesters(id) ON DELETE CASCADE,
  name text NOT NULL,
  session_type session_type DEFAULT 'final',
  start_date date,
  end_date date,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disciplines (Дисциплины/Предметы: Алгебра, Физика...)
CREATE TABLE IF NOT EXISTS disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction_id uuid REFERENCES directions(id) ON DELETE CASCADE,
  semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  order_index int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sections/Themes (Разделы и темы внутри дисциплин)
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id uuid REFERENCES disciplines(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  order_index int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Exams (Экзамены с датами)
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id uuid REFERENCES disciplines(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  exam_date date,
  exam_time time,
  duration_minutes int DEFAULT 90,
  is_published boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add type column to existing tables for compatibility
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS direction_type direction_type DEFAULT 'school';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS direction_id uuid;
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS direction_id uuid;
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS discipline_id uuid;

-- ============================================================================
-- TRASH SYSTEM (Корзина с восстановлением)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type content_type NOT NULL,
  content_id uuid NOT NULL,
  content_data jsonb DEFAULT '{}'::jsonb,
  parent_id uuid,
  deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  deleted_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  is_restored boolean DEFAULT false,
  restored_at timestamptz,
  restored_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Index for trash cleanup
CREATE INDEX IF NOT EXISTS idx_trash_expires ON trash(expires_at) WHERE is_restored = false;
CREATE INDEX IF NOT EXISTS idx_trash_content ON trash(content_type, content_id);

-- ============================================================================
-- STATISTICS & ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  discipline_id uuid REFERENCES disciplines(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  test_set_id uuid REFERENCES test_sets(id) ON DELETE SET NULL,
  
  xp_points int DEFAULT 0,
  level int DEFAULT 1,
  streak_days int DEFAULT 0,
  
  questions_total int DEFAULT 0,
  questions_correct int DEFAULT 0,
  tests_completed int DEFAULT 0,
  
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, discipline_id, section_id, test_set_id)
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  achievement_key text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '🏆',
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE direction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE trash ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Direction Types - Public read
CREATE POLICY "Public read direction_types" ON direction_types FOR SELECT TO anon, authenticated USING (is_active = true);

-- Directions - Public read published
CREATE POLICY "Public read directions" ON directions FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admin manage directions" ON directions FOR ALL TO authenticated USING (
  (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin'
);

-- Courses - Public read
CREATE POLICY "Public read courses" ON courses FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admin manage courses" ON courses FOR ALL TO authenticated USING (
  (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin'
);

-- Semesters - Public read
CREATE POLICY "Public read semesters" ON semesters FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admin manage semesters" ON semesters FOR ALL TO authenticated USING (
  (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin'
);

-- Sessions - Public read
CREATE POLICY "Public read sessions" ON sessions FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admin manage sessions" ON sessions FOR ALL TO authenticated USING (
  (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin'
);

-- Disciplines - Public read
CREATE POLICY "Public read disciplines" ON disciplines FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admin manage disciplines" ON disciplines FOR ALL TO authenticated USING (
  (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) IN ('admin', 'teacher')
);

-- Sections - Public read
CREATE POLICY "Public read sections" ON sections FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admin manage sections" ON sections FOR ALL TO authenticated USING (
  (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) IN ('admin', 'teacher')
);

-- Exams - Public read
CREATE POLICY "Public read exams" ON exams FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admin manage exams" ON exams FOR ALL TO authenticated USING (
  (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) IN ('admin', 'teacher')
);

-- Trash - Admin only
CREATE POLICY "Admin manage trash" ON trash FOR ALL TO authenticated USING (
  (SELECT role FROM users WHERE firebase_uid = auth.uid()::text) = 'admin'
);

-- User Progress - Own read/write
CREATE POLICY "User manage own progress" ON user_progress FOR ALL TO authenticated USING (
  user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- User Achievements - Own read/write
CREATE POLICY "User manage own achievements" ON user_achievements FOR ALL TO authenticated USING (
  user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Move to trash function
CREATE OR REPLACE FUNCTION move_to_trash(
  p_content_type content_type,
  p_content_id uuid,
  p_content_data jsonb DEFAULT '{}'::jsonb,
  p_parent_id uuid DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO trash (content_type, content_id, content_data, parent_id, deleted_by)
  VALUES (p_content_type, p_content_id, p_content_data, p_parent_id, 
    (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore from trash function
CREATE OR REPLACE FUNCTION restore_from_trash(p_trash_id uuid) RETURNS void AS $$
DECLARE
  v_content_type content_type;
  v_content_id uuid;
  v_content_data jsonb;
BEGIN
  SELECT content_type, content_id, content_data INTO v_content_type, v_content_id, v_content_data
  FROM trash WHERE id = p_trash_id;
  
  UPDATE trash SET 
    is_restored = true, 
    restored_at = now(),
    restored_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
  WHERE id = p_trash_id;
  
  RAISE NOTICE 'Restored % with id %', v_content_type, v_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean expired trash (run periodically)
CREATE OR REPLACE FUNCTION clean_expired_trash() RETURNS void AS $$
BEGIN
  DELETE FROM trash WHERE expires_at < now() AND is_restored = false;
END;
$$ LANGUAGE plpgsql;

-- Add XP and update level
CREATE OR REPLACE FUNCTION add_xp(
  p_user_id uuid,
  p_discipline_id uuid DEFAULT NULL,
  p_section_id uuid DEFAULT NULL,
  p_test_set_id uuid DEFAULT NULL,
  p_xp int DEFAULT 10
) RETURNS void AS $$
DECLARE
  v_new_xp int;
  v_new_level int;
BEGIN
  INSERT INTO user_progress (user_id, discipline_id, section_id, test_set_id, xp_points, level)
  VALUES (p_user_id, p_discipline_id, p_section_id, p_test_set_id, p_xp, 1)
  ON CONFLICT (user_id, discipline_id, section_id, test_set_id) 
  DO UPDATE SET 
    xp_points = user_progress.xp_points + p_xp,
    last_activity_at = now();
  
  SELECT xp_points INTO v_new_xp FROM user_progress 
  WHERE user_id = p_user_id AND discipline_id = p_discipline_id;
  
  v_new_level := (v_new_xp / 100) + 1;
  
  UPDATE user_progress SET level = v_new_level WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEEDS (Default data)
-- ============================================================================

-- Insert default direction types
INSERT INTO direction_types (type, name_ru, name_kz, description, icon, color, order_index) VALUES
  ('ent', 'ЕНТ (Школьники)', 'Ұлттық бірыңгай тестілеу', 'Подготовка к Единому Национальному Тестированию', 'graduation-cap', '#f59e0b', 1),
  ('university', 'Университет', 'Университет', 'Учебные курсы и дисциплины', 'university', '#6366f1', 2),
  ('school', 'Школьная программа', 'Мектеп бағдарламасы', 'Школьные предметы и классы', 'school', '#10b981', 3)
ON CONFLICT (type) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_directions_type ON directions(direction_type);
CREATE INDEX IF NOT EXISTS idx_courses_direction ON courses(direction_id);
CREATE INDEX IF NOT EXISTS idx_semesters_course ON semesters(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_semester ON sessions(semester_id);
CREATE INDEX IF NOT EXISTS idx_disciplines_direction ON disciplines(direction_id);
CREATE INDEX IF NOT EXISTS idx_disciplines_semester ON disciplines(semester_id);
CREATE INDEX IF NOT EXISTS idx_sections_discipline ON sections(discipline_id);
CREATE INDEX IF NOT EXISTS idx_sections_parent ON sections(parent_id);
CREATE INDEX IF NOT EXISTS idx_exams_discipline ON exams(discipline_id);
CREATE INDEX IF NOT EXISTS idx_exams_session ON exams(session_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);