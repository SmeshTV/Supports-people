-- ============================================================================
-- PrepIQ Restructured LMS - School & University
-- Created: 2026-05-18
-- ============================================================================

-- Drop old types and tables with CASCADE
DROP TYPE IF EXISTS direction_type CASCADE;
DROP TYPE IF EXISTS session_type CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS attestation_type CASCADE;
DROP TYPE IF EXISTS attestation_exam_type CASCADE;

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Only 2 direction types: school, university
CREATE TYPE direction_type AS ENUM ('school', 'university');

-- Type of exam session
CREATE TYPE session_type AS ENUM ('midterm', 'final', 'credit');

-- Type of content item (for trash)
CREATE TYPE content_type AS ENUM (
  'subject', 'direction', 'course', 'semester', 
  'discipline', 'section', 'test_set', 'question', 'exam',
  'helper_article', 'attestation', 'attestation_exam'
);

-- Type of attestation
CREATE TYPE attestation_type AS ENUM ('attestation1', 'attestation2', 'session');

-- Type of exam within attestation
CREATE TYPE attestation_exam_type AS ENUM ('intermediate', 'midterm', 'endterm', 'test');

-- ============================================================================
-- DROP OLD TABLES
-- ============================================================================

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
DROP TABLE IF EXISTS helper_articles CASCADE;
DROP TABLE IF EXISTS attestations CASCADE;
DROP TABLE IF EXISTS attestation_exams CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Direction Types: Школа, Университет
CREATE TABLE direction_types (
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

-- Directions: For school = ENT subjects; For university = programs
CREATE TABLE directions (
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

-- Courses: 1-4 курс for university
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction_id uuid REFERENCES directions(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_name text DEFAULT '',
  order_index int DEFAULT 1,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disciplines: subjects within courses
CREATE TABLE disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction_id uuid REFERENCES directions(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  order_index int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attestations: Аттестация 1, Аттестация 2, Сессия
CREATE TABLE attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id uuid REFERENCES disciplines(id) ON DELETE CASCADE,
  name text NOT NULL,
  attestation_type attestation_type NOT NULL,
  order_index int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attestation Exams: Промежуточный экзамен, Midterm, Endterm, Тест
CREATE TABLE attestation_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attestation_id uuid REFERENCES attestations(id) ON DELETE CASCADE,
  name text NOT NULL,
  exam_type attestation_exam_type NOT NULL,
  description text DEFAULT '',
  test_set_id uuid,
  has_lectures boolean DEFAULT false,
  order_index int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sections/Themes: topics within ENT subjects or disciplines
CREATE TABLE sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id uuid REFERENCES disciplines(id) ON DELETE CASCADE,
  direction_id uuid REFERENCES directions(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  content text DEFAULT '',
  order_index int DEFAULT 0,
  is_published boolean DEFAULT true,
  test_set_id uuid,
  lecture_content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Helper Articles: вспомогательные статьи для школы
CREATE TABLE helper_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text DEFAULT '',
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  order_index int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Exams (legacy compatibility)
CREATE TABLE exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id uuid REFERENCES disciplines(id) ON DELETE CASCADE,
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

-- Add type columns to existing tables
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS direction_type direction_type DEFAULT 'school';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS direction_id uuid;
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS direction_id uuid;
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS discipline_id uuid;
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS section_id uuid;

-- ============================================================================
-- TRASH SYSTEM
-- ============================================================================

CREATE TABLE trash (
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

CREATE INDEX idx_trash_expires ON trash(expires_at) WHERE is_restored = false;
CREATE INDEX idx_trash_content ON trash(content_type, content_id);

-- ============================================================================
-- STATISTICS & ANALYTICS
-- ============================================================================

CREATE TABLE user_progress (
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

CREATE TABLE user_achievements (
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
-- RLS POLICIES - DISABLE ALL FOR ADMIN ACCESS
-- ============================================================================

ALTER TABLE direction_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE directions DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines DISABLE ROW LEVEL SECURITY;
ALTER TABLE attestations DISABLE ROW LEVEL SECURITY;
ALTER TABLE attestation_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE helper_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE trash DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Direction Types
INSERT INTO direction_types (type, name_ru, name_kz, description, icon, color, order_index) VALUES
  ('school', 'Школа', 'Мектеп', 'ЕНТ и вспомогательные материалы для школьников', 'school', '#10b981', 1),
  ('university', 'Университет', 'Университет', 'Учебные курсы и дисциплины', 'university', '#6366f1', 2)
ON CONFLICT (type) DO NOTHING;

-- School Directions (ENT Subjects)
INSERT INTO directions (direction_type, name, description, icon, color, order_index) VALUES
  ('school', 'Математика', 'Математика ЕНТ - алгебра, геометрия, тригонометрия', 'math', '#f59e0b', 1),
  ('school', 'Физика', 'Физика ЕНТ - механика, оптика, электричество', 'physics', '#3b82f6', 2),
  ('school', 'Химия', 'Химия ЕНТ - органическая, неорганическая', 'chemistry', '#ef4444', 3),
  ('school', 'Биология', 'Биология ЕНТ - ботаника, зоология, генетика', 'biology', '#22c55e', 4),
  ('school', 'История Казахстана', 'История Казахстана ЕНТ', 'history', '#a855f7', 5),
  ('school', 'Грамотность', 'Читаемая грамотность ЕНТ', 'language', '#ec4899', 6)
ON CONFLICT DO NOTHING;

-- Helper Articles
INSERT INTO helper_articles (title, content, category, tags, order_index) VALUES
  ('Как готовиться к ЕНТ', '1. Составьте план подготовки\n2. Решайте тесты каждый день\n3. Повторяйте сложные темы\n4. Отдыхайте перед экзаменом', 'preparation', '{ент,подготовка,советы}', 1),
  ('Лайфхаки для учёбы', '1. Используйте метод Помодоро (25 мин учёбы, 5 мин отдых)\n2. Делайте конспекты от руки\n3. Объясняйте материал другим\n4. Спите минимум 8 часов', 'lifehacks', '{лайфхаки,учёба,эффективность}', 2),
  ('Как решать тесты быстрее', '1. Читайте вопрос внимательно\n2. Исключайте явно неправильные ответы\n3. Не задерживайтесь на одном вопросе\n4. Возвращайтесь к сложным в конце', 'tips', '{тесты,скорость,ент}', 3),
  ('Частые вопросы об ЕНТ', 'В: Сколько баллов нужно для гранта?\nО: Зависит от специальности, обычно от 90+\n\nВ: Можно ли пересдать ЕНТ?\nО: Да, один раз в год', 'faq', '{вопросы,ент,грант}', 4)
ON CONFLICT DO NOTHING;

-- University Direction
INSERT INTO directions (direction_type, name, description, icon, color, order_index) VALUES
  ('university', 'Информационные технологии', 'Программирование и IT', 'info', '#6366f1', 1),
  ('university', 'Математика', 'Прикладная математика', 'math', '#f59e0b', 2)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_directions_type ON directions(direction_type);
CREATE INDEX idx_courses_direction ON courses(direction_id);
CREATE INDEX idx_disciplines_direction ON disciplines(direction_id);
CREATE INDEX idx_disciplines_course ON disciplines(course_id);
CREATE INDEX idx_attestations_discipline ON attestations(discipline_id);
CREATE INDEX idx_attestation_exams_attestation ON attestation_exams(attestation_id);
CREATE INDEX idx_sections_discipline ON sections(discipline_id);
CREATE INDEX idx_sections_direction ON sections(direction_id);
CREATE INDEX idx_sections_parent ON sections(parent_id);
CREATE INDEX idx_exams_discipline ON exams(discipline_id);
CREATE INDEX idx_helper_articles_published ON helper_articles(is_published);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
