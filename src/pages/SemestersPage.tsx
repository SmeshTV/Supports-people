import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type Course, type Semester, type Session } from '../lib/supabase';

export default function SemestersPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      
      const [{ data: crs }, { data: sem }, { data: ses }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
        supabase.from('semesters').select('*').eq('course_id', courseId).eq('is_active', true).order('order_index'),
        supabase.from('sessions').select('*').order('start_date')
      ]);
      
      setCourse((crs as Course) || null);
      setSemesters((sem as Semester[]) || []);
      setSessions((ses as Session[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [courseId]);

  const getActiveSessions = (semesterId: string) => {
    const sem = semesters.find(s => s.id === semesterId);
    if (!sem) return [];
    return sessions.filter(s => s.semester_id === semesterId && s.is_active);
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
              <h1 className="page-title">{course?.name || 'Семестры'}</h1>
              <p className="page-subtitle">
                {course?.start_date && course?.end_date 
                  ? `${course.start_date} - ${course.end_date}`
                  : 'Выберите семестр'}
              </p>
            </div>
          </div>
        </div>

        {semesters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет семестров</h3>
            <p className="empty-state-description">Добавьте семестры в админ панели</p>
          </div>
        ) : (
          <div className="semesters-grid">
            {semesters.map((semester) => {
              const semSessions = getActiveSessions(semester.id);
              return (
                <Link key={semester.id} to={`/disciplines/${semester.id}`} className="semester-card">
                  <div className="semester-card-inner">
                    <div className="semester-header">
                      <h3 className="semester-name">{semester.name}</h3>
                      <span className="badge badge-success">Активен</span>
                    </div>
                    <div className="semester-dates">
                      {semester.start_date && semester.end_date && (
                        <span>{semester.start_date} — {semester.end_date}</span>
                      )}
                    </div>
                    {semSessions.length > 0 && (
                      <div className="semester-sessions">
                        <span className="sessions-label">Сессии:</span>
                        {semSessions.map(s => (
                          <span key={s.id} className="session-badge">{s.name}</span>
                        ))}
                      </div>
                    )}
                    <div className="semester-action">
                      Открыть дисциплины →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}