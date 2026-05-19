import { useState, useEffect } from 'react';
import { useSelection } from '../context/SelectionContext';
import { useCreateItem, getDefaultFormData } from '../hooks/useCreateItem';
import { supabase } from '../../../lib/supabase';

const CREATE_OPTIONS = [
  { type: 'direction', label: 'Папку', icon: '📂' },
  { type: 'course', label: 'Курс', icon: '🎓' },
  { type: 'discipline', label: 'Дисциплину', icon: '📚' },
  { type: 'attestation', label: 'Аттестацию', icon: '📋' },
  { type: 'attestation_exam', label: 'Экзамен', icon: '📝' },
  { type: 'section', label: 'Тему', icon: '📄' },
  { type: 'test_set', label: 'Тест', icon: '✅' },
  { type: 'helper_article', label: 'Статью', icon: '💡' },
];

type CreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const { currentFolderId, currentFolderType, setShowCreateMenu } = useSelection();
  const createItem = useCreateItem();
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [availableTests, setAvailableTests] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && selectedType === 'attestation_exam') {
      supabase.from('test_sets').select('id, name').eq('is_published', true).order('name').then(({ data }) => {
        setAvailableTests((data as any[]) || []);
      });
    }
  }, [isOpen, selectedType]);

  if (!isOpen) return null;

  const handleSelectType = (type: string) => {
    console.log('CreateModal: Creating', type, 'in folder', currentFolderId, 'type:', currentFolderType);
    setSelectedType(type);
    setFormData(getDefaultFormData(type, currentFolderId, currentFolderType));
    setStep('form');
  };

  const handleSave = async () => {
    console.log('CreateModal: Saving', selectedType, 'with data:', formData);
    setSaving(true);
    const success = await createItem(selectedType, currentFolderId, formData);
    setSaving(false);
    if (success) {
      setStep('select');
      setSelectedType('');
      setFormData({});
      setShowCreateMenu(false);
      onClose();
    } else {
      alert('Ошибка при создании');
    }
  };

  const nameKey = selectedType === 'helper_article' ? 'title' : 'name';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h3>➕ Создать</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {currentFolderId && (
            <div style={{ marginBottom: 16, padding: '8px 12px', background: 'var(--bg-secondary, #f5f5f5)', borderRadius: 8, fontSize: 13, border: '1px solid var(--border, #e5e5e5)' }}>
              📍 Создаётся в: <strong>{currentFolderType || 'корень'}</strong>
            </div>
          )}
          {step === 'select' && (
            <div className="create-type-grid">
              {CREATE_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  className="create-type-btn"
                  onClick={() => handleSelectType(opt.type)}
                >
                  <span className="create-type-icon">{opt.icon}</span>
                  <span className="create-type-label">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 'form' && (
            <div className="create-form">
              <div className="form-group">
                <label>{selectedType === 'helper_article' ? 'Название' : 'Название'}</label>
                <input
                  type="text"
                  value={formData[nameKey] || ''}
                  onChange={e => setFormData({ ...formData, [nameKey]: e.target.value })}
                  placeholder="Введите название"
                />
              </div>

              {selectedType === 'direction' && (
                <div className="form-group">
                  <label>Тип</label>
                  <select
                    value={formData.direction_type || 'school'}
                    onChange={e => setFormData({ ...formData, direction_type: e.target.value })}
                  >
                    <option value="school">Школа</option>
                    <option value="university">Университет</option>
                    <option value="helper">Вспомогательные предметы</option>
                  </select>
                </div>
              )}

              {['direction', 'discipline', 'attestation_exam'].includes(selectedType) && (
                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              )}

              {selectedType === 'course' && (
                <div className="form-group">
                  <label>Короткое название</label>
                  <input
                    type="text"
                    value={formData.short_name || ''}
                    onChange={e => setFormData({ ...formData, short_name: e.target.value })}
                  />
                </div>
              )}

              {selectedType === 'attestation' && (
                <div className="form-group">
                  <label>Тип аттестации</label>
                  <select
                    value={formData.attestation_type || 'attestation1'}
                    onChange={e => setFormData({ ...formData, attestation_type: e.target.value })}
                  >
                    <option value="attestation1">Аттестация 1</option>
                    <option value="attestation2">Аттестация 2</option>
                    <option value="session">Сессия</option>
                  </select>
                </div>
              )}

              {selectedType === 'attestation_exam' && (
                <>
                  <div className="form-group">
                    <label>Тип экзамена</label>
                    <select
                      value={formData.exam_type || 'intermediate'}
                      onChange={e => setFormData({ ...formData, exam_type: e.target.value })}
                    >
                      <option value="intermediate">Промежуточный</option>
                      <option value="midterm">Midterm</option>
                      <option value="endterm">Endterm</option>
                      <option value="test">Тест</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Привязать тест (необязательно)</label>
                    <select
                      value={formData.test_set_id || ''}
                      onChange={e => setFormData({ ...formData, test_set_id: e.target.value || null })}
                    >
                      <option value="">Без теста</option>
                      {availableTests.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Сначала создайте тест, затем привяжите его здесь
                    </p>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.has_lectures || false}
                        onChange={e => setFormData({ ...formData, has_lectures: e.target.checked })}
                        style={{ marginRight: 8 }}
                      />
                      Есть лекции
                    </label>
                  </div>
                </>
              )}

              {selectedType === 'test_set' && (
                <>
                  <div className="form-group">
                    <label>Описание</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="form-group">
                    <label>Источник вопросов</label>
                    <textarea
                      value={formData.source_description || ''}
                      onChange={e => setFormData({ ...formData, source_description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Режим</label>
                      <select
                        value={formData.settings?.mode || 'practice'}
                        onChange={e => setFormData({
                          ...formData,
                          settings: { ...formData.settings, mode: e.target.value }
                        })}
                      >
                        <option value="practice">Практика</option>
                        <option value="exam">Экзамен</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Проходной %</label>
                      <input
                        type="number"
                        value={formData.settings?.passing_score_pct || 70}
                        onChange={e => setFormData({
                          ...formData,
                          settings: { ...formData.settings, passing_score_pct: parseInt(e.target.value) || 70 }
                        })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'form' && (
            <button className="btn btn-secondary" onClick={() => setStep('select')}>
              ← Назад
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          {step === 'form' && (
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !formData[nameKey]?.trim()}
            >
              {saving ? 'Создание...' : 'Создать'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
