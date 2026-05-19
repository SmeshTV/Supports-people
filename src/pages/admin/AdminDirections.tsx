import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseAdmin, type DirectionType, type Direction } from '../../lib/supabase';

export default function AdminDirections() {
  const [directionTypes, setDirectionTypes] = useState<DirectionType[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Direction | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    direction_type: 'school' as 'school' | 'university' | 'helper',
    icon: 'book',
    color: '#6366f1'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: dt }, { data: dirs }] = await Promise.all([
      supabaseAdmin.from('direction_types').select('*').order('order_index'),
      supabaseAdmin.from('directions').select('*').order('order_index')
    ]);
    setDirectionTypes((dt as DirectionType[]) || []);
    setDirections((dirs as Direction[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    if (editingItem) {
      await supabaseAdmin.from('directions').update(formData).eq('id', editingItem.id);
    } else {
      await supabaseAdmin.from('directions').insert({ ...formData, order_index: directions.length });
    }

    setShowModal(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', direction_type: 'school', icon: 'book', color: '#6366f1' });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить направление? Все связанные курсы и дисциплины тоже удалятся.')) return;
    await supabaseAdmin.from('directions').delete().eq('id', id);
    fetchData();
  };

  const openEdit = (dir: Direction) => {
    setEditingItem(dir);
    setFormData({
      name: dir.name,
      description: dir.description || '',
      direction_type: dir.direction_type,
      icon: dir.icon || 'book',
      color: dir.color || '#6366f1'
    });
    setShowModal(true);
  };

  if (loading) {
    return <div className="skeleton" style={{ height: 200 }} />;
  }

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Направления</h2>
          <p className="text-muted">ЕНТ, Университет, Школа</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({ name: '', description: '', direction_type: 'school', icon: 'book', color: '#6366f1' }); setShowModal(true); }}>
          + Добавить направление
        </button>
      </div>

      <div className="admin-type-selector">
        {directionTypes.map(dt => {
          const dirs = directions.filter(d => d.direction_type === dt.type);
          return (
            <div key={dt.id} className="admin-type-group">
              <h3 style={{ color: dt.color }}>{dt.name_ru}</h3>
              <div className="admin-items-list">
                {dirs.map(dir => (
                  <div key={dir.id} className="admin-item">
                    <div className="admin-item-info">
                      <span className="admin-item-name">{dir.name}</span>
                      <span className="admin-item-desc">{dir.description}</span>
                    </div>
                    <div className="admin-item-actions">
                      <Link to={`/admin/courses/${dir.id}`} className="btn btn-ghost btn-sm">Курсы →</Link>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(dir)}>✏️</button>
                      <button className="btn btn-ghost btn-sm danger" onClick={() => handleDelete(dir.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
                {dirs.length === 0 && <p className="text-muted" style={{ padding: '12px' }}>Нет направлений</p>}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Редактировать' : 'Добавить'} направление</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Тип</label>
                <select value={formData.direction_type} onChange={e => setFormData({ ...formData, direction_type: e.target.value as any })}>
                  {directionTypes.map(dt => (
                    <option key={dt.type} value={dt.type}>{dt.name_ru}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Название</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Например: Математика" />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Краткое описание..." />
              </div>
              <div className="form-group">
                <label>Цвет</label>
                <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} style={{ width: 60, height: 40 }} />
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