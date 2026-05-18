import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabaseAdmin } from '../lib/supabase';

const DEV_EMAIL = 'smeshtrend@gmail.com';

type DirectionType = { id: string; type: string; name_ru: string; name_kz: string; description: string; icon: string; color: string; order_index: number; is_active: boolean };
type Direction = { id: string; direction_type: string; name: string; description: string; icon: string; color: string; order_index: number; is_published: boolean };
type Course = { id: string; direction_id: string; name: string; short_name: string; order_index: number; is_published: boolean };
type Semester = { id: string; course_id: string; name: string; start_date: string | null; end_date: string | null; order_index: number; is_active: boolean };
type Discipline = { id: string; direction_id: string | null; semester_id: string | null; name: string; description: string; order_index: number; is_published: boolean };
type Section = { id: string; discipline_id: string; parent_id: string | null; name: string; description: string; order_index: number; is_published: boolean };
type Exam = { id: string; discipline_id: string | null; session_id: string | null; name: string; description: string; exam_date: string | null; exam_time: string | null; duration_minutes: number; is_published: boolean };
type Subject = { id: string; name: string; description: string; icon: string; color: string; is_published: boolean; order_index: number };
type Category = { id: string; subject_id: string | null; parent_id: string | null; name: string; description: string; order_index: number };
type TestSet = { id: string; subject_id: string | null; category_id: string | null; direction_id: string | null; discipline_id: string | null; name: string; description: string; settings: any; question_ids: string[]; is_published: boolean };
type Question = { id: string; category_id: string | null; type: string; body: any; options: any[]; correct_answers: string[]; explanation: any; hint: string; difficulty: string; points: number; tags: string[]; is_published: boolean };

type TabKey = 'lms' | 'subjects' | 'questions' | 'tests';

