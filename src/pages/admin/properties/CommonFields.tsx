import { useState } from 'react';
import { useAdminData } from '../context/AdminContext';
import { usePublishToggle } from '../hooks/usePublishToggle';

type CommonPropertiesProps = {
  entity: any;
};

export function CommonProperties({ entity }: CommonPropertiesProps) {
  const { updateEntity } = useAdminData();
  const togglePublish = usePublishToggle();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(entity.name);
  const [description, setDescription] = useState(entity.data?.description || '');

  const handleSave = async () => {
    const nameKey = entity.type === 'helper_article' ? 'title' : 'name';
    const updated = { ...entity.data, [nameKey]: name, description };
    await updateEntity(entity.type, entity.id, updated);
    setEditing(false);
  };

  return (
    <div className="properties-section">
      <h4>Основное</h4>

      <div className="properties-field">
        <label>Название</label>
        {editing ? (
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="properties-input"
          />
        ) : (
          <span className="properties-value">{entity.name}</span>
        )}
      </div>

      {entity.data?.description !== undefined && (
        <div className="properties-field">
          <label>Описание</label>
          {editing ? (
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="properties-input"
            />
          ) : (
            <span className="properties-value">{entity.data.description || '—'}</span>
          )}
        </div>
      )}

      <div className="properties-field">
        <label>Видимость</label>
        <button
          className={`publish-toggle ${entity.isPublished ? 'published' : 'unpublished'}`}
          onClick={() => togglePublish(entity.type, entity.id, entity.isPublished)}
        >
          {entity.isPublished ? '👁 Опубликован' : '👁‍🗨 Скрыт'}
        </button>
      </div>

      <div className="properties-actions">
        {!editing ? (
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
            ✏️ Редактировать
          </button>
        ) : (
          <>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              💾 Сохранить
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
              Отмена
            </button>
          </>
        )}
      </div>
    </div>
  );
}
