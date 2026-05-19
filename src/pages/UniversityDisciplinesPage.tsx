import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type Course, type Discipline, type TestSet } from '../lib/supabase';

export default function UniversityDisciplinesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      
      const [{ data: crs }, { data: discs }, { data: tests }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
        supabase.from('disciplines').select('*').or(`course_id.eq.${courseId},parent_id.eq.${courseId}`).eq('is_published', true).order('order_index'),
        supabase.from('test_sets').select('*').or(`course_id.eq.${courseId},parent_id.eq.${courseId}`).eq('is_published', true).order('created_at')
      ]);
      
      setCourse((crs as Course) || null);
      setDisciplines((discs as Discipline[]) || []);
      setTestSets((tests as TestSet[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [courseId]);

  const filteredDisciplines = disciplines.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="skeleton" style={{ height: 200 }} />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <main className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Курс не найден</h3>
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
            <Link to="/university/courses" className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <div>
              <h1 className="page-title">{course.name}</h1>
              <p className="page-subtitle">Дисциплины курса</p>
            </div>
          </div>
        </div>

        <div className="search-box">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Поиск дисциплин..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredDisciplines.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет дисциплин</h3>
            <p className="empty-state-description">Дисциплины будут добавлены позже</p>
          </div>
        ) : (
          <div className="disciplines-grid">
            {filteredDisciplines.map((disc) => (
              <Link key={disc.id} to={`/university/attestations/${disc.id}`} className="discipline-card">
                <div className="discipline-card-inner">
                  <div className="discipline-icon">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="discipline-name">{disc.name}</h3>
                  <p className="discipline-desc">{disc.description || 'Дисциплина'}</p>
                </div>
              </Link>
              ))}
          </div>
        )}

        {testSets.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Тесты курса</h2>
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
    </main>
  );
}
