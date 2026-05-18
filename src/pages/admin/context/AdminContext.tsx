import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabaseAdmin, supabase, moveToTrash, type DirectionType, type Direction, type Course, type Discipline, type Attestation, type AttestationExam, type Section, type HelperArticle, type TestSet, type Question } from '../../../lib/supabase';

export type AdminEntity = {
  id: string;
  type: string;
  name: string;
  icon: string;
  parentId: string | null;
  data: any;
  isPublished: boolean;
};

type AdminContextValue = {
  entities: AdminEntity[];
  allTestSets: TestSet[];
  allQuestions: Question[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createEntity: (type: string, parentId: string | null, formData: any) => Promise<boolean>;
  updateEntity: (type: string, id: string, formData: any) => Promise<boolean>;
  deleteEntity: (type: string, id: string, parentId: string | null) => Promise<void>;
  togglePublish: (type: string, id: string, current: boolean) => Promise<void>;
  updateTestQuestions: (testId: string, questionIds: string[]) => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

const TYPE_ICONS: Record<string, string> = {
  direction_type: '📁',
  direction: '📂',
  course: '🎓',
  discipline: '📚',
  attestation: '📋',
  attestation_exam: '📝',
  section: '📄',
  helper_article: '💡',
  test_set: '✅',
};

const TABLE_MAP: Record<string, string> = {
  direction: 'directions',
  course: 'courses',
  discipline: 'disciplines',
  attestation: 'attestations',
  attestation_exam: 'attestation_exams',
  section: 'sections',
  helper_article: 'helper_articles',
  test_set: 'test_sets',
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const [entities, setEntities] = useState<AdminEntity[]>([]);
  const [allTestSets, setAllTestSets] = useState<TestSet[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        { data: dts },
        { data: dirs },
        { data: courses },
        { data: discs },
        { data: atts },
        { data: attExams },
        { data: sections },
        { data: articles },
        { data: tests },
        { data: questions },
      ] = await Promise.all([
        supabaseAdmin.from('direction_types').select('*').order('order_index'),
        supabaseAdmin.from('directions').select('*').order('order_index'),
        supabaseAdmin.from('courses').select('*').order('order_index'),
        supabaseAdmin.from('disciplines').select('*').order('order_index'),
        supabaseAdmin.from('attestations').select('*').order('order_index'),
        supabaseAdmin.from('attestation_exams').select('*').order('order_index'),
        supabaseAdmin.from('sections').select('*').order('order_index'),
        supabaseAdmin.from('helper_articles').select('*').order('order_index'),
        supabaseAdmin.from('test_sets').select('*').order('created_at'),
        supabaseAdmin.from('questions').select('*'),
      ]);

      const directionTypeMap: Record<string, string> = {};
      (dts as DirectionType[] || []).forEach(dt => {
        directionTypeMap[dt.type] = dt.id;
      });

      const result: AdminEntity[] = [];

      (dts as DirectionType[] || []).forEach(dt => {
        result.push({
          id: dt.id,
          type: 'direction_type',
          name: dt.name_ru,
          icon: TYPE_ICONS.direction_type,
          parentId: null,
          data: dt,
          isPublished: true,
        });
      });

      (dirs as Direction[] || []).forEach(dir => {
        result.push({
          id: dir.id,
          type: 'direction',
          name: dir.name,
          icon: TYPE_ICONS.direction,
          parentId: directionTypeMap[dir.direction_type] || null,
          data: dir,
          isPublished: dir.is_published,
        });
      });

      (courses as Course[] || []).forEach(c => {
        result.push({
          id: c.id,
          type: 'course',
          name: c.name,
          icon: TYPE_ICONS.course,
          parentId: c.direction_id,
          data: c,
          isPublished: c.is_published,
        });
      });

      (discs as Discipline[] || []).forEach(d => {
        result.push({
          id: d.id,
          type: 'discipline',
          name: d.name,
          icon: TYPE_ICONS.discipline,
          parentId: d.course_id || d.direction_id,
          data: d,
          isPublished: d.is_published,
        });
      });

      (atts as Attestation[] || []).forEach(a => {
        result.push({
          id: a.id,
          type: 'attestation',
          name: a.name,
          icon: TYPE_ICONS.attestation,
          parentId: a.discipline_id,
          data: a,
          isPublished: a.is_active,
        });
      });

      (attExams as AttestationExam[] || []).forEach(e => {
        result.push({
          id: e.id,
          type: 'attestation_exam',
          name: e.name,
          icon: TYPE_ICONS.attestation_exam,
          parentId: e.attestation_id,
          data: e,
          isPublished: e.is_published,
        });
      });

      (sections as Section[] || []).forEach(s => {
        result.push({
          id: s.id,
          type: 'section',
          name: s.name,
          icon: TYPE_ICONS.section,
          parentId: s.discipline_id || s.direction_id || s.parent_id,
          data: s,
          isPublished: s.is_published,
        });
      });

      (articles as HelperArticle[] || []).forEach(a => {
        result.push({
          id: a.id,
          type: 'helper_article',
          name: a.title,
          icon: TYPE_ICONS.helper_article,
          parentId: a.parent_id,
          data: a,
          isPublished: a.is_published,
        });
      });

      (tests as TestSet[] || []).forEach(t => {
        const tData = t as any;
        result.push({
          id: t.id,
          type: 'test_set',
          name: t.name,
          icon: TYPE_ICONS.test_set,
          parentId: tData.discipline_id || tData.direction_id || tData.category_id || null,
          data: t,
          isPublished: t.is_published,
        });
      });

      setEntities(result);
      setAllTestSets((tests as TestSet[]) || []);
      setAllQuestions((questions as Question[]) || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
      console.error('Admin data load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createEntity = useCallback(async (type: string, _parentId: string | null, formData: any): Promise<boolean> => {
    const table = TABLE_MAP[type];
    if (!table) return false;

    try {
      const { error } = await supabaseAdmin.from(table).insert(formData);
      if (error) throw error;
      await loadData();
      return true;
    } catch (e: any) {
      console.error('Create error:', e);
      return false;
    }
  }, [loadData]);

  const updateEntity = useCallback(async (type: string, id: string, formData: any): Promise<boolean> => {
    const table = TABLE_MAP[type];
    if (!table) return false;

    try {
      const { error } = await supabaseAdmin.from(table).update(formData).eq('id', id);
      if (error) throw error;
      await loadData();
      return true;
    } catch (e: any) {
      console.error('Update error:', e);
      return false;
    }
  }, [loadData]);

  const deleteEntity = useCallback(async (type: string, id: string, parentId: string | null) => {
    await moveToTrash(supabase, type, id, parentId);
    await loadData();
  }, [loadData]);

  const togglePublish = useCallback(async (type: string, id: string, current: boolean) => {
    const table = TABLE_MAP[type];
    if (!table) return;

    const field = type === 'attestation' ? 'is_active' : 'is_published';
    await supabaseAdmin.from(table).update({ [field]: !current }).eq('id', id);
    await loadData();
  }, [loadData]);

  const updateTestQuestions = useCallback(async (testId: string, questionIds: string[]) => {
    await supabaseAdmin.from('test_sets').update({ question_ids: questionIds }).eq('id', testId);
    await loadData();
  }, [loadData]);

  return (
    <AdminContext.Provider value={{
      entities,
      allTestSets,
      allQuestions,
      loading,
      error,
      refresh: loadData,
      createEntity,
      updateEntity,
      deleteEntity,
      togglePublish,
      updateTestQuestions,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdminData must be used within AdminProvider');
  return ctx;
}
