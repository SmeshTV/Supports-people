import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseAdmin, type Direction, type Course } from '../../lib/supabase';

export default function AdminCourses() {
  const { directionId } = useParams<{ directionId: string }>();
  const [direction, setDirection] = useState<Direction | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ name: '', short_name: '', order_index: 1 });

  useEffect(() => {
    fetchData();
  }, [directionId]);

  const fetchData = async () => {
    if (!directionId) return;
    const [{ data: dir }, { data: crs }] = await Promise.all([
      supabaseAdmin.from('directions').select('*').eq('id', directionId).maybeSingle(),
      supabaseAdmin.from('courses').select('*').eq('direction_id', directionId).order('order_index')
    ]);
    setDirection((dir as Direction) || null);
    setCourses((crs as Course[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    if (editingItem) {
      await supabaseAdmin.from('courses').update(formData).eq('id', editingItem.id);
    } else {
      await supabaseAdmin.from('courses').insert({ ...formData, direction_id: directionId });
    }

    setShowModal(false);
    setEditingItem(null);
    setFormData({ name: '', short_name: '', order_index: courses.length + 1 });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить курс? Все семестры и дисциплины удалятся.')) return;
    await supabaseAdmin.from('courses').delete().eq('id', id);
    fetchData();
  };

  const openEdit = (course: Course) => {
    setEditingItem(course);
    setFormData({ name: course.name, short_name: course.short_name || '', order_index: course.order_index });
    setShowModal(true);
  };

  if (loading) {
    return <div className="skeleton" style={{ height: 200 }} />;
  }

  return (
    <div>
      <div className="admin-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/admin" className="btn btn-ghost btn-sm">← Назад</Link>
          <div>
            <h2>Курсы: {direction?.name}</h2>
            <p className="text-muted">1-4 курс</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({ name: '', short_name: '', order_index: courses.length + 1 }); setShowModal(true); }}>
          + Добавить курс
        </button>
      </div>

      <div className="admin-grid">
        {courses.map(course => (
          <div key={course.id} className="admin-card">
            <div className="admin-card-number">{course.order_index}</div>
            <div className="admin-card-content">
              <h3>{course.name}</h3>
              <p>{course.short_name || `Курс ${course.order_index}`}</p>
            </div>
            <div className="admin-card-actions">
              <Link to={`/admin/semesters/${course.id}`} className="btn btn-primary btn-sm">Семестры →</Link>
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(course)}>✏️</button>
              <button className="btn btn-ghost btn-sm danger" onClick={() => handleDelete(course.id)}>🗑️</button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="empty-state">
            <p>Нет курсов. Добавьте первый курс.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Редактировать' : 'Добавить'} курс</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Например: 1 курс, Бакалавриат" />
              </div>
              <div className="form-group">
                <label>Короткое название</label>
                <input type="text" value={formData.short_name} onChange={e => setFormData({ ...formData, short_name: e.target.value })} placeholder="Например: Бакалавр, 1 курс" />
              </div>
              <div className="form-group">
                <label>Порядок</label>
                <input type="number" value={formData.order_index} onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })} min="1" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave}>{editingItem ? 'Сохранить' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}