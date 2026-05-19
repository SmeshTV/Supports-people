import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type Attestation, type AttestationExam, type TestSet, type Section } from '../lib/supabase';

const EXAM_TYPE_NAMES: Record<string, string> = {
  intermediate: 'Промежуточный экзамен',
  midterm: 'Midterm',
  endterm: 'Endterm',
  test: 'Тест',
};

export default function UniversityExamPage() {
  const { attestationId } = useParams<{ attestationId: string }>();
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [exams, setExams] = useState<AttestationExam[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<AttestationExam | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!attestationId) return;
      
      const [{ data: att }, { data: ex }, { data: tests }, { data: sects }] = await Promise.all([
        supabase.from('attestations').select('*').eq('id', attestationId).maybeSingle(),
        supabase.from('attestation_exams').select('*').eq('attestation_id', attestationId).eq('is_published', true).order('order_index'),
        supabase.from('test_sets').select('*').or(`attestation_id.eq.${attestationId},parent_id.eq.${attestationId}`).eq('is_published', true).order('created_at'),
        supabase.from('sections').select('*').eq('parent_id', attestationId).eq('is_published', true).order('order_index'),
      ]);
      
      setAttestation((att as Attestation) || null);
      setExams((ex as AttestationExam[]) || []);
      setTestSets((tests as TestSet[]) || []);
      setSections((sects as Section[]) || []);
      
      setLoading(false);
    };
    fetchData();
  }, [attestationId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  if (!attestation) {
    return (
      <main className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Аттестация не найдена</h3>
            <Link to="/university/courses" className="btn btn-primary">Назад</Link>
          </div>
        </div>
      </main>
    );
  }

  const filteredExams = activeTab === 'all' 
    ? exams 
    : exams.filter(e => e.exam_type === activeTab);

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/university/courses" className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <div>
              <h1 className="page-title">{attestation.name}</h1>
              <p className="page-subtitle">Экзамены и тесты</p>
            </div>
          </div>
        </div>

        {exams.length > 1 && (
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Все
            </button>
            {Array.from(new Set(exams.map(e => e.exam_type))).map(type => (
              <button 
                key={type}
                className={`tab ${activeTab === type ? 'active' : ''}`}
                onClick={() => setActiveTab(type)}
              >
                {EXAM_TYPE_NAMES[type] || type}
              </button>
            ))}
          </div>
        )}

        {filteredExams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет экзаменов</h3>
            <p className="empty-state-description">Экзамены будут добавлены позже</p>
          </div>
        ) : (
          <div className="exams-list">
            {filteredExams.map((exam) => (
              <div key={exam.id} className="exam-item">
                <div className="exam-item-info">
                  <h3 className="exam-item-name">{exam.name}</h3>
                  {exam.description && <p className="exam-item-desc">{exam.description}</p>}
                  <div className="exam-item-meta">
                    <span className="badge">{EXAM_TYPE_NAMES[exam.exam_type]}</span>
                    {exam.has_lectures && <span className="badge badge-info">Есть лекции</span>}
                    {exam.test_set_id && <span className="badge badge-success">Есть тест</span>}
                  </div>
                </div>
                <div className="exam-item-actions">
                  {exam.has_lectures && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedExam(exam)}
                    >
                      Лекции
                    </button>
                  )}
                  {exam.test_set_id && (
                    <Link to={`/test/${exam.test_set_id}`} className="btn btn-primary btn-sm">
                      Начать тест
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {sections.length > 0 && (
          <div style={{ marginTop: 48 }}>
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
          <div style={{ marginTop: 48 }}>
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
      </div>

      {selectedExam && (
        <div className="modal-overlay" onClick={() => setSelectedExam(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>{selectedExam.name} - Лекции</h3>
              <button className="modal-close" onClick={() => setSelectedExam(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="lecture-content" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                <p>Лекционный материал для "{selectedExam.name}"</p>
                <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>
                  Здесь будет размещён лекционный материал с объяснением темы.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedExam(null)}>Закрыть</button>
              {selectedExam.test_set_id && (
                <Link to={`/test/${selectedExam.test_set_id}`} className="btn btn-primary">
                  Начать тест
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
