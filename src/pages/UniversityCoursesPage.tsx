import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type Course, type TestSet } from '../lib/supabase';

export default function UniversityCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: coursesData }, { data: testsData }] = await Promise.all([
        supabase.from('courses').select('*').eq('is_published', true).order('order_index'),
        supabase.from('test_sets').select('*').eq('is_published', true).order('created_at')
      ]);
      
      setCourses((coursesData as Course[]) || []);
      setTestSets((testsData as TestSet[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

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

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/directions/university" className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <div>
              <h1 className="page-title">Курсы университета</h1>
              <p className="page-subtitle">Выберите курс обучения</p>
            </div>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет курсов</h3>
            <p className="empty-state-description">Курсы будут добавлены в админ панели</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <Link key={course.id} to={`/university/disciplines/${course.id}`} className="course-card">
                <div className="course-card-inner">
                  <div className="course-number">{course.order_index}</div>
                  <h3 className="course-name">{course.name}</h3>
                  <p className="course-desc">{course.short_name || `Курс ${course.order_index}`}</p>
                </div>
              </Link>
              ))}
          </div>
        )}

        {testSets.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Все тесты университета</h2>
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
