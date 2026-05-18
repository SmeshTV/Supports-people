import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseAdmin, type Course, type Semester, type Session } from '../../lib/supabase';

export default function AdminSemesters() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [semesterForm, setSemesterForm] = useState({ name: '', start_date: '', end_date: '', order_index: 1 });
  const [sessionForm, setSessionForm] = useState({ name: '', session_type: 'final' as 'midterm' | 'final' | 'credit', start_date: '', end_date: '' });

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    if (!courseId) return;
    const [{ data: crs }, { data: sem }, { data: ses }] = await Promise.all([
      supabaseAdmin.from('courses').select('*').eq('id', courseId).maybeSingle(),
      supabaseAdmin.from('semesters').select('*').eq('course_id', courseId).order('order_index'),
      supabaseAdmin.from('sessions').select('*').order('start_date')
    ]);
    setCourse((crs as Course) || null);
    setSemesters((sem as Semester[]) || []);
    setSessions((ses as Session[]) || []);
    setLoading(false);
  };

  const handleSaveSemester = async () => {
    if (!semesterForm.name.trim()) return;

    if (editingSemester) {
      await supabaseAdmin.from('semesters').update(semesterForm).eq('id', editingSemester.id);
    } else {
      await supabaseAdmin.from('semesters').insert({ ...semesterForm, course_id: courseId });
    }

    setShowSemesterModal(false);
    setEditingSemester(null);
    setSemesterForm({ name: '', start_date: '', end_date: '', order_index: semesters.length + 1 });
    fetchData();
  };

  const handleDeleteSemester = async (id: string) => {
    if (!confirm('Удалить семестр? Все дисциплины удалятся.')) return;
    await supabaseAdmin.from('semesters').delete().eq('id', id);
    fetchData();
  };

  const handleSaveSession = async () => {
    if (!sessionForm.name.trim() || !selectedSemesterId) return;
    await supabaseAdmin.from('sessions').insert({ ...sessionForm, semester_id: selectedSemesterId });
    setShowSessionModal(false);
    setSessionForm({ name: '', session_type: 'final', start_date: '', end_date: '' });
    setSelectedSemesterId(null);
    fetchData();
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Удалить сессию?')) return;
    await supabaseAdmin.from('sessions').delete().eq('id', id);
    fetchData();
  };

  const getSessionsForSemester = (semesterId: string) => sessions.filter(s => s.semester_id === semesterId);

  if (loading) {
    return <div className="skeleton" style={{ height: 200 }} />;
  }

  return (
    <div>
      <div className="admin-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/admin/directions" className="btn btn-ghost btn-sm">← Назад</Link>
          <div>
            <h2>Семестры: {course?.name}</h2>
            <p className="text-muted">Семестры и экзаменационные сессии</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingSemester(null); setSemesterForm({ name: '', start_date: '', end_date: '', order_index: semesters.length + 1 }); setShowSemesterModal(true); }}>
          + Добавить семестр
        </button>
      </div>

      <div className="admin-semesters-list">
        {semesters.map(semester => {
          const semSessions = getSessionsForSemester(semester.id);
          return (
            <div key={semester.id} className="admin-semester-card">
              <div className="admin-semester-header">
                <div>
                  <h3>{semester.name}</h3>
                  <p className="text-muted">{semester.start_date} — {semester.end_date || 'не задано'}</p>
                </div>
                <div className="admin-semester-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditingSemester(semester); setSemesterForm({ name: semester.name, start_date: semester.start_date || '', end_date: semester.end_date || '', order_index: semester.order_index }); setShowSemesterModal(true); }}>✏️</button>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => handleDeleteSemester(semester.id)}>🗑️</button>
                </div>
              </div>

              <div className="admin-sessions">
                <div className="admin-sessions-header">
                  <span>Сессии</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedSemesterId(semester.id); setShowSessionModal(true); }}>+ Сессия</button>
                </div>
                {semSessions.length > 0 ? (
                  <div className="admin-sessions-list">
                    {semSessions.map(session => (
                      <div key={session.id} className="admin-session-item">
                        <div>
                          <span className="session-name">{session.name}</span>
                          <span className="session-type badge">{session.session_type}</span>
                        </div>
                        <button className="btn btn-ghost btn-sm danger" onClick={() => handleDeleteSession(session.id)}>×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted" style={{ padding: '8px', fontSize: 14 }}>Нет сессий</p>
                )}
              </div>
            </div>
          );
        })}
        {semesters.length === 0 && <div className="empty-state"><p>Нет семестров</p></div>}
      </div>

      {showSemesterModal && (
        <div className="modal-overlay" onClick={() => setShowSemesterModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSemester ? 'Редактировать' : 'Добавить'} семестр</h3>
              <button className="modal-close" onClick={() => setShowSemesterModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название</label>
                <input type="text" value={semesterForm.name} onChange={e => setSemesterForm({ ...semesterForm, name: e.target.value })} placeholder="Например: Осень 2025" />
              </div>
              <div className="form-group">
                <label>Дата начала</label>
                <input type="date" value={semesterForm.start_date} onChange={e => setSemesterForm({ ...semesterForm, start_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Дата окончания</label>
                <input type="date" value={semesterForm.end_date} onChange={e => setSemesterForm({ ...semesterForm, end_date: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSemesterModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSaveSemester}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="modal-overlay" onClick={() => setShowSessionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Добавить сессию</h3>
              <button className="modal-close" onClick={() => setShowSessionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название</label>
                <input type="text" value={sessionForm.name} onChange={e => setSessionForm({ ...sessionForm, name: e.target.value })} placeholder="Например: Зимняя сессия 2025" />
              </div>
              <div className="form-group">
                <label>Тип сессии</label>
                <select value={sessionForm.session_type} onChange={e => setSessionForm({ ...sessionForm, session_type: e.target.value as any })}>
                  <option value="midterm">Промежуточная</option>
                  <option value="final">Итоговая</option>
                  <option value="credit">Зачёт</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSessionModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSaveSession}>Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}