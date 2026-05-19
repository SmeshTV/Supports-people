import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client uses anon key (RLS handles permissions)
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type Subject = {
  id: string;
  name: string;
  name_translations?: Record<string, string>;
  description: string;
  description_translations?: Record<string, string>;
  icon: string;
  color: string;
  cover_image_url: string;
  created_by: string | null;
  created_at: string;
  is_published: boolean;
  order_index: number;
};

export type Category = {
  id: string;
  subject_id: string | null;
  parent_id: string | null;
  name: string;
  name_translations?: Record<string, string>;
  description: string;
  description_translations?: Record<string, string>;
  points: number;
  order_index: number;
  created_at: string;
};

export type QuestionOption = {
  id: string;
  text: string;
  text_translations?: Record<string, string>;
  is_correct?: boolean;
};

export type Question = {
  id: string;
  category_id: string | null;
  type: 'single' | 'multiple' | 'truefalse' | 'fill' | 'short_answer' | 'essay' | 'matching' | 'ordering' | 'numeric' | 'dropdown' | 'cloze' | 'hotspot';
  body: { text: string; text_translations?: Record<string, string>; image_url?: string };
  options: QuestionOption[];
  correct_answers: string[];
  correct_text?: string;
  correct_text_translations?: Record<string, string>;
  correct_order?: string[];
  correct_pairs?: { left: string; right: string }[];
  explanation: { text: string; text_translations?: Record<string, string> };
  hint: string;
  hint_translations?: Record<string, string>;
  difficulty: 'easy' | 'medium' | 'hard' | 'unknown';
  points: number;
  time_limit_sec: number | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
};

export type TestSettings = {
  shuffle_questions: boolean;
  shuffle_options: boolean;
  time_limit_sec: number | null;
  passing_score_pct: number;
  show_explanations: 'immediate' | 'end' | 'never';
  allow_retakes: boolean;
  max_retakes: number | null;
  mode: 'practice' | 'exam';
  question_count: number | null;
  difficulty_filter: string | null;
};

export type TestSet = {
  id: string;
  subject_id: string | null;
  category_id?: string | null;
  direction_id?: string | null;
  discipline_id?: string | null;
  course_id?: string | null;
  parent_id?: string | null;
  name: string;
  name_translations?: Record<string, string>;
  description: string;
  description_translations?: Record<string, string>;
  source_description: string;
  source_description_translations?: Record<string, string>;
  settings: TestSettings;
  question_ids: string[];
  created_by: string | null;
  created_at: string;
  is_published: boolean;
};

export type UserAnswer = {
  question_id: string;
  selected_option_ids: string[];
  text_answer?: string;
  order_answer?: string[];
  match_answer?: { left: string; right: string }[];
  is_correct: boolean;
  time_taken_sec: number;
};

export type TestAttempt = {
  id: string;
  user_id: string | null;
  test_set_id: string | null;
  started_at: string;
  finished_at: string | null;
  answers: UserAnswer[];
  score: number;
  max_score: number;
  passed: boolean;
};

export type UserProfile = {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
  last_seen: string;
  preferences: Record<string, unknown>;
};

