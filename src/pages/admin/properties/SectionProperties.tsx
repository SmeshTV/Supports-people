import { useState } from 'react';
import { useAdminData } from '../context/AdminContext';
import RichTextEditor from '../../../components/ui/RichTextEditor';

type SectionPropertiesProps = {
  entity: any;
};

export function SectionProperties({ entity }: SectionPropertiesProps) {
  const { updateEntity, allTestSets } = useAdminData();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(entity.data?.content || '');
  const [lectureContent, setLectureContent] = useState(entity.data?.lecture_content || '');
  const [testSetId, setTestSetId] = useState(entity.data?.test_set_id || '');

  const handleSave = async () => {
    await updateEntity('section', entity.id, {
      content,
      lecture_content: lectureContent,
      test_set_id: testSetId || null,
    });
    setEditing(false);
  };

  return (
    <div className="properties-section">
      <h4>📄 Раздел</h4>

      <div className="properties-field">
        <label>Содержание</label>
        {editing ? (
          <RichTextEditor content={content} onChange={setContent} height={200} />
        ) : (
          <div className="properties-value" dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>

      <div className="properties-field">
        <label>Лекция</label>
        {editing ? (
          <RichTextEditor content={lectureContent} onChange={setLectureContent} height={300} />
        ) : (
          <div className="properties-value" dangerouslySetInnerHTML={{ __html: lectureContent }} />
        )}
      </div>

      <div className="properties-field">
        <label>Привязанный тест</label>
        {editing ? (
          <select
            value={testSetId}
            onChange={e => setTestSetId(e.target.value)}
            className="properties-input"
          >
            <option value="">Без теста</option>
            {allTestSets.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        ) : (
          <span className="properties-value">
            {testSetId
              ? allTestSets.find(t => t.id === testSetId)?.name || '—'
              : 'Нет привязанного теста'}
          </span>
        )}
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
