import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type Discipline, type Exam, type Session } from '../lib/supabase';

export default function ExamsPage() {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!disciplineId) {
        const { data } = await supabase
          .from('exams')
          .select('*')
          .eq('is_published', true)
          .order('exam_date');
        setExams((data as Exam[]) || []);
        setLoading(false);
        return;
      }
      
      const [{ data: disc }, { data: ex }, { data: ses }] = await Promise.all([
        supabase.from('disciplines').select('*').eq('id', disciplineId).maybeSingle(),
        supabase.from('exams').select('*').eq('discipline_id', disciplineId).eq('is_published', true).order('exam_date'),
        supabase.from('sessions').select('*').order('start_date')
      ]);
      
      setDiscipline((disc as Discipline) || null);
      setExams((ex as Exam[]) || []);
      setSessions((ses as Session[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [disciplineId]);

  const getSessionName = (sessionId: string | null) => {
    if (!sessionId) return null;
    const session = sessions.find(s => s.id === sessionId);
    return session?.name;
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    const examDate = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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

  const upcomingExams = exams.filter(e => e.exam_date && new Date(e.exam_date) >= new Date());
  const pastExams = exams.filter(e => e.exam_date && new Date(e.exam_date) < new Date());

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
              <h1 className="page-title">{discipline?.name ? `Экзамены: ${discipline.name}` : 'Экзамены'}</h1>
              <p className="page-subtitle">Расписание экзаменов и подготовка</p>
            </div>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет экзаменов</h3>
            <p className="empty-state-description">Добавьте экзамены в админ панели</p>
          </div>
        ) : (
          <div className="exams-container">
            {upcomingExams.length > 0 && (
              <div className="exams-section">
                <h2 className="section-title">Предстоящие экзамены</h2>
                <div className="exams-list">
                  {upcomingExams.map((exam) => {
                    const daysUntil = getDaysUntil(exam.exam_date);
                    const sessionName = getSessionName(exam.session_id);
                    
                    return (
                      <div key={exam.id} className="exam-card">
                        <div className="exam-date-badge">
                          <span className="exam-day">{exam.exam_date ? new Date(exam.exam_date).getDate() : '?'}</span>
                          <span className="exam-month">{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('ru-RU', { month: 'short' }) : ''}</span>
                        </div>
                        <div className="exam-info">
                          <h3 className="exam-name">{exam.name}</h3>
                          <p className="exam-desc">{exam.description}</p>
                          <div className="exam-meta">
                            {sessionName && <span className="badge">{sessionName}</span>}
                            <span className="exam-time">
                              {formatTime(exam.exam_time)} • {exam.duration_minutes} мин
                            </span>
                          </div>
                        </div>
                        <div className="exam-countdown">
                          {daysUntil !== null && (
                            <>
                              <span className={`countdown-days ${daysUntil <= 7 ? 'urgent' : ''}`}>
                                {daysUntil}
                              </span>
                              <span className="countdown-label">дней</span>
                            </>
                          )}
                        </div>
                        <Link to={`/test/${exam.id}`} className="btn btn-primary btn-sm">
                          Подготовка
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pastExams.length > 0 && (
              <div className="exams-section past-exams">
                <h2 className="section-title">Прошедшие экзамены</h2>
                <div className="exams-list">
                  {pastExams.map((exam) => {
                    const sessionName = getSessionName(exam.session_id);
                    
                    return (
                      <div key={exam.id} className="exam-card past">
                        <div className="exam-date-badge">
                          <span className="exam-day">{exam.exam_date ? new Date(exam.exam_date).getDate() : '?'}</span>
                          <span className="exam-month">{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('ru-RU', { month: 'short' }) : ''}</span>
                        </div>
                        <div className="exam-info">
                          <h3 className="exam-name">{exam.name}</h3>
                          <p className="exam-desc">{exam.description}</p>
                          <div className="exam-meta">
                            {sessionName && <span className="badge">{sessionName}</span>}
                            <span className="exam-time">{exam.duration_minutes} мин</span>
                          </div>
                        </div>
                        <Link to={`/test/${exam.id}`} className="btn btn-secondary btn-sm">
                          Повторить
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}