import { useState, useEffect } from 'react';
import { useAdminData } from '../context/AdminContext';
import RichTextEditor from '../../../components/ui/RichTextEditor';

type SectionPropertiesProps = {
  entity: any;
};

export function SectionProperties({ entity }: SectionPropertiesProps) {
  const { updateEntity, allTestSets } = useAdminData();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [lectureContent, setLectureContent] = useState('');
  const [testSetId, setTestSetId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Sync state when entity changes
  useEffect(() => {
    setContent(entity.data?.content || '');
    setLectureContent(entity.data?.lecture_content || '');
    setTestSetId(entity.data?.test_set_id || '');
    setSaveStatus('idle');
    setEditing(false);
  }, [entity.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    console.log('Saving section:', entity.id, {
      content: content.substring(0, 50) + '...',
      lecture_content: lectureContent.substring(0, 50) + '...',
      test_set_id: testSetId || null,
    });

    const success = await updateEntity('section', entity.id, {
      content,
      lecture_content: lectureContent,
      test_set_id: testSetId || null,
    });

    setSaving(false);
    if (success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      alert('Ошибка сохранения! Проверьте консоль.');
    }
  };

  const currentTestSet = testSetId ? allTestSets.find(t => t.id === testSetId) : null;

  return (
    <div className="properties-section">
      <h4>📄 Раздел</h4>

      {saveStatus === 'success' && (
        <div style={{ padding: '8px 12px', background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 6, fontSize: 13, color: 'var(--success)' }}>
          ✅ Сохранено!
        </div>
      )}
      {saveStatus === 'error' && (
        <div style={{ padding: '8px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 6, fontSize: 13, color: 'var(--danger)' }}>
          ❌ Ошибка сохранения
        </div>
      )}

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
            onChange={e => {
              console.log('Selecting test:', e.target.value);
              setTestSetId(e.target.value);
            }}
            className="properties-input"
          >
            <option value="">Без теста</option>
            {allTestSets.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        ) : (
          <span className="properties-value">
            {currentTestSet
              ? `✅ ${currentTestSet.name}`
              : testSetId
                ? `⚠️ Тест не найден (ID: ${testSetId})`
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
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? '💾 Сохранение...' : '💾 Сохранить'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setSaveStatus('idle'); }}>
              Отмена
            </button>
          </>
        )}
      </div>
    </div>
  );
}
