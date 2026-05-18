import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabaseAdmin, type TestSet } from '../../lib/supabase';

const DEV_EMAIL = 'smeshtrend@gmail.com';

export default function AdminTestsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<TestSet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    source_description: '',
    mode: 'practice' as 'practice' | 'exam',
    passing_score_pct: 70,
    shuffle_questions: true,
    shuffle_options: true,
    allow_retakes: true,
    time_limit_sec: 0,
  });

  useEffect(() => {
    if (!user || user.email !== DEV_EMAIL) {
      navigate('/');
      return;
    }
    loadTests();
  }, [user]);

  const loadTests = async () => {
    const { data } = await supabaseAdmin.from('test_sets').select('*').order('created_at', { ascending: false });
    setTests((data as TestSet[]) || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingTest(null);
    setFormData({
      name: '',
      description: '',
      source_description: '',
      mode: 'practice',
      passing_score_pct: 70,
      shuffle_questions: true,
      shuffle_options: true,
      allow_retakes: true,
      time_limit_sec: 0,
    });
    setShowModal(true);
  };

  const openEdit = (test: TestSet) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      description: test.description || '',
      source_description: (test as any).source_description || '',
      mode: test.settings?.mode || 'practice',
      passing_score_pct: test.settings?.passing_score_pct || 70,
      shuffle_questions: test.settings?.shuffle_questions ?? true,
      shuffle_options: test.settings?.shuffle_options ?? true,
      allow_retakes: test.settings?.allow_retakes ?? true,
      time_limit_sec: test.settings?.time_limit_sec || 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name,
      description: formData.description,
      source_description: formData.source_description,
      settings: {
        mode: formData.mode,
        passing_score_pct: formData.passing_score_pct,
        shuffle_questions: formData.shuffle_questions,
        shuffle_options: formData.shuffle_options,
        allow_retakes: formData.allow_retakes,
        time_limit_sec: formData.time_limit_sec > 0 ? formData.time_limit_sec : null,
        show_explanations: 'immediate' as const,
        max_retakes: null,
        question_count: null,
        difficulty_filter: null,
      },
    };

    if (editingTest) {
      await supabaseAdmin.from('test_sets').update(payload).eq('id', editingTest.id);
    } else {
      const { data } = await supabaseAdmin.from('test_sets').insert({ ...payload, question_ids: [], is_published: true }).select('id').maybeSingle();
      if (data?.id) {
        setShowModal(false);
        navigate(`/admin/questions/${data.id}`);
        return;
      }
    }

    setShowModal(false);
    loadTests();
  };

  const handleDelete = async (test: TestSet) => {
    if (!confirm(`Удалить тест "${test.name}"?`)) return;
    await supabaseAdmin.from('test_sets').delete().eq('id', test.id);
    loadTests();
  };

  if (loading) return <div className="skeleton" style={{ height: 400 }} />;

  return (
    <div className="admin-tests-page">
      <div className="admin-page-header">
        <div>
          <h1>✅ Мои тесты</h1>
          <p className="text-muted">Управление тестами и вопросами</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Создать тест</button>
      </div>

      {tests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h3 className="empty-state-title">Нет тестов</h3>
          <p className="empty-state-description">Создайте первый тест</p>
          <button className="btn btn-primary" onClick={openCreate}>+ Создать тест</button>
        </div>
      ) : (
        <div className="tests-table-container">
          <table className="tests-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Вопросов</th>
                <th>Режим</th>
                <th>Проходной</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(test => (
                <tr key={test.id}>
                  <td>
                    <div className="test-name-cell">
                      <strong>{test.name}</strong>
                      {test.description && <span className="test-desc">{test.description}</span>}
                    </div>
                  </td>
                  <td>
                    <span className="badge">{test.question_ids?.length || 0}</span>
                  </td>
                  <td>
                    <span className={`badge ${test.settings?.mode === 'exam' ? 'badge-warning' : 'badge-success'}`}>
                      {test.settings?.mode === 'exam' ? 'Экзамен' : 'Практика'}
                    </span>
                  </td>
                  <td>{test.settings?.passing_score_pct || 70}%</td>
                  <td>
                    <div className="test-actions">
                      <Link to={`/admin/questions/${test.id}`} className="btn btn-primary btn-sm">❓ Вопросы</Link>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(test)}>✏️</button>
                      <button className="btn btn-ghost btn-sm danger" onClick={() => handleDelete(test)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h3>{editingTest ? '✏️ Редактировать тест' : '➕ Создать тест'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название теста</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Например: Тест по алгебре" />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="Краткое описание теста" />
              </div>
              <div className="form-group">
                <label>Источник вопросов (показывается перед тестом)</label>
                <textarea value={formData.source_description} onChange={e => setFormData({ ...formData, source_description: e.target.value })} rows={3} placeholder="Например: Вопросы основаны на лекциях главы 1-5, учебник Иванова 2024" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Режим</label>
                  <select value={formData.mode} onChange={e => setFormData({ ...formData, mode: e.target.value as any })}>
                    <option value="practice">Практика</option>
                    <option value="exam">Экзамен</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Проходной балл (%)</label>
                  <input type="number" value={formData.passing_score_pct} onChange={e => setFormData({ ...formData, passing_score_pct: parseInt(e.target.value) || 70 })} min="0" max="100" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><input type="checkbox" checked={formData.shuffle_questions} onChange={e => setFormData({ ...formData, shuffle_questions: e.target.checked })} /> Перемешивать вопросы</label>
                </div>
                <div className="form-group">
                  <label><input type="checkbox" checked={formData.shuffle_options} onChange={e => setFormData({ ...formData, shuffle_options: e.target.checked })} /> Перемешивать варианты</label>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><input type="checkbox" checked={formData.allow_retakes} onChange={e => setFormData({ ...formData, allow_retakes: e.target.checked })} /> Разрешить пересдачи</label>
                </div>
                <div className="form-group">
                  <label>Лимит времени (сек, 0 = без лимита)</label>
                  <input type="number" value={formData.time_limit_sec} onChange={e => setFormData({ ...formData, time_limit_sec: parseInt(e.target.value) || 0 })} min="0" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave}>{editingTest ? 'Сохранить' : 'Создать и добавить вопросы'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
