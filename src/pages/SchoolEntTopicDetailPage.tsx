import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type Section, type TestSet } from '../lib/supabase';

export default function SchoolEntTopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Section | null>(null);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lecture' | 'test'>('lecture');

  useEffect(() => {
    const fetchData = async () => {
      if (!topicId) return;
      
      const { data: t } = await supabase
        .from('sections')
        .select('*')
        .eq('id', topicId)
        .maybeSingle();
      
      const topicData = t as Section | null;
      setTopic(topicData);
      
      // Fetch test_set by the section's test_set_id
      if (topicData?.test_set_id) {
        const { data: ts } = await supabase
          .from('test_sets')
          .select('*')
          .eq('id', topicData.test_set_id)
          .eq('is_published', true)
          .maybeSingle();
        
        setTestSets(ts ? [ts as TestSet] : []);
      } else {
        setTestSets([]);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [topicId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <main className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Тема не найдена</h3>
            <Link to="/school/ent" className="btn btn-primary">Назад</Link>
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
            <Link to={`/school/ent/${topic.direction_id}`} className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <div>
              <h1 className="page-title">{topic.name}</h1>
              {topic.description && <p className="page-subtitle">{topic.description}</p>}
            </div>
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'lecture' ? 'active' : ''}`}
            onClick={() => setActiveTab('lecture')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Лекция
          </button>
          <button 
            className={`tab ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Тесты {testSets.length > 0 && `(${testSets.length})`}
          </button>
        </div>

        {activeTab === 'lecture' && (
          <div className="lecture-content">
            {topic.lecture_content ? (
              <div className="card" style={{ padding: 32 }}>
                <div style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: topic.lecture_content || '' }} />
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="empty-state-title">Лекция скоро появится</h3>
                <p className="empty-state-description">Материал находится в разработке</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'test' && (
          <div>
            {testSets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="empty-state-title">Нет тестов</h3>
                <p className="empty-state-description">Тесты будут добавлены позже</p>
              </div>
            ) : (
              <div className="tests-grid">
                {testSets.map((test) => (
                  <Link key={test.id} to={`/test/${test.id}`} className="test-card">
                    <div className="test-card-inner">
                      <div className="test-card-header">
                        <h3 className="test-card-title">{test.name}</h3>
                        <span className={`badge ${test.settings.mode === 'exam' ? 'badge-warning' : 'badge-success'}`}>
                          {test.settings.mode === 'exam' ? 'Экзамен' : 'Практика'}
                        </span>
                      </div>
                      <p className="test-card-desc">{test.description}</p>
                      <div className="test-card-meta">
                        <span>{test.question_ids?.length || 0} вопросов</span>
                        <span>Проходной: {test.settings.passing_score_pct}%</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
