import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type Discipline, type Section, type TestSet } from '../lib/supabase';

export default function SectionsPage() {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!disciplineId) return;
      
      const [{ data: disc }, { data: sects }, { data: tests }] = await Promise.all([
        supabase.from('disciplines').select('*').eq('id', disciplineId).maybeSingle(),
        supabase.from('sections').select('*').eq('discipline_id', disciplineId).eq('is_published', true).order('order_index'),
        supabase.from('test_sets').select('*').eq('discipline_id', disciplineId).eq('is_published', true)
      ]);
      
      setDiscipline((disc as Discipline) || null);
      setSections((sects as Section[]) || []);
      setTestSets((tests as TestSet[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [disciplineId]);

  const topLevelSections = sections.filter(s => !s.parent_id);
  const getChildSections = (parentId: string) => sections.filter(s => s.parent_id === parentId);

  const getTestsForSection = (sectionId: string) => {
    return testSets.filter(t => t.category_id === sectionId);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="skeleton" style={{ height: 200 }} />
        </div>
      </div>
    );
  }

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/courses" className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <div>
              <h1 className="page-title">{discipline?.name || 'Разделы'}</h1>
              <p className="page-subtitle">{discipline?.description || 'Темы и тесты'}</p>
            </div>
          </div>
        </div>

        {sections.length === 0 && testSets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет разделов и тестов</h3>
            <p className="empty-state-description">Добавьте темы и тесты в админ панели</p>
          </div>
        ) : (
          <div className="sections-container">
            {topLevelSections.length > 0 && (
              <div className="sections-section">
                <h2 className="section-title">Темы</h2>
                <div className="sections-list">
                  {topLevelSections.map((section) => {
                    const children = getChildSections(section.id);
                    const tests = getTestsForSection(section.id);
                    
                    return (
                      <div key={section.id} className="section-item">
                        <div className="section-main">
                          <h3 className="section-name">{section.name}</h3>
                          {section.description && (
                            <p className="section-desc">{section.description}</p>
                          )}
                        </div>
                        
                        {children.length > 0 && (
                          <div className="section-children">
                            {children.map(child => (
                              <Link key={child.id} to={`/subjects/${child.id}`} className="section-child">
                                <span>{child.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                        
                        {tests.length > 0 && (
                          <div className="section-tests">
                            {tests.map(test => (
                              <Link key={test.id} to={`/test/${test.id}`} className="section-test-link">
                                <span className="test-name">{test.name}</span>
                                <span className="test-questions">{test.question_ids.length} вопросов</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {testSets.length > 0 && (
              <div className="tests-section">
                <h2 className="section-title">Тесты</h2>
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
                          <span>{test.question_ids.length} вопросов</span>
                          <span>Проходной: {test.settings.passing_score_pct}%</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}