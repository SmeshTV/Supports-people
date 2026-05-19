import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type AttestationExam, type TestSet, type Section } from '../lib/supabase';

const EXAM_TYPE_NAMES: Record<string, string> = {
  intermediate: 'Промежуточный экзамен',
  midterm: 'Midterm',
  endterm: 'Endterm',
  test: 'Тест',
};

export default function UniversityExamDetailPage() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<AttestationExam | null>(null);
  const [linkedTest, setLinkedTest] = useState<TestSet | null>(null);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!examId) return;
      
      const [{ data: ex }, { data: tests }, { data: sects }] = await Promise.all([
        supabase.from('attestation_exams').select('*').eq('id', examId).maybeSingle(),
        supabase.from('test_sets').select('*').eq('parent_id', examId).eq('is_published', true).order('created_at'),
        supabase.from('sections').select('*').eq('parent_id', examId).eq('is_published', true).order('order_index'),
      ]);
      
      const examData = ex as AttestationExam;
      setExam(examData || null);

      if (examData?.test_set_id) {
        const { data: ts } = await supabase.from('test_sets').select('*').eq('id', examData.test_set_id).maybeSingle();
        setLinkedTest(ts as TestSet);
      }
      
      setTestSets((tests as TestSet[]) || []);
      setSections((sects as Section[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [examId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <main className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Экзамен не найден</h3>
            <Link to="/university/courses" className="btn btn-primary">Назад</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => history.back()} className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>
            <div>
              <h1 className="page-title">{exam.name}</h1>
              <p className="page-subtitle">{EXAM_TYPE_NAMES[exam.exam_type] || exam.exam_type}</p>
            </div>
          </div>
        </div>

        {exam.description && (
          <div className="card" style={{ padding: 24, marginBottom: 32 }}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{exam.description}</p>
          </div>
        )}

        {linkedTest && (
          <div className="card" style={{ padding: 24, marginBottom: 32, borderLeft: '4px solid var(--primary, #6366f1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px' }}>📎 Привязанный тест</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{linkedTest.name}</p>
                <div style={{ marginTop: 8 }}>
                  <span className="badge">{linkedTest.question_ids?.length || 0} вопросов</span>
                  <span className={`badge ${linkedTest.settings?.mode === 'exam' ? 'badge-warning' : 'badge-success'}`}>
                    {linkedTest.settings?.mode === 'exam' ? 'Экзамен' : 'Практика'}
                  </span>
                </div>
              </div>
              <Link to={`/test/${linkedTest.id}`} className="btn btn-primary">
                Начать тест
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {sections.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Темы</h2>
            <div className="tests-grid">
              {sections.map((s) => (
                <Link key={s.id} to={`/section/${s.id}`} className="test-card">
                  <div className="test-card-inner">
                    <div className="test-card-header">
                      <div>
                        <h3 className="test-card-title">{s.name}</h3>
                        <p className="test-card-desc">{s.description || 'Тема без описания'}</p>
                      </div>
                    </div>
                    <div className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Открыть тему</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {testSets.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Тесты</h2>
            <div className="tests-grid">
              {testSets.map((ts) => (
                <Link key={ts.id} to={`/test/${ts.id}`} className="test-card">
                  <div className="test-card-inner">
                    <div className="test-card-header">
                      <div>
                        <h3 className="test-card-title">{ts.name}</h3>
                        <p className="test-card-desc">{ts.description || 'Тест без описания'}</p>
                      </div>
                      <span className={`badge ${ts.settings?.mode === 'exam' ? 'badge-warning' : 'badge-success'}`}>
                        {ts.settings?.mode === 'exam' ? 'Экзамен' : 'Практика'}
                      </span>
                    </div>
                    <div className="test-card-meta">
                      <span>{ts.question_ids?.length || 0} вопросов</span>
                      <span>Проходной: {ts.settings?.passing_score_pct || 70}%</span>
                    </div>
                    <div className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Начать тест</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {sections.length === 0 && testSets.length === 0 && !linkedTest && (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3 className="empty-state-title">Пока пусто</h3>
            <p className="empty-state-description">Темы и тесты появятся здесь позже</p>
          </div>
        )}
      </div>
    </main>
  );
}