export type DirectionType = {
  id: string;
  type: 'school' | 'university' | 'helper';
  name_ru: string;
  name_kz: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Legacy types for backward compatibility
export type Semester = {
  id: string;
  course_id: string | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  semester_id: string | null;
  name: string;
  session_type: 'midterm' | 'final' | 'credit';
  start_date: string | null;
  end_date: string | null;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Direction = {
  id: string;
  direction_type: 'school' | 'university' | 'helper';
  name: string;
  name_translations?: Record<string, string>;
  description: string;
  description_translations?: Record<string, string>;
  icon: string;
  color: string;
  parent_id: string | null;
  order_index: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  direction_id: string | null;
  parent_id: string | null;
  name: string;
  name_translations?: Record<string, string>;
  short_name: string;
  short_name_translations?: Record<string, string>;
  order_index: number;
  is_published: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
};

export type Discipline = {
  id: string;
  direction_id: string | null;
  course_id: string | null;
  parent_id: string | null;
  name: string;
  name_translations?: Record<string, string>;
  description: string;
  description_translations?: Record<string, string>;
  order_index: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Attestation = {
  id: string;
  discipline_id: string | null;
  parent_id: string | null;
  name: string;
  name_translations?: Record<string, string>;
  attestation_type: 'attestation1' | 'attestation2' | 'session';
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AttestationExam = {
  id: string;
  attestation_id: string | null;
  parent_id: string | null;
  name: string;
  name_translations?: Record<string, string>;
  exam_type: 'intermediate' | 'midterm' | 'endterm' | 'test';
  description: string;
  description_translations?: Record<string, string>;
  test_set_id: string | null;
  has_lectures: boolean;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Section = {
  id: string;
  discipline_id: string | null;
  direction_id: string | null;
  parent_id: string | null;
  name: string;
  name_translations?: Record<string, string>;
  description: string;
  description_translations?: Record<string, string>;
  content: string;
  content_translations?: Record<string, string>;
  order_index: number;
  is_published: boolean;
  test_set_id: string | null;
  lecture_content: string;
  lecture_content_translations?: Record<string, string>;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type HelperArticle = {
  id: string;
  title: string;
  title_translations?: Record<string, string>;
  content: string;
  content_translations?: Record<string, string>;
  category: string;
  tags: string[];
  parent_id: string | null;
  order_index: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Exam = {
  id: string;
  discipline_id: string | null;
  session_id: string | null;
  name: string;
  description: string;
  exam_date: string | null;
  exam_time: string | null;
  duration_minutes: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TrashItem = {
  id: string;
  content_type: 'subject' | 'direction' | 'course' | 'semester' | 'discipline' | 'section' | 'test_set' | 'question' | 'exam' | 'helper_article' | 'attestation' | 'attestation_exam';
  content_id: string;
  content_data: Record<string, unknown>;
  parent_id: string | null;
  deleted_by: string | null;
  deleted_at: string;
  expires_at: string;
  is_restored: boolean;
  restored_at: string | null;
  restored_by: string | null;
};

export type UserProgress = {
  id: string;
  user_id: string;
  discipline_id: string | null;
  section_id: string | null;
  test_set_id: string | null;
  xp_points: number;
  level: number;
  streak_days: number;
  questions_total: number;
  questions_correct: number;
  tests_completed: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
};

export const TRASH_TABLES: Record<string, string> = {
  direction: 'directions',
  course: 'courses',
  discipline: 'disciplines',
  attestation: 'attestations',
  attestation_exam: 'attestation_exams',
  section: 'sections',
  helper_article: 'helper_articles',
  test_set: 'test_sets',
  question: 'questions',
};

export async function moveToTrash(supabase: any, type: string, id: string, parentId: string | null) {
  const table = TRASH_TABLES[type];
  if (!table) return;

  const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (!data) return;

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('trash').insert({
    content_type: type,
    content_id: id,
    content_data: data,
    parent_id: parentId,
    deleted_at: new Date().toISOString(),
    expires_at: expiresAt,
    is_restored: false,
  });

  await supabase.from(table).delete().eq('id', id);

  // Cascade delete: find all children and move them to trash too
  await cascadeDeleteToTrash(supabase, type, id, expiresAt);
}

async function cascadeDeleteToTrash(supabase: any, parentType: string, parentId: string, expiresAt: string) {
  const childQueries: { type: string; table: string; query: any }[] = [];

  switch (parentType) {
    case 'direction_type':
      childQueries.push({ type: 'direction', table: 'directions', query: supabase.from('directions').select('*').eq('direction_type', parentId) });
      break;
    case 'direction':
      childQueries.push({ type: 'course', table: 'courses', query: supabase.from('courses').select('*').eq('direction_id', parentId) });
      childQueries.push({ type: 'discipline', table: 'disciplines', query: supabase.from('disciplines').select('*').eq('direction_id', parentId) });
      childQueries.push({ type: 'section', table: 'sections', query: supabase.from('sections').select('*').eq('direction_id', parentId) });
      childQueries.push({ type: 'test_set', table: 'test_sets', query: supabase.from('test_sets').select('*').eq('direction_id', parentId) });
      childQueries.push({ type: 'helper_article', table: 'helper_articles', query: supabase.from('helper_articles').select('*').eq('parent_id', parentId) });
      break;
    case 'course':
      childQueries.push({ type: 'discipline', table: 'disciplines', query: supabase.from('disciplines').select('*').eq('course_id', parentId) });
      childQueries.push({ type: 'test_set', table: 'test_sets', query: supabase.from('test_sets').select('*').eq('course_id', parentId) });
      break;
    case 'discipline':
      childQueries.push({ type: 'attestation', table: 'attestations', query: supabase.from('attestations').select('*').eq('discipline_id', parentId) });
      childQueries.push({ type: 'section', table: 'sections', query: supabase.from('sections').select('*').eq('discipline_id', parentId) });
      childQueries.push({ type: 'test_set', table: 'test_sets', query: supabase.from('test_sets').select('*').eq('discipline_id', parentId) });
      break;
    case 'attestation':
      childQueries.push({ type: 'attestation_exam', table: 'attestation_exams', query: supabase.from('attestation_exams').select('*').eq('attestation_id', parentId) });
      childQueries.push({ type: 'test_set', table: 'test_sets', query: supabase.from('test_sets').select('*').eq('parent_id', parentId) });
      childQueries.push({ type: 'section', table: 'sections', query: supabase.from('sections').select('*').eq('parent_id', parentId) });
      break;
    case 'attestation_exam':
      childQueries.push({ type: 'test_set', table: 'test_sets', query: supabase.from('test_sets').select('*').eq('parent_id', parentId) });
      childQueries.push({ type: 'section', table: 'sections', query: supabase.from('sections').select('*').eq('parent_id', parentId) });
      break;
    case 'section':
      childQueries.push({ type: 'section', table: 'sections', query: supabase.from('sections').select('*').eq('parent_id', parentId) });
      childQueries.push({ type: 'test_set', table: 'test_sets', query: supabase.from('test_sets').select('*').eq('section_id', parentId) });
      break;
  }

  // Also check parent_id for all types
  const allChildTables = ['directions', 'courses', 'disciplines', 'attestations', 'attestation_exams', 'sections', 'helper_articles', 'test_sets'];
  const allChildTypes = ['direction', 'course', 'discipline', 'attestation', 'attestation_exam', 'section', 'helper_article', 'test_set'];

  for (let i = 0; i < allChildTables.length; i++) {
    const t = allChildTables[i];
    const tp = allChildTypes[i];
    // Skip if already added above
    const alreadyAdded = childQueries.some(cq => cq.table === t && cq.query.toString().includes(parentId));
    if (!alreadyAdded) {
      childQueries.push({ type: tp, table: t, query: supabase.from(t).select('*').eq('parent_id', parentId) });
    }
  }

  for (const cq of childQueries) {
    const { data: children } = await cq.query;
    if (!children || children.length === 0) continue;

    for (const child of children) {
      // Move child to trash
      await supabase.from('trash').insert({
        content_type: cq.type,
        content_id: child.id,
        content_data: child,
        parent_id: parentId,
        deleted_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_restored: false,
      });

      // Delete child from original table
      await supabase.from(cq.table).delete().eq('id', child.id);

      // Recursively delete children of this child
      await cascadeDeleteToTrash(supabase, cq.type, child.id, expiresAt);
    }
  }
}
