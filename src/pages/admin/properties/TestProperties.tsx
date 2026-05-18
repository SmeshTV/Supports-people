import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../context/AdminContext';

type TestPropertiesProps = {
  entity: any;
};

export function TestProperties({ entity }: TestPropertiesProps) {
  const { updateEntity } = useAdminData();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState(entity.data?.settings || {});
  const [description, setDescription] = useState(entity.data?.description || '');
  const [sourceDescription, setSourceDescription] = useState(entity.data?.source_description || '');

  const handleSave = async () => {
    await updateEntity('test_set', entity.id, {
      description,
      source_description: sourceDescription,
      settings,
    });
    setEditing(false);
  };

  const questionCount = entity.data?.question_ids?.length || 0;

  return (
    <div className="properties-section">
      <h4>✅ Тест</h4>

      <div className="properties-field">
        <label>Количество вопросов</label>
        <span className="properties-value">{questionCount}</span>
      </div>

      <div className="properties-field">
        <label>Режим</label>
        <span className="properties-value">
          {settings.mode === 'exam' ? 'Экзамен' : 'Практика'}
        </span>
      </div>

      <div className="properties-field">
        <label>Проходной балл</label>
        <span className="properties-value">{settings.passing_score_pct || 70}%</span>
      </div>

      {settings.time_limit_sec && (
        <div className="properties-field">
          <label>Лимит времени</label>
          <span className="properties-value">
            {Math.floor(settings.time_limit_sec / 60)} мин
          </span>
        </div>
      )}

      <div className="properties-field">
        <label>Перемешивать вопросы</label>
        <span className="properties-value">{settings.shuffle_questions ? 'Да' : 'Нет'}</span>
      </div>

      <div className="properties-field">
        <label>Перемешивать варианты</label>
        <span className="properties-value">{settings.shuffle_options ? 'Да' : 'Нет'}</span>
      </div>

      {editing && (
        <>
          <div className="properties-field">
            <label>Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="properties-input"
            />
          </div>

          <div className="properties-field">
            <label>Источник вопросов</label>
            <textarea
              value={sourceDescription}
              onChange={e => setSourceDescription(e.target.value)}
              rows={2}
              className="properties-input"
            />
          </div>

          <div className="properties-field">
            <label>Режим</label>
            <select
              value={settings.mode || 'practice'}
              onChange={e => setSettings({ ...settings, mode: e.target.value })}
              className="properties-input"
            >
              <option value="practice">Практика</option>
              <option value="exam">Экзамен</option>
            </select>
          </div>

          <div className="properties-field">
            <label>Проходной балл (%)</label>
            <input
              type="number"
              value={settings.passing_score_pct || 70}
              onChange={e => setSettings({ ...settings, passing_score_pct: parseInt(e.target.value) || 70 })}
              className="properties-input"
            />
          </div>

          <div className="properties-field">
            <label>Лимит времени (сек, 0 = без лимита)</label>
            <input
              type="number"
              value={settings.time_limit_sec || 0}
              onChange={e => setSettings({ ...settings, time_limit_sec: parseInt(e.target.value) || null })}
              className="properties-input"
            />
          </div>
        </>
      )}

      <div className="properties-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate(`/admin/questions/${entity.id}`)}
        >
          ❓ Редактировать вопросы
        </button>
        {!editing ? (
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
            ⚙️ Настройки
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
