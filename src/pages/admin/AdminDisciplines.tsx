import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseAdmin, type Semester, type Discipline } from '../../lib/supabase';

export default function AdminDisciplines() {
  const { semesterId } = useParams<{ semesterId: string }>();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Discipline | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', order_index: 0 });

  useEffect(() => {
    fetchData();
  }, [semesterId]);

  const fetchData = async () => {
    if (!semesterId) return;
    const [{ data: sem }, { data: discs }] = await Promise.all([
      supabaseAdmin.from('semesters').select('*').eq('id', semesterId).maybeSingle(),
      supabaseAdmin.from('disciplines').select('*').eq('semester_id', semesterId).order('order_index')
    ]);
    setSemester((sem as Semester) || null);
    setDisciplines((discs as Discipline[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    if (editingItem) {
      await supabaseAdmin.from('disciplines').update(formData).eq('id', editingItem.id);
    } else {
      await supabaseAdmin.from('disciplines').insert({ ...formData, semester_id: semesterId });
    }

    setShowModal(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', order_index: disciplines.length });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить дисциплину? Все разделы и тесты удалятся.')) return;
    await supabaseAdmin.from('disciplines').delete().eq('id', id);
    fetchData();
  };

  const openEdit = (disc: Discipline) => {
    setEditingItem(disc);
    setFormData({ name: disc.name, description: disc.description || '', order_index: disc.order_index });
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
            <h2>Дисциплины: {semester?.name}</h2>
            <p className="text-muted">Предметы семестра</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({ name: '', description: '', order_index: disciplines.length }); setShowModal(true); }}>
          + Добавить дисциплину
        </button>
      </div>

      <div className="admin-grid">
        {disciplines.map(disc => (
          <div key={disc.id} className="admin-card">
            <div className="admin-card-content">
              <h3>{disc.name}</h3>
              <p className="text-muted">{disc.description || 'Нет описания'}</p>
            </div>
            <div className="admin-card-actions">
              <Link to={`/admin/sections/${disc.id}`} className="btn btn-primary btn-sm">Разделы →</Link>
              <Link to={`/admin/exams/${disc.id}`} className="btn btn-ghost btn-sm">Экзамены</Link>
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(disc)}>✏️</button>
              <button className="btn btn-ghost btn-sm danger" onClick={() => handleDelete(disc.id)}>🗑️</button>
            </div>
          </div>
        ))}
        {disciplines.length === 0 && <div className="empty-state"><p>Нет дисциплин. Добавьте первый предмет.</p></div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Редактировать' : 'Добавить'} дисциплину</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Например: Высшая математика" />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Краткое описание дисциплины..." />
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