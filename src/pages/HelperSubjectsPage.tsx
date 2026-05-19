import { useEffect, useState, type JSX } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase, type Direction, type Section, type TestSet, type HelperArticle } from '../lib/supabase';

const ICONS: Record<string, JSX.Element> = {
  math: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M4 10h16M10 4v16"/></svg>,
  physics: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>,
  chemistry: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v6l-6 8c0 2 2 3 6 3h12c4 0 6-1 6-3l-6-8V2"/><path d="M8 2h8"/></svg>,
  biology: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/></svg>,
  history: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  language: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></svg>,
  book: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  help: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
};

export default function HelperSubjectsPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [direction, setDirection] = useState<Direction | null>(null);
  const [topics, setTopics] = useState<Section[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [articles, setArticles] = useState<HelperArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Section | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return;
      
      const [{ data: dir }, { data: secs }, { data: tests }, { data: arts }] = await Promise.all([
        supabase.from('directions').select('*').eq('id', subjectId).maybeSingle(),
        supabase.from('sections').select('*').or(`direction_id.eq.${subjectId},parent_id.eq.${subjectId}`).eq('is_published', true).order('order_index'),
        supabase.from('test_sets').select('*').or(`direction_id.eq.${subjectId},parent_id.eq.${subjectId}`).eq('is_published', true).order('created_at'),
        supabase.from('helper_articles').select('*').or(`parent_id.eq.${subjectId}`).eq('is_published', true).order('order_index'),
      ]);
      
      setDirection((dir as Direction) || null);
      setTopics((secs as Section[]) || []);
      setTestSets((tests as TestSet[]) || []);
      setArticles((arts as HelperArticle[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [subjectId]);

  const getDirectionIcon = (dir: Direction) => {
    const name = dir.name.toLowerCase();
    if (name.includes('математик')) return ICONS.math;
    if (name.includes('физик')) return ICONS.physics;
    if (name.includes('хим')) return ICONS.chemistry;
    if (name.includes('биолог')) return ICONS.biology;
    if (name.includes('истор')) return ICONS.history;
    if (name.includes('грамотн') || name.includes('язык')) return ICONS.language;
    return ICONS.help;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="subjects-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="subject-skeleton skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!direction) {
    return (
      <main className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Предмет не найден</h3>
            <Link to="/directions/helper" className="btn btn-primary">Назад</Link>
          </div>
        </div>
      </main>
    );
  }

  const icon = getDirectionIcon(direction);
  const gradient = `linear-gradient(135deg, ${direction.color || '#ec4899'}20 0%, ${direction.color || '#ec4899'}10 100%)`;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="subject-card-icon" style={{ color: direction.color || '#ec4899' }}>{icon}</div>
              <div>
                <h1 className="page-title">{direction.name}</h1>
                <p className="page-subtitle">{direction.description}</p>
              </div>
            </div>
          </div>
        </div>

        {topics.length === 0 && articles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет материалов</h3>
            <p className="empty-state-description">Материалы будут добавлены позже</p>
          </div>
        ) : (
          <>
            {topics.length > 0 && (
              <div>
                <h2 className="section-title" style={{ marginBottom: 24 }}>Темы</h2>
                <div className="topics-grid">
                  {topics.map((topic) => (
                    <div 
                      key={topic.id} 
                      className="topic-card"
                      onClick={() => setSelectedTopic(topic)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="topic-card-inner">
                        <div className="topic-card-header" style={{ background: gradient }}>
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="topic-card-body">
                          <h3 className="topic-card-title">{topic.name}</h3>
                          {topic.description && (
                            <p className="topic-card-desc">{topic.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {articles.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <h2 className="section-title" style={{ marginBottom: 24 }}>Статьи</h2>
                <div className="articles-grid">
                  {articles.map((article) => (
                    <Link key={article.id} to={`/helper/${article.id}`} className="article-card">
                      <div className="article-card-inner">
                        <div className="article-card-icon">💡</div>
                        <div className="article-card-body">
                          <h3 className="article-card-title">{article.title}</h3>
                          {article.tags && article.tags.length > 0 && (
                            <div className="article-tags">
                              {article.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="article-tag">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
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
          </>
        )}
      </div>

      {selectedTopic && (
        <div className="modal-overlay" onClick={() => setSelectedTopic(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>{selectedTopic.name}</h3>
              <button className="modal-close" onClick={() => setSelectedTopic(null)}>×</button>
            </div>
            <div className="modal-body">
              {selectedTopic.description && (
                <p style={{ marginBottom: 16, color: 'var(--text-muted)' }}>{selectedTopic.description}</p>
              )}
              {selectedTopic.content && (
                <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16 }}>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{selectedTopic.content}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedTopic(null)}>Закрыть</button>
              <Link 
                to={`/section/${selectedTopic.id}`} 
                className="btn btn-primary"
                onClick={() => setSelectedTopic(null)}
              >
                Открыть
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
