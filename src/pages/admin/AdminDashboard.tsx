import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabaseAdmin, type Direction, type Course, type Discipline, type Exam } from '../../lib/supabase';

const DEV_EMAIL = 'smeshtrend@gmail.com';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [directions, setDirections] = useState<Direction[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'direction' | 'course' | 'semester' | 'discipline' | 'section' | 'test' | 'exam'>('direction');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!user || user.email !== DEV_EMAIL) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const [{ data: dirs }, { data: crs }, { data: discs }, { data: ex }] = await Promise.all([
      supabaseAdmin.from('directions').select('*').order('order_index'),
      supabaseAdmin.from('courses').select('*').order('order_index'),
      supabaseAdmin.from('disciplines').select('*').order('order_index'),
      supabaseAdmin.from('exams').select('*').order('exam_date')
    ]);
    setDirections((dirs as Direction[]) || []);
    setCourses((crs as Course[]) || []);
    setDisciplines((discs as Discipline[]) || []);
    setExams((ex as Exam[]) || []);
    setLoading(false);
  };

  const openModal = (type: any, item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item || getDefaultFormData(type));
    setShowModal(true);
  };

  const getDefaultFormData = (type: string) => {
    switch(type) {
      case 'direction': return { name: '', description: '', direction_type: 'ent', color: '#6366f1' };
      case 'course': return { name: '', short_name: '', direction_id: '', order_index: 1 };
      case 'semester': return { name: '', course_id: '', start_date: '', end_date: '', order_index: 1 };
      case 'discipline': return { name: '', description: '', semester_id: '', order_index: 0 };
      case 'section': return { name: '', description: '', discipline_id: '', order_index: 0 };
      case 'test': return { name: '', description: '', discipline_id: '', mode: 'practice', passing_score_pct: 70 };
      case 'exam': return { name: '', description: '', discipline_id: '', exam_date: '', exam_time: '', duration_minutes: 90 };
      default: return {};
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) return;

    try {
      switch(modalType) {
        case 'direction':
          if (editingItem) {
            await supabaseAdmin.from('directions').update(formData).eq('id', editingItem.id);
          } else {
            await supabaseAdmin.from('directions').insert({ ...formData, order_index: directions.length });
          }
          break;
        case 'course':
          if (editingItem) {
            await supabaseAdmin.from('courses').update(formData).eq('id', editingItem.id);
          } else {
            await supabaseAdmin.from('courses').insert(formData);
          }
          break;
        case 'discipline':
          if (editingItem) {
            await supabaseAdmin.from('disciplines').update(formData).eq('id', editingItem.id);
          } else {
            await supabaseAdmin.from('disciplines').insert(formData);
          }
          break;
        case 'test':
          await supabaseAdmin.from('test_sets').insert({
            ...formData,
            settings: { mode: formData.mode, passing_score_pct: formData.passing_score_pct, show_explanations: 'immediate', shuffle_questions: false, shuffle_options: false, allow_retakes: true, time_limit_sec: null, question_count: null },
            question_ids: []
          });
          break;
        case 'exam':
          if (editingItem) {
            await supabaseAdmin.from('exams').update(formData).eq('id', editingItem.id);
          } else {
            await supabaseAdmin.from('exams').insert(formData);
          }
          break;
      }
      setShowModal(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Ошибка сохранения');
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Удалить ${type}?`)) return;
    try {
      switch(type) {
        case 'direction': await supabaseAdmin.from('directions').delete().eq('id', id); break;
        case 'course': await supabaseAdmin.from('courses').delete().eq('id', id); break;
        case 'discipline': await supabaseAdmin.from('disciplines').delete().eq('id', id); break;
        case 'test': await supabaseAdmin.from('test_sets').delete().eq('id', id); break;
        case 'exam': await supabaseAdmin.from('exams').delete().eq('id', id); break;
      }
      fetchData();
    } catch (e) {
      alert('Ошибка удаления');
    }
  };

  if (loading) return <div className="skeleton" style={{ height: 200 }} />;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🔧 Админ-панель</h1>
        <p className="text-muted">Управление контентом • Твой аккаунт: {user?.email}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>🎯 Направления ({directions.length})</h3>
          {directions.length === 0 ? (
            <p className="text-muted" style={{ marginBottom: 16 }}>Нет направлений</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {directions.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{d.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{d.direction_type}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete('direction', d.id)}>🗑️</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-primary" onClick={() => openModal('direction')} style={{ width: '100%' }}>+ Добавить направление</button>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>🏛️ Курсы ({courses.length})</h3>
          {courses.length === 0 ? (
            <p className="text-muted" style={{ marginBottom: 16 }}>Нет курсов</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {courses.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 500 }}>{c.name}</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete('course', c.id)}>🗑️</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => openModal('course')} style={{ width: '100%' }}>+ Добавить курс</button>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>📚 Дисциплины ({disciplines.length})</h3>
          {disciplines.length === 0 ? (
            <p className="text-muted" style={{ marginBottom: 16 }}>Нет дисциплин</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {disciplines.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 500 }}>{d.name}</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete('discipline', d.id)}>🗑️</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => openModal('discipline')} style={{ width: '100%' }}>+ Добавить дисциплину</button>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>📝 Экзамены ({exams.length})</h3>
          {exams.length === 0 ? (
            <p className="text-muted" style={{ marginBottom: 16 }}>Нет экзаменов</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {exams.slice(0, 5).map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{e.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{e.exam_date || 'нет даты'}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete('exam', e.id)}>🗑️</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => openModal('exam')} style={{ width: '100%' }}>+ Добавить экзамен</button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Добавить {modalType === 'direction' ? 'направление' : modalType === 'course' ? 'курс' : modalType === 'discipline' ? 'дисциплину' : modalType === 'exam' ? 'экзамен' : 'объект'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Например: Математика" />
              </div>
              
              {modalType === 'direction' && (
                <div className="form-group">
                  <label>Тип</label>
                  <select value={formData.direction_type || 'ent'} onChange={e => setFormData({ ...formData, direction_type: e.target.value })}>
                    <option value="ent">ЕНТ (Школьники)</option>
                    <option value="university">Университет</option>
                    <option value="school">Школа</option>
                  </select>
                </div>
              )}

              {modalType === 'direction' && (
                <div className="form-group">
                  <label>Цвет</label>
                  <input type="color" value={formData.color || '#6366f1'} onChange={e => setFormData({ ...formData, color: e.target.value })} style={{ width: 60, height: 40 }} />
                </div>
              )}

              {modalType === 'direction' && (
                <div className="form-group">
                  <label>Описание</label>
                  <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Краткое описание..." />
                </div>
              )}

              {modalType === 'exam' && (
                <div className="form-group">
                  <label>Дата</label>
                  <input type="date" value={formData.exam_date || ''} onChange={e => setFormData({ ...formData, exam_date: e.target.value })} />
                </div>
              )}

              {modalType === 'exam' && (
                <div className="form-group">
                  <label>Время</label>
                  <input type="time" value={formData.exam_time || ''} onChange={e => setFormData({ ...formData, exam_time: e.target.value })} />
                </div>
              )}

              {modalType === 'exam' && (
                <div className="form-group">
                  <label>Длительность (мин)</label>
                  <input type="number" value={formData.duration_minutes || 90} onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-info-card">
        <h4>📋 Как добавлять контент:</h4>
        <ol>
          <li>Нажми <b>"+ Добавить направление"</b> - создай предмет (ЕНТ Математика, Университет Программирование)</li>
          <li>Для университета: создай курсы (1-4 курс), затем дисциплины</li>
          <li>Создавай экзамены с датами для студентов</li>
          <li>Для создания тестов и вопросов - перейди в раздел тестов на сайте</li>
        </ol>
      </div>
    </div>
  );
}