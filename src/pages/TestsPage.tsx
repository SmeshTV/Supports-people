import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type TestSet } from '../lib/supabase';

export default function TestsPage() {
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'practice' | 'exam'>('all');

  useEffect(() => {
    const fetchTests = async () => {
      const { data } = await supabase
        .from('test_sets')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      setTestSets((data as TestSet[]) || []);
      setLoading(false);
    };
    fetchTests();
  }, []);

  const filteredTests = testSets.filter(ts => {
    if (filter === 'all') return true;
    return ts.settings?.mode === filter;
  });

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Все тесты</h1>
          <p className="page-subtitle">Выберите тест для прохождения</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter('all')}
          >
            Все ({testSets.length})
          </button>
          <button
            className={`btn ${filter === 'practice' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter('practice')}
          >
            Практика ({testSets.filter(t => t.settings?.mode === 'practice').length})
          </button>
          <button
            className={`btn ${filter === 'exam' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter('exam')}
          >
            Экзамен ({testSets.filter(t => t.settings?.mode === 'exam').length})
          </button>
        </div>

        {filteredTests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет тестов</h3>
            <p className="empty-state-description">Тесты появятся здесь позже</p>
          </div>
        ) : (
          <div className="tests-grid">
            {filteredTests.map((test) => (
              <Link key={test.id} to={`/test/${test.id}`} className="test-card">
                <div className="test-card-inner">
                  <div className="test-card-header">
                    <div>
                      <h3 className="test-card-title">{test.name}</h3>
                      <p className="test-card-desc">{test.description || 'Тест без описания'}</p>
                    </div>
                    <span className={`badge ${test.settings?.mode === 'exam' ? 'badge-warning' : 'badge-success'}`}>
                      {test.settings?.mode === 'exam' ? 'Экзамен' : 'Практика'}
                    </span>
                  </div>
                  <div className="test-card-meta">
                    <span>{test.question_ids?.length || 0} вопросов</span>
                    <span>Проходной: {test.settings?.passing_score_pct || 70}%</span>
                  </div>
                  <div className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Начать тест</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
