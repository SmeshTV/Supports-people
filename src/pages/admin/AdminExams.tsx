import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseAdmin, type Discipline, type Exam } from '../../lib/supabase';

export default function AdminExams() {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exam_date: '',
    exam_time: '',
    duration_minutes: 90,
    is_published: true
  });

  useEffect(() => {
    fetchData();
  }, [disciplineId]);

  const fetchData = async () => {
    const [{ data: disc }, { data: ex }] = await Promise.all([
      disciplineId ? supabaseAdmin.from('disciplines').select('*').eq('id', disciplineId).maybeSingle() : Promise.resolve({ data: null }),
      supabaseAdmin.from('exams').select('*').eq('is_published', true).order('exam_date')
    ]);
    setDiscipline((disc as Discipline) || null);
    setExams((ex as Exam[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    const payload = {
      ...formData,
      exam_time: formData.exam_time || null,
      duration_minutes: formData.duration_minutes,
      discipline_id: disciplineId,
      session_id: null
    };

    if (editingExam) {
      await supabaseAdmin.from('exams').update(payload).eq('id', editingExam.id);
    } else {
      await supabaseAdmin.from('exams').insert(payload);
    }

    setShowModal(false);
    setEditingExam(null);
    setFormData({ name: '', description: '', exam_date: '', exam_time: '', duration_minutes: 90, is_published: true });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить экзамен?')) return;
    await supabaseAdmin.from('exams').delete().eq('id', id);
    fetchData();
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      description: exam.description || '',
      exam_date: exam.exam_date || '',
      exam_time: exam.exam_time || '',
      duration_minutes: exam.duration_minutes || 90,
      is_published: exam.is_published
    });
    setShowModal(true);
  };

  if (loading) {
    return <div className="skeleton" style={{ height: 200 }} />;
  }

  const upcomingExams = exams.filter(e => e.exam_date && new Date(e.exam_date) >= new Date());
  const pastExams = exams.filter(e => e.exam_date && new Date(e.exam_date) < new Date());

  return (
    <div>
      <div className="admin-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/admin" className="btn btn-ghost btn-sm">← Назад</Link>
          <div>
            <h2>{discipline ? `Экзамены: ${discipline.name}` : 'Экзамены'}</h2>
            <p className="text-muted">Расписание экзаменов с датами</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingExam(null); setFormData({ name: '', description: '', exam_date: '', exam_time: '', duration_minutes: 90, is_published: true }); setShowModal(true); }}>
          + Добавить экзамен
        </button>
      </div>

      {upcomingExams.length > 0 && (
        <div className="admin-exams-section">
          <h3>Предстоящие</h3>
          <div className="admin-exams-list">
            {upcomingExams.map(exam => {
              const daysUntil = exam.exam_date ? Math.ceil((new Date(exam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
              return (
                <div key={exam.id} className="admin-exam-card">
                  <div className="exam-date-section">
                    <span className="exam-day">{exam.exam_date ? new Date(exam.exam_date).getDate() : '-'}</span>
                    <span className="exam-month">{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('ru', { month: 'short' }) : ''}</span>
                  </div>
                  <div className="exam-info-section">
                    <h4>{exam.name}</h4>
                    <p className="text-muted">{exam.description || 'Нет описания'}</p>
                    <div className="exam-meta">
                      <span>{exam.exam_time ? exam.exam_time.slice(0,5) : 'время не указано'}</span>
                      <span>{exam.duration_minutes} мин</span>
                      {daysUntil !== null && <span className={`days-until ${daysUntil <= 7 ? 'urgent' : ''}`}>{daysUntil} дн.</span>}
                    </div>
                  </div>
                  <div className="exam-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(exam)}>✏️</button>
                    <button className="btn btn-ghost btn-sm danger" onClick={() => handleDelete(exam.id)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pastExams.length > 0 && (
        <div className="admin-exams-section past">
          <h3>Прошедшие</h3>
          <div className="admin-exams-list">
            {pastExams.map(exam => (
              <div key={exam.id} className="admin-exam-card past">
                <div className="exam-date-section">
                  <span className="exam-day">{exam.exam_date ? new Date(exam.exam_date).getDate() : '-'}</span>
                  <span className="exam-month">{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('ru', { month: 'short' }) : ''}</span>
                </div>
                <div className="exam-info-section">
                  <h4>{exam.name}</h4>
                  <p className="text-muted">{exam.description}</p>
                </div>
                <div className="exam-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(exam)}>✏️</button>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => handleDelete(exam.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {exams.length === 0 && <div className="empty-state"><p>Нет экзаменов</p></div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExam ? 'Редактировать' : 'Добавить'} экзамен</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Например: Экзамен по высшей математике" />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Дата</label>
                  <input type="date" value={formData.exam_date} onChange={e => setFormData({ ...formData, exam_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Время</label>
                  <input type="time" value={formData.exam_time} onChange={e => setFormData({ ...formData, exam_time: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Длительность (минуты)</label>
                <input type="number" value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 90 })} min="10" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave}>{editingExam ? 'Сохранить' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}