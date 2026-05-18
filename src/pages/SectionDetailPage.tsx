import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase, type Section, type TestSet } from '../lib/supabase';

export default function SectionDetailPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section | null>(null);
  const [testSet, setTestSet] = useState<TestSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lecture' | 'content'>('lecture');

  useEffect(() => {
    const fetchData = async () => {
      if (!sectionId) return;

      const { data: sect } = await supabase
        .from('sections')
        .select('*')
        .eq('id', sectionId)
        .maybeSingle();

      if (!sect) {
        setLoading(false);
        return;
      }

      const sectionData = sect as Section;
      setSection(sectionData);

      if (sectionData.test_set_id) {
        const { data: ts } = await supabase
          .from('test_sets')
          .select('*')
          .eq('id', sectionData.test_set_id)
          .maybeSingle();
        setTestSet(ts as TestSet);
      }

      setLoading(false);
    };
    fetchData();
  }, [sectionId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="skeleton" style={{ height: 400 }} />
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <main className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Тема не найдена</h3>
            <Link to="/" className="btn btn-primary">На главную</Link>
          </div>
        </div>
      </main>
    );
  }

  const hasLecture = section.lecture_content && section.lecture_content.length > 10;
  const hasContent = section.content && section.content.length > 10;

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>
            <div>
              <h1 className="page-title">{section.name}</h1>
              {section.description && <p className="page-subtitle">{section.description}</p>}
            </div>
          </div>
        </div>

        {(hasLecture || hasContent) && (
          <div className="section-tabs">
            {hasLecture && (
              <button
                className={`section-tab-btn ${activeTab === 'lecture' ? 'active' : ''}`}
                onClick={() => setActiveTab('lecture')}
              >
                📖 Лекция
              </button>
            )}
            {hasContent && (
              <button
                className={`section-tab-btn ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                📝 Содержание
              </button>
            )}
          </div>
        )}

        <div className="section-content-card card">
          {activeTab === 'lecture' && hasLecture && (
            <div
              className="rich-text-render"
              dangerouslySetInnerHTML={{ __html: section.lecture_content! }}
            />
          )}
          {activeTab === 'content' && hasContent && (
            <div
              className="rich-text-render"
              dangerouslySetInnerHTML={{ __html: section.content! }}
            />
          )}
          {!hasLecture && !hasContent && (
            <div className="empty-state">
              <h3 className="empty-state-title">Материал ещё не добавлен</h3>
              <p className="empty-state-description">Лекция появится здесь позже</p>
            </div>
          )}
        </div>

        {testSet && (
          <div className="section-test-cta">
            <div className="section-test-cta-card">
              <div className="section-test-cta-icon">✅</div>
              <div className="section-test-cta-body">
                <h3>{testSet.name}</h3>
                <p>{testSet.description || `Тест из ${testSet.question_ids?.length || 0} вопросов`}</p>
                <div className="section-test-cta-meta">
                  <span className="badge">{testSet.question_ids?.length || 0} вопросов</span>
                  <span className={`badge ${testSet.settings?.mode === 'exam' ? 'badge-warning' : 'badge-success'}`}>
                    {testSet.settings?.mode === 'exam' ? 'Экзамен' : 'Практика'}
                  </span>
                  <span className="badge badge-info">Проходной: {testSet.settings?.passing_score_pct || 70}%</span>
                </div>
              </div>
              <Link to={`/test/${testSet.id}`} className="btn btn-primary btn-lg">
                Начать тест
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
