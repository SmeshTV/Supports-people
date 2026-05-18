import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseAdmin, type Discipline, type Section, type TestSet } from '../../lib/supabase';
import RichTextEditor from '../../components/ui/RichTextEditor';

export default function AdminSections() {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] = useState({ name: '', description: '', content: '', lecture_content: '', parent_id: '' as string | null, order_index: 0, test_set_id: '' as string | null });
  const [testForm, setTestForm] = useState({ name: '', description: '', mode: 'practice' as 'practice' | 'exam', passing_score_pct: 70, time_limit_sec: null as number | null });

  useEffect(() => {
    fetchData();
  }, [disciplineId]);

  const fetchData = async () => {
    if (!disciplineId) return;
    const [{ data: disc }, { data: sects }, { data: tests }] = await Promise.all([
      supabaseAdmin.from('disciplines').select('*').eq('id', disciplineId).maybeSingle(),
      supabaseAdmin.from('sections').select('*').eq('discipline_id', disciplineId).order('order_index'),
      supabaseAdmin.from('test_sets').select('*').eq('discipline_id', disciplineId).order('created_at', { ascending: false })
    ]);
    setDiscipline((disc as Discipline) || null);
    setSections((sects as Section[]) || []);
    setTestSets((tests as TestSet[]) || []);
    setLoading(false);
  };

  const handleSaveSection = async () => {
    if (!sectionForm.name.trim()) return;
    const payload = {
      ...sectionForm,
      parent_id: sectionForm.parent_id || null,
      test_set_id: sectionForm.test_set_id || null,
      discipline_id: disciplineId,
    };
    if (editingSection) {
      await supabaseAdmin.from('sections').update(payload).eq('id', editingSection.id);
    } else {
      await supabaseAdmin.from('sections').insert(payload);
    }
    setShowSectionModal(false);
    setEditingSection(null);
    setSectionForm({ name: '', description: '', content: '', lecture_content: '', parent_id: '', order_index: sections.length, test_set_id: null });
    fetchData();
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Удалить раздел?')) return;
    await supabaseAdmin.from('sections').delete().eq('id', id);
    fetchData();
  };

  const handleSaveTest = async () => {
    if (!testForm.name.trim()) return;
    await supabaseAdmin.from('test_sets').insert({
      ...testForm,
      discipline_id: disciplineId,
      settings: { mode: testForm.mode, passing_score_pct: testForm.passing_score_pct, time_limit_sec: testForm.time_limit_sec, show_explanations: 'immediate', shuffle_questions: false, shuffle_options: false, allow_retakes: true, max_retakes: null, question_count: null, difficulty_filter: null },
      question_ids: []
    });
    setShowTestModal(false);
    setTestForm({ name: '', description: '', mode: 'practice', passing_score_pct: 70, time_limit_sec: null });
    fetchData();
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Удалить тест?')) return;
    await supabaseAdmin.from('test_sets').delete().eq('id', id);
    fetchData();
  };

  const topLevelSections = sections.filter(s => !s.parent_id);
  const getChildSections = (parentId: string) => sections.filter(s => s.parent_id === parentId);

  if (loading) {
    return <div className="skeleton" style={{ height: 200 }} />;
  }

  return (
    <div>
      <div className="admin-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/admin" className="btn btn-ghost btn-sm">← Назад</Link>
          <div>
            <h2>Разделы: {discipline?.name}</h2>
            <p className="text-muted">Темы и тесты дисциплины</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => { setSectionForm({ name: '', description: '', content: '', lecture_content: '', parent_id: '', order_index: sections.length, test_set_id: null }); setShowSectionModal(true); }}>+ Раздел</button>
          <button className="btn btn-primary" onClick={() => setShowTestModal(true)}>+ Тест</button>
        </div>
      </div>

      <div className="admin-sections-container">
        <div className="admin-sections-list">
          <h3>Разделы</h3>
          {topLevelSections.map(section => {
            const children = getChildSections(section.id);
            return (
              <div key={section.id} className="admin-section-item">
                <div className="admin-section-main">
                  <span className="section-name">{section.name}</span>
                  <span className="text-muted">{section.description}</span>
                  <div className="admin-section-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditingSection(section); setSectionForm({ name: section.name, description: section.description || '', content: section.content || '', lecture_content: section.lecture_content || '', parent_id: section.parent_id || '', order_index: section.order_index, test_set_id: section.test_set_id || '' }); setShowSectionModal(true); }}>✏️</button>
                    <button className="btn btn-ghost btn-sm danger" onClick={() => handleDeleteSection(section.id)}>🗑️</button>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="admin-section-children">
                    {children.map(child => (
                      <div key={child.id} className="admin-section-child">
                        <span>→ {child.name}</span>
                        <div className="admin-section-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingSection(child); setSectionForm({ name: child.name, description: child.description || '', content: child.content || '', lecture_content: child.lecture_content || '', parent_id: child.parent_id || '', order_index: child.order_index, test_set_id: child.test_set_id || '' }); setShowSectionModal(true); }}>✏️</button>
                          <button className="btn btn-ghost btn-sm danger" onClick={() => handleDeleteSection(child.id)}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {sections.length === 0 && <p className="text-muted" style={{ padding: 16 }}>Нет разделов</p>}
        </div>

        <div className="admin-tests-list">
          <h3>Тесты</h3>
          {testSets.map(test => (
            <div key={test.id} className="admin-test-item">
              <div>
                <span className="test-name">{test.name}</span>
                <span className={`badge ${test.settings.mode === 'exam' ? 'badge-warning' : 'badge-success'}`}>{test.settings.mode}</span>
                <span className="text-muted">{test.question_ids?.length || 0} вопросов</span>
              </div>
              <div className="admin-test-actions">
                <Link to={`/admin/questions/${test.id}`} className="btn btn-primary btn-sm">Вопросы</Link>
                <button className="btn btn-ghost btn-sm danger" onClick={() => handleDeleteTest(test.id)}>🗑️</button>
              </div>
              <div className="admin-test-actions">
                <Link to={`/admin/questions/${test.id}`} className="btn btn-primary btn-sm">Вопросы</Link>
                <button className="btn btn-ghost btn-sm danger" onClick={() => handleDeleteTest(test.id)}>🗑️</button>
              </div>
            </div>
          ))}
          {testSets.length === 0 && <p className="text-muted" style={{ padding: 16 }}>Нет тестов</p>}
        </div>
      </div>

      {showSectionModal && (
        <div className="modal-overlay" onClick={() => setShowSectionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSection ? 'Редактировать' : 'Добавить'} раздел</h3>
              <button className="modal-close" onClick={() => setShowSectionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название</label>
                <input type="text" value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={sectionForm.description} onChange={e => setSectionForm({ ...sectionForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Содержание</label>
                <RichTextEditor content={sectionForm.content} onChange={(html) => setSectionForm({ ...sectionForm, content: html })} height={200} />
              </div>
              <div className="form-group">
                <label>Лекция</label>
                <RichTextEditor content={sectionForm.lecture_content} onChange={(html) => setSectionForm({ ...sectionForm, lecture_content: html })} height={300} />
              </div>
              <div className="form-group">
                <label>Привязать тест (необязательно)</label>
                <select value={sectionForm.test_set_id || ''} onChange={e => setSectionForm({ ...sectionForm, test_set_id: e.target.value || null })}>
                  <option value="">Без теста</option>
                  {testSets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {sections.length > 0 && (
                <div className="form-group">
                  <label>Родительский раздел (необязательно)</label>
                  <select value={sectionForm.parent_id || ''} onChange={e => setSectionForm({ ...sectionForm, parent_id: e.target.value || null })}>
                    <option value="">Без родителя</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSectionModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSaveSection}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {showTestModal && (
        <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Добавить тест</h3>
              <button className="modal-close" onClick={() => setShowTestModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название</label>
                <input type="text" value={testForm.name} onChange={e => setTestForm({ ...testForm, name: e.target.value })} placeholder="Например: Тест по алгебре" />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={testForm.description} onChange={e => setTestForm({ ...testForm, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Режим</label>
                  <select value={testForm.mode} onChange={e => setTestForm({ ...testForm, mode: e.target.value as any })}>
                    <option value="practice">Практика</option>
                    <option value="exam">Экзамен</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Проходной (%)</label>
                  <input type="number" value={testForm.passing_score_pct} onChange={e => setTestForm({ ...testForm, passing_score_pct: parseInt(e.target.value) || 70 })} min="0" max="100" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTestModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSaveTest}>Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}