export default function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.email !== DEV_EMAIL) navigate('/');
  }, [user, navigate]);

  const [tab, setTab] = useState<TabKey>('lms');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // LMS state
  const [directionTypes, setDirectionTypes] = useState<DirectionType[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [tests, setTests] = useState<TestSet[]>([]);

  const [selDirType, setSelDirType] = useState<DirectionType | null>(null);
  const [selDir, setSelDir] = useState<Direction | null>(null);
  const [selCourse, setSelCourse] = useState<Course | null>(null);
  const [selSemester, setSelSemester] = useState<Semester | null>(null);
  const [selDiscipline, setSelDiscipline] = useState<Discipline | null>(null);
  const [selSection, setSelSection] = useState<Section | null>(null);
  const [selExam, setSelExam] = useState<Exam | null>(null);
  const [selTest, setSelTest] = useState<TestSet | null>(null);

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selSubject, setSelSubject] = useState<Subject | null>(null);
  const [selCategory, setSelCategory] = useState<Category | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);

  // Modals
  const [modal, setModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const fetchData = useCallback(async () => {
    const [
      { data: dt }, { data: dir }, { data: crs }, { data: sem },
      { data: disc }, { data: sec }, { data: exm }, { data: tst },
      { data: sub }, { data: cat }, { data: q },
    ] = await Promise.all([
      supabaseAdmin.from('direction_types').select('*').order('order_index'),
      supabaseAdmin.from('directions').select('*').order('order_index'),
      supabaseAdmin.from('courses').select('*').order('order_index'),
      supabaseAdmin.from('semesters').select('*').order('order_index'),
      supabaseAdmin.from('disciplines').select('*').order('order_index'),
      supabaseAdmin.from('sections').select('*').order('order_index'),
      supabaseAdmin.from('exams').select('*').order('exam_date'),
      supabaseAdmin.from('test_sets').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('subjects').select('*').order('order_index'),
      supabaseAdmin.from('categories').select('*').order('order_index'),
      supabaseAdmin.from('questions').select('*').order('created_at', { ascending: false }),
    ]);
    setDirectionTypes((dt as DirectionType[]) ?? []);
    setDirections((dir as Direction[]) ?? []);
    setCourses((crs as Course[]) ?? []);
    setSemesters((sem as Semester[]) ?? []);
    setDisciplines((disc as Discipline[]) ?? []);
    setSections((sec as Section[]) ?? []);
    setExams((exm as Exam[]) ?? []);
    setTests((tst as TestSet[]) ?? []);
    setSubjects((sub as Subject[]) ?? []);
    setCategories((cat as Category[]) ?? []);
    setQuestions((q as Question[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── CRUD helpers ───
  const create = async (table: string, data: any, onSuccess?: (item: any) => void) => {
    const { data: created, error } = await supabaseAdmin.from(table).insert(data).select('*').single();
    if (error) { showMsg('Ошибка: ' + error.message); return; }
    showMsg('Создано!');
    onSuccess?.(created);
    fetchData();
  };

  const update = async (table: string, id: string, data: any) => {
    const { error } = await supabaseAdmin.from(table).update(data).eq('id', id);
    if (error) { showMsg('Ошибка: ' + error.message); return; }
    showMsg('Обновлено!');
    fetchData();
  };

  const remove = async (table: string, id: string) => {
    if (!confirm('Удалить? Это нельзя отменить.')) return;
    const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
    if (error) { showMsg('Ошибка: ' + error.message); return; }
    showMsg('Удалено!');
    fetchData();
  };

  // ─── LMS Panel ───
  const dirsForType = (typeId: string) => directions.filter((d: Direction) => d.direction_type === typeId);
  const coursesForDir = (dirId: string) => courses.filter((c: Course) => c.direction_id === dirId);
  const semestersForCourse = (courseId: string) => semesters.filter((s: Semester) => s.course_id === courseId);
  const disciplinesForSemester = (semId: string) => disciplines.filter((d: Discipline) => d.semester_id === semId);
  const disciplinesForDir = (dirId: string) => disciplines.filter((d: Discipline) => d.direction_id === dirId && !d.semester_id);
  const sectionsForDiscipline = (discId: string) => sections.filter((s: Section) => s.discipline_id === discId && !s.parent_id);
  const examsForDiscipline = (discId: string) => exams.filter((e: Exam) => e.discipline_id === discId);
  const testsForDiscipline = (discId: string) => tests.filter((t: TestSet) => t.discipline_id === discId);
  const questionsForCategory = (catId: string) => questions.filter((q: Question) => q.category_id === catId);

  // ─── Modal: Generic Create/Edit ───
  const openModal = (type: string, item?: any) => {
    setEditItem(item || null);
    setModalData(item ? { ...item } : {});
    setModal(type);
  };

  const closeModal = () => { setModal(null); setEditItem(null); setModalData({}); };

  const handleSave = () => {
    const { table, ...data } = modalData;
    if (!table || !data.name?.trim()) return;

    const insertData: any = { ...data, name: data.name.trim() };

    // Auto-inject FK fields based on context
    if (table === 'directions' && selDirType) insertData.direction_type = selDirType.type;
    if (table === 'courses' && selDir) insertData.direction_id = selDir.id;
    if (table === 'semesters' && selCourse) insertData.course_id = selCourse.id;
    if (table === 'disciplines') {
      if (selSemester) { insertData.semester_id = selSemester.id; insertData.direction_id = selDir?.id || null; }
      else if (selDir) { insertData.direction_id = selDir.id; insertData.semester_id = null; }
    }
    if (table === 'sections' && selDiscipline) insertData.discipline_id = selDiscipline.id;
    if (table === 'exams' && selDiscipline) insertData.discipline_id = selDiscipline.id;
    if (table === 'categories' && selSubject) insertData.subject_id = selSubject.id;

    if (editItem) {
      update(table, editItem.id, insertData);
    } else {
      create(table, insertData);
    }
    closeModal();
  };

  // ─── Question Modal ───
  type QFormType = { type: string; bodyText: string; imageUrl?: string; options: { id: string; text: string; isCorrect: boolean }[]; difficulty: string; points: number; explanation: string; hint: string; tags: string };
  const [qForm, setQForm] = useState<QFormType>({ type: 'single', bodyText: '', options: [{ id: 'a', text: '', isCorrect: false }, { id: 'b', text: '', isCorrect: false }, { id: 'c', text: '', isCorrect: false }, { id: 'd', text: '', isCorrect: false }], difficulty: 'medium', points: 1, explanation: '', hint: '', tags: '' });
  const [showQModal, setShowQModal] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [qTargetCategory, setQTargetCategory] = useState<string | null>(null);

  const openQuestionEditor = (q?: Question, targetCat?: string) => {
    if (q) {
      setEditQ(q);
      setQTargetCategory(q.category_id);
      const opts = (q.options || []).map((o: any, i: number) => ({ id: o.id || String(i), text: o.text || '', isCorrect: q.correct_answers?.includes(o.id) || false }));
      setQForm({
        type: q.type, bodyText: q.body?.text || '', imageUrl: q.body?.image_url || '',
        options: opts.length > 0 ? opts : [{ id: 'a', text: '', isCorrect: false }, { id: 'b', text: '', isCorrect: false }, { id: 'c', text: '', isCorrect: false }, { id: 'd', text: '', isCorrect: false }],
        difficulty: q.difficulty || 'medium', points: q.points || 1,
        explanation: q.explanation?.text || '', hint: q.hint || '', tags: (q.tags || []).join(', '),
      });
    } else {
      setEditQ(null);
      setQTargetCategory(targetCat || null);
      setQForm({ type: 'single', bodyText: '', imageUrl: '', options: [{ id: 'a', text: '', isCorrect: false }, { id: 'b', text: '', isCorrect: false }, { id: 'c', text: '', isCorrect: false }, { id: 'd', text: '', isCorrect: false }], difficulty: 'medium', points: 1, explanation: '', hint: '', tags: '' });
    }
    setShowQModal(true);
  };

  const saveQuestion = async () => {
    if (!qForm.bodyText.trim()) { showMsg('Текст вопроса обязателен!'); return; }
    if (!qTargetCategory) { showMsg('Выберите раздел!'); return; }
    const correctOpts = qForm.options.filter((o: { id: string; text: string; isCorrect: boolean }) => o.isCorrect).map((o: { id: string; text: string; isCorrect: boolean }) => o.id);
    if (qForm.type !== 'text' && qForm.type !== 'fill' && correctOpts.length === 0) { showMsg('Выберите правильный ответ!'); return; }

    const payload = {
      type: qForm.type,
      body: { text: qForm.bodyText, image_url: qForm.imageUrl || null },
      options: qForm.options.map((o: { id: string; text: string; isCorrect: boolean }) => ({ id: o.id, text: o.text })),
      correct_answers: correctOpts,
      explanation: { text: qForm.explanation, image_url: null },
      difficulty: qForm.difficulty, points: qForm.points,
      tags: qForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      category_id: qTargetCategory, hint: qForm.hint, is_published: true,
    };

    if (editQ) {
      await supabaseAdmin.from('questions').update(payload).eq('id', editQ.id);
    } else {
      await supabaseAdmin.from('questions').insert(payload);
    }
    showMsg(editQ ? 'Обновлено!' : 'Создано!');
    setShowQModal(false);
    fetchData();
  };

  // ─── Test Modal ───
  const [testForm, setTestForm] = useState({ name: '', description: '', mode: 'practice', passing_score_pct: 70 });
  const [showTestModal, setShowTestModal] = useState(false);
  const [testTarget, setTestTarget] = useState<{ type: string; id: string; categoryId?: string } | null>(null);

  const openTestCreator = (target: { type: string; id: string; categoryId?: string }) => {
    setTestTarget(target);
    setTestForm({ name: '', description: '', mode: 'practice', passing_score_pct: 70 });
    setShowTestModal(true);
  };

  const saveTest = async () => {
    if (!testForm.name.trim() || !testTarget) return;
    const payload: any = {
      name: testForm.name.trim(), description: testForm.description,
      settings: { shuffle_questions: false, shuffle_options: false, time_limit_sec: null, passing_score_pct: testForm.passing_score_pct, show_explanations: 'immediate', allow_retakes: true, max_retakes: null, mode: testForm.mode, question_count: null, difficulty_filter: null },
      question_ids: [], is_published: true,
    };
    if (testTarget.type === 'discipline') payload.discipline_id = testTarget.id;
    if (testTarget.type === 'section') { (payload as any).section_id = testTarget.id; }
    if (testTarget.type === 'exam') { (payload as any).exam_id = testTarget.id; }
    if (testTarget.categoryId) payload.category_id = testTarget.categoryId;
    if (selSubject) payload.subject_id = selSubject.id;

    await supabaseAdmin.from('test_sets').insert(payload);
    showMsg('Тест создан!');
    setShowTestModal(false);
    fetchData();
  };

  // ─── Render ───
  if (!user || user.email !== DEV_EMAIL) return null;
  if (loading) return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} /></div>;

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'lms', label: 'LMS', icon: '🎓' },
    { key: 'subjects', label: 'Предметы', icon: '📚' },
    { key: 'questions', label: 'Вопросы', icon: '❓' },
    { key: 'tests', label: 'Тесты', icon: '📝' },
  ];

  return (
    <div className="page-container" style={{ marginTop: 64, minHeight: 'calc(100vh - 64px)', background: 'var(--bg-primary)' }}>
      {/* Top Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? 'white' : 'var(--text-secondary)',
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
        {message && <span style={{ color: 'var(--success)', fontSize: 14, fontWeight: 600 }}>{message}</span>}
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
        {/* Left Sidebar */}
        <div style={{ width: 300, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', overflow: 'auto', padding: 16 }}>
          {tab === 'lms' && renderLMSSidebar()}
          {tab === 'subjects' && renderSubjectsSidebar()}
          {tab === 'questions' && renderQuestionsSidebar()}
          {tab === 'tests' && renderTestsSidebar()}
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {tab === 'lms' && renderLMSContent()}
          {tab === 'subjects' && renderSubjectsContent()}
          {tab === 'questions' && renderQuestionsContent()}
          {tab === 'tests' && renderTestsContent()}
        </div>
      </div>

      {/* Generic Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Редактировать' : 'Создать'} {modalLabel(modal)}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {modal === 'direction_types' && (
                <div>
                  <label style={labelStyle}>Тип направления</label>
                  <select value={modalData.type || 'ent'} onChange={e => setModalData((p: any) => ({ ...p, type: e.target.value }))} style={inputStyle}>
                    <option value="ent">ЕНТ</option>
                    <option value="university">Университет</option>
                    <option value="school">Школа</option>
                  </select>
                </div>
              )}
              {modal === 'directions' && selDirType && (
                <div>
                  <label style={labelStyle}>Направление для: {selDirType.name_ru}</label>
                  <input value={modalData.icon || ''} onChange={e => setModalData((p: any) => ({ ...p, icon: e.target.value }))} style={inputStyle} placeholder="Иконка (emoji)" />
                </div>
              )}
              {modal === 'courses' && (
                <div>
                  <label style={labelStyle}>Короткое имя</label>
                  <input value={modalData.short_name || ''} onChange={e => setModalData((p: any) => ({ ...p, short_name: e.target.value }))} style={inputStyle} placeholder="1, 2, 3..." />
                </div>
              )}
              {modal === 'semesters' && (
                <>
                  <div><label style={labelStyle}>Дата начала</label><input type="date" value={modalData.start_date || ''} onChange={e => setModalData((p: any) => ({ ...p, start_date: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Дата окончания</label><input type="date" value={modalData.end_date || ''} onChange={e => setModalData((p: any) => ({ ...p, end_date: e.target.value }))} style={inputStyle} /></div>
                </>
              )}
              {modal === 'disciplines' && (
                <div>
                  <label style={labelStyle}>Описание</label>
                  <textarea value={modalData.description || ''} onChange={e => setModalData((p: any) => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} />
                </div>
              )}
              {modal === 'sections' && (
                <div>
                  <label style={labelStyle}>Описание</label>
                  <textarea value={modalData.description || ''} onChange={e => setModalData((p: any) => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} />
                </div>
              )}
              {modal === 'exams' && (
                <>
                  <div><label style={labelStyle}>Дата экзамена</label><input type="date" value={modalData.exam_date || ''} onChange={e => setModalData((p: any) => ({ ...p, exam_date: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Время</label><input type="time" value={modalData.exam_time || ''} onChange={e => setModalData((p: any) => ({ ...p, exam_time: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Длительность (мин)</label><input type="number" value={modalData.duration_minutes || 90} onChange={e => setModalData((p: any) => ({ ...p, duration_minutes: parseInt(e.target.value) || 90 }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Описание</label><textarea value={modalData.description || ''} onChange={e => setModalData((p: any) => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} /></div>
                </>
              )}
              <div>
                <label style={labelStyle}>Название *</label>
                <input value={modalData.name || ''} onChange={e => setModalData((p: any) => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Введите название..." autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={closeModal} className="btn btn-secondary">Отмена</button>
                <button onClick={handleSave} className="btn btn-primary">{editItem ? 'Сохранить' : 'Создать'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQModal && (
        <div className="modal-overlay" onClick={() => setShowQModal(false)}>
          <div className="modal-content" style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editQ ? 'Редактировать вопрос' : 'Новый вопрос'}</h2>
              <button className="modal-close" onClick={() => setShowQModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Тип вопроса</label>
                <select value={qForm.type} onChange={e => setQForm((p: QFormType) => ({ ...p, type: e.target.value, options: e.target.value === 'truefalse' ? [{ id: 't', text: 'Верно', isCorrect: false }, { id: 'f', text: 'Неверно', isCorrect: false }] : p.options }))} style={inputStyle}>
                  <option value="single">Один вариант</option>
                  <option value="multiple">Несколько вариантов</option>
                  <option value="truefalse">Верно/Неверно</option>
                  <option value="text">Текстовый ответ</option>
                  <option value="fill">Заполнить пропуск</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Текст вопроса</label>
                <textarea value={qForm.bodyText} onChange={e => setQForm((p: QFormType) => ({ ...p, bodyText: e.target.value }))} style={{ ...inputStyle, minHeight: 80 }} />
              </div>
              {(qForm.type === 'single' || qForm.type === 'multiple' || qForm.type === 'truefalse') && (
                <div>
                  <label style={labelStyle}>Варианты (клик = правильный)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {qForm.options.map((opt: { id: string; text: string; isCorrect: boolean }, idx: number) => (
                      <div key={opt.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button type="button" onClick={() => setQForm((p: QFormType) => {
                          const isMultiple = p.type === 'multiple';
                          const newOpts = p.options.map((o: { id: string; text: string; isCorrect: boolean }) => ({ ...o, isCorrect: o.id === opt.id ? (isMultiple ? !o.isCorrect : true) : (isMultiple ? false : o.isCorrect) }));
                          return { ...p, options: newOpts };
                        })} style={{ width: 32, height: 32, borderRadius: '50%', border: opt.isCorrect ? '2px solid var(--success)' : '2px solid var(--border)', background: opt.isCorrect ? 'var(--success)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {opt.isCorrect && <span style={{ color: 'white', fontSize: 14 }}>✓</span>}
                        </button>
                        <input value={opt.text} onChange={e => setQForm((p: QFormType) => ({ ...p, options: p.options.map((o: { id: string; text: string; isCorrect: boolean }, i: number) => i === idx ? { ...o, text: e.target.value } : o) }))} style={{ ...inputStyle, flex: 1 }} placeholder={`Вариант ${idx + 1}`} />
                      </div>
                    ))}
                    <button onClick={() => setQForm((p: QFormType) => ({ ...p, options: [...p.options, { id: String.fromCharCode(97 + p.options.length), text: '', isCorrect: false }] }))} style={{ ...inputStyle, background: 'transparent', border: '1px dashed var(--border)', cursor: 'pointer' }}>+ Вариант</button>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelStyle}>Сложность</label>
                  <select value={qForm.difficulty} onChange={e => setQForm((p: QFormType) => ({ ...p, difficulty: e.target.value }))} style={inputStyle}>
                    <option value="easy">Легко</option><option value="medium">Средне</option><option value="hard">Сложно</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Баллы</label><input type="number" min="1" value={qForm.points} onChange={e => setQForm((p: QFormType) => ({ ...p, points: parseInt(e.target.value) || 1 }))} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Объяснение</label><textarea value={qForm.explanation} onChange={e => setQForm((p: QFormType) => ({ ...p, explanation: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} /></div>
              <div><label style={labelStyle}>Подсказка</label><input value={qForm.hint} onChange={e => setQForm((p: QFormType) => ({ ...p, hint: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Теги (через запятую)</label><input value={qForm.tags} onChange={e => setQForm((p: QFormType) => ({ ...p, tags: e.target.value }))} style={inputStyle} placeholder="алгебра, егэ" /></div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowQModal(false)} className="btn btn-secondary">Отмена</button>
                <button onClick={saveQuestion} className="btn btn-primary">{editQ ? 'Сохранить' : 'Создать'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Создать тест</h2>
              <button className="modal-close" onClick={() => setShowTestModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={labelStyle}>Название</label><input value={testForm.name} onChange={e => setTestForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Название теста..." autoFocus onKeyDown={e => e.key === 'Enter' && saveTest()} /></div>
              <div><label style={labelStyle}>Описание</label><textarea value={testForm.description} onChange={e => setTestForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelStyle}>Режим</label>
                  <select value={testForm.mode} onChange={e => setTestForm(p => ({ ...p, mode: e.target.value }))} style={inputStyle}>
                    <option value="practice">Практика</option><option value="exam">Экзамен</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Проходной балл (%)</label><input type="number" min="0" max="100" value={testForm.passing_score_pct} onChange={e => setTestForm(p => ({ ...p, passing_score_pct: parseInt(e.target.value) || 70 }))} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowTestModal(false)} className="btn btn-secondary">Отмена</button>
                <button onClick={saveTest} className="btn btn-primary">Создать</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── LMS Sidebar ───
  function renderLMSSidebar() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionHeader title="Направления" onAdd={() => openModal('direction_types')} />
        {directionTypes.map(dt => (
          <TreeItem key={dt.id} label={`${dt.icon === 'book' ? '📘' : dt.icon === 'graduation-cap' ? '🎓' : dt.icon === 'university' ? '🏛️' : dt.icon === 'school' ? '🏫' : '📘'} ${dt.name_ru}`} active={selDirType?.id === dt.id} color={dt.color} onClick={() => { setSelDirType(dt); setSelDir(null); setSelCourse(null); setSelSemester(null); setSelDiscipline(null); setSelSection(null); setSelExam(null); }} onEdit={() => openModal('direction_types', dt)} onDelete={() => remove('direction_types', dt.id)} />
        ))}

        {selDirType && (
          <>
            <SectionHeader title="Специальности" onAdd={() => openModal('directions')} indent={1} />
            {dirsForType(selDirType.type).map(d => (
              <TreeItem key={d.id} label={`${d.icon || '📂'} ${d.name}`} active={selDir?.id === d.id} onClick={() => { setSelDir(d); setSelCourse(null); setSelSemester(null); setSelDiscipline(null); setSelSection(null); setSelExam(null); }} onEdit={() => openModal('directions', d)} onDelete={() => remove('directions', d.id)} indent={1} />
            ))}
          </>
        )}

        {selDir && (
          <>
            <SectionHeader title="Курсы" onAdd={() => openModal('courses')} indent={2} />
            {coursesForDir(selDir.id).map(c => (
              <TreeItem key={c.id} label={`📖 ${c.name}`} active={selCourse?.id === c.id} onClick={() => { setSelCourse(c); setSelSemester(null); setSelDiscipline(null); setSelSection(null); setSelExam(null); }} onEdit={() => openModal('courses', c)} onDelete={() => remove('courses', c.id)} indent={2} />
            ))}
          </>
        )}

        {selCourse && (
          <>
            <SectionHeader title="Семестры" onAdd={() => openModal('semesters')} indent={3} />
            {semestersForCourse(selCourse.id).map(s => (
              <TreeItem key={s.id} label={`📅 ${s.name}`} active={selSemester?.id === s.id} onClick={() => { setSelSemester(s); setSelDiscipline(null); setSelSection(null); setSelExam(null); }} onEdit={() => openModal('semesters', s)} onDelete={() => remove('semesters', s.id)} indent={3} />
            ))}
          </>
        )}

        {selSemester && (
          <>
            <SectionHeader title="Дисциплины" onAdd={() => openModal('disciplines')} indent={4} />
            {disciplinesForSemester(selSemester.id).map(d => (
              <TreeItem key={d.id} label={`📚 ${d.name}`} active={selDiscipline?.id === d.id} onClick={() => { setSelDiscipline(d); setSelSection(null); setSelExam(null); }} onEdit={() => openModal('disciplines', d)} onDelete={() => remove('disciplines', d.id)} indent={4} />
            ))}
          </>
        )}

        {selDir && !selCourse && (
          <>
            <SectionHeader title="Дисциплины (без курса)" onAdd={() => openModal('disciplines')} indent={2} />
            {disciplinesForDir(selDir.id).filter(d => !d.semester_id).map(d => (
              <TreeItem key={d.id} label={`📚 ${d.name}`} active={selDiscipline?.id === d.id} onClick={() => { setSelDiscipline(d); setSelSection(null); setSelExam(null); }} onEdit={() => openModal('disciplines', d)} onDelete={() => remove('disciplines', d.id)} indent={2} />
            ))}
          </>
        )}

        {selDiscipline && (
          <>
            <SectionHeader title="Разделы" onAdd={() => openModal('sections')} indent={5} />
            {sectionsForDiscipline(selDiscipline.id).map(s => (
              <TreeItem key={s.id} label={`📁 ${s.name}`} active={selSection?.id === s.id} onClick={() => setSelSection(s)} onEdit={() => openModal('sections', s)} onDelete={() => remove('sections', s.id)} indent={5} />
            ))}
            <SectionHeader title="Экзамены" onAdd={() => openModal('exams')} indent={5} />
            {examsForDiscipline(selDiscipline.id).map(e => (
              <TreeItem key={e.id} label={`📋 ${e.name}${e.exam_date ? ' (' + e.exam_date + ')' : ''}`} active={selExam?.id === e.id} onClick={() => setSelExam(e)} onEdit={() => openModal('exams', e)} onDelete={() => remove('exams', e.id)} indent={5} />
            ))}
          </>
        )}
      </div>
    );
  }

  // ─── LMS Content ───
  function renderLMSContent() {
    if (!selDiscipline) return <EmptyState title="Выберите дисциплину" desc="Создайте направление → курс → семестр → дисциплину" />;

    const discSections = sectionsForDiscipline(selDiscipline.id);
    const discExams = examsForDiscipline(selDiscipline.id);
    const discTests = testsForDiscipline(selDiscipline.id);

    return (
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>📚 {selDiscipline.name}</h2>

        {/* Sections */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>📁 Разделы ({discSections.length})</h3>
            <button onClick={() => openModal('sections')} className="btn btn-primary btn-sm">+ Раздел</button>
          </div>
          {discSections.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Нет разделов</p> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {discSections.map(s => (
                <div key={s.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.description}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openTestCreator({ type: 'section', id: s.id })} className="btn btn-secondary btn-sm">+ Тест</button>
                    <button onClick={() => openModal('sections', s)} className="btn btn-secondary btn-sm">✏️</button>
                    <button onClick={() => remove('sections', s.id)} className="btn btn-danger btn-sm">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exams */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>📋 Экзамены ({discExams.length})</h3>
            <button onClick={() => openModal('exams')} className="btn btn-primary btn-sm">+ Экзамен</button>
          </div>
          {discExams.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Нет экзаменов</p> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {discExams.map(e => (
                <div key={e.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.exam_date || 'Дата не установлена'} • {e.duration_minutes} мин</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openTestCreator({ type: 'exam', id: e.id })} className="btn btn-secondary btn-sm">+ Тест</button>
                    <button onClick={() => openModal('exams', e)} className="btn btn-secondary btn-sm">✏️</button>
                    <button onClick={() => remove('exams', e.id)} className="btn btn-danger btn-sm">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tests for discipline */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>📝 Тесты дисциплины ({discTests.length})</h3>
            <button onClick={() => openTestCreator({ type: 'discipline', id: selDiscipline.id })} className="btn btn-primary btn-sm">+ Тест</button>
          </div>
          {discTests.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Нет тестов</p> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {discTests.map(t => (
                <div key={t.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.settings?.mode === 'exam' ? 'Экзамен' : 'Практика'} • {t.question_ids.length} вопросов</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setSelTest(t); setTab('questions'); }} className="btn btn-secondary btn-sm">Вопросы</button>
                    <button onClick={() => remove('test_sets', t.id)} className="btn btn-danger btn-sm">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Subjects Sidebar ───
  function renderSubjectsSidebar() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionHeader title="Предметы" onAdd={() => openModal('subjects')} />
        {subjects.map(s => (
          <TreeItem key={s.id} label={`📘 ${s.name}`} active={selSubject?.id === s.id} onClick={() => { setSelSubject(s); setSelCategory(null); }} onEdit={() => openModal('subjects', s)} onDelete={() => remove('subjects', s.id)} />
        ))}
        {selSubject && (
          <>
            <SectionHeader title="Разделы" onAdd={() => openModal('categories')} indent={1} />
            {categories.filter(c => c.subject_id === selSubject.id).map(c => (
              <TreeItem key={c.id} label={`📁 ${c.name}`} active={selCategory?.id === c.id} onClick={() => setSelCategory(c)} onEdit={() => openModal('categories', c)} onDelete={() => remove('categories', c.id)} indent={1} />
            ))}
          </>
        )}
      </div>
    );
  }

  function renderSubjectsContent() {
    if (!selCategory) return <EmptyState title="Выберите предмет и раздел" desc="Создайте предмет → раздел → добавляйте вопросы" />;
    const catQuestions = questionsForCategory(selCategory.id);
    return (
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>📁 {selCategory.name}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>Вопросы ({catQuestions.length})</h3>
          <button onClick={() => openQuestionEditor(undefined, selCategory.id)} className="btn btn-primary btn-sm">+ Вопрос</button>
        </div>
        {catQuestions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Нет вопросов</p> : (
          <div style={{ display: 'grid', gap: 8 }}>
            {catQuestions.map(q => (
              <div key={q.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span className="badge">{q.type}</span>
                    <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-warning' : 'badge-info'}`}>{q.difficulty}</span>
                  </div>
                  <div style={{ fontWeight: 600 }}>{q.body?.text}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openQuestionEditor(q)} className="btn btn-secondary btn-sm">✏️</button>
                  <button onClick={() => remove('questions', q.id)} className="btn btn-danger btn-sm">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Questions Sidebar ───
  function renderQuestionsSidebar() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionHeader title="Все вопросы" />
        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 12px' }}>Всего: {questions.length}</div>
        {questions.slice(0, 50).map(q => (
          <TreeItem key={q.id} label={`${q.type} • ${(q.body?.text || '').substring(0, 40)}...`} onClick={() => openQuestionEditor(q)} />
        ))}
      </div>
    );
  }

  function renderQuestionsContent() {
    return <EmptyState title="Выберите вопрос слева" desc="Или создайте новый через разделы/предметы" />;
  }

  // ─── Tests Sidebar ───
  function renderTestsSidebar() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionHeader title="Все тесты" />
        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 12px' }}>Всего: {tests.length}</div>
        {tests.map(t => (
          <TreeItem key={t.id} label={`📝 ${t.name}`} active={selTest?.id === t.id} onClick={() => setSelTest(t)} onDelete={() => remove('test_sets', t.id)} />
        ))}
      </div>
    );
  }

  function renderTestsContent() {
    if (!selTest) return <EmptyState title="Выберите тест" desc="Выберите тест из списка слева" />;
    const testQuestions = questions.filter(q => selTest.question_ids.includes(q.id));
    const availableQuestions = questions.filter(q => !selTest.question_ids.includes(q.id) && q.category_id === (selTest as any).category_id);

    return (
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>📝 {selTest.name}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{selTest.description} • {selTest.settings?.mode === 'exam' ? 'Экзамен' : 'Практика'} • Проходной: {selTest.settings?.passing_score_pct}%</p>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Вопросы в тесте ({testQuestions.length})</h3>
          {testQuestions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Нет вопросов</p> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {testQuestions.map((q, i) => (
                <div key={q.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, minWidth: 24 }}>{i + 1}</span>
                    <span style={{ fontWeight: 500 }}>{q.body?.text}</span>
                  </div>
                  <button onClick={() => {
                    const newIds = selTest.question_ids.filter(id => id !== q.id);
                    update('test_sets', selTest.id, { question_ids: newIds });
                  }} className="btn btn-danger btn-sm">Убрать</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {availableQuestions.length > 0 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Доступные вопросы ({availableQuestions.length})</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {availableQuestions.map(q => (
                <div key={q.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                  <span style={{ fontWeight: 500 }}>{q.body?.text}</span>
                  <button onClick={() => {
                    update('test_sets', selTest.id, { question_ids: [...selTest.question_ids, q.id] });
                  }} className="btn btn-primary btn-sm">+ Добавить</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Helpers ───
  function modalLabel(type: string) {
    const labels: Record<string, string> = { direction_types: 'тип направления', directions: 'направление', courses: 'курс', semesters: 'семестр', disciplines: 'дисциплину', sections: 'раздел', exams: 'экзамен', subjects: 'предмет', categories: 'раздел' };
    return labels[type] || type;
  }

  function SectionHeader({ title, onAdd, indent = 0 }: { title: string; onAdd?: () => void; indent?: number }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${8 + indent * 8}px 8px 4px ${indent * 12}px`, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {onAdd && <button onClick={onAdd} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>+</button>}
      </div>
    );
  }

  function TreeItem({ label, active, onClick, onEdit, onDelete, indent = 0, color }: { label: string; active?: boolean; onClick?: () => void; onEdit?: () => void; onDelete?: () => void; indent?: number; color?: string }) {
    return (
      <div
        onClick={onClick}
        style={{
          padding: '8px 12px', paddingLeft: 12 + indent * 12,
          background: active ? (color || 'var(--accent)') : 'transparent',
          color: active ? 'white' : 'var(--text-secondary)',
          borderRadius: 6, cursor: onClick ? 'pointer' : 'default',
          fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.15s',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {(onEdit || onDelete) && (
          <div style={{ display: 'flex', gap: 4, opacity: active ? 1 : 0, transition: 'opacity 0.15s' }} onClick={e => e.stopPropagation()}>
            {onEdit && <button onClick={onEdit} style={{ background: 'transparent', border: 'none', color: active ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, padding: '2px 4px' }}>✏️</button>}
            {onDelete && <button onClick={onDelete} style={{ background: 'transparent', border: 'none', color: active ? 'white' : 'var(--danger)', cursor: 'pointer', fontSize: 12, padding: '2px 4px' }}>🗑️</button>}
          </div>
        )}
      </div>
    );
  }

  function EmptyState({ title, desc }: { title: string; desc: string }) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14 }}>{desc}</p>
      </div>
    );
  }
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
