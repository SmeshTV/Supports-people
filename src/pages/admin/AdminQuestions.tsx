import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseAdmin, type TestSet, type Question } from '../../lib/supabase';
import QuestionEditor, { generateId, type QuestionForm } from '../../components/ui/QuestionEditor';
import { useI18n } from '../../lib/i18n';
import { getTranslation } from '../../lib/translations';

type ImportPreview = {
  total: number;
  valid: number;
  errors: number;
  questions: { question: string; type: string; points: number; options: number }[];
};

export default function AdminQuestions() {
  const { language } = useI18n();
  const { testId } = useParams<{ testId: string }>();
  const [testSet, setTestSet] = useState<TestSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>({
    type: 'single',
    bodyText: '',
    bodyTranslations: { ru: '', en: '', kz: '' },
    imageUrl: '',
    options: [
      { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
      { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
      { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
      { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
    ],
    correctAnswers: [],
    correctText: '',
    correctTextTranslations: { ru: '', en: '', kz: '' },
    correctOrder: [],
    correctPairs: [],
    explanationText: '',
    explanationTranslations: { ru: '', en: '', kz: '' },
    hint: '',
    hintTranslations: { ru: '', en: '', kz: '' },
    difficulty: 'medium',
    points: 1,
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<'csv' | 'tsv' | 'txt'>('csv');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [testId]);

  const fetchData = async () => {
    if (!testId) return;
    setLoading(true);

    const { data: ts } = await supabaseAdmin.from('test_sets').select('*').eq('id', testId).maybeSingle();
    setTestSet((ts as TestSet) || null);

    const questionIds = (ts as any)?.question_ids || [];
    if (questionIds.length > 0) {
      const { data: qs } = await supabaseAdmin.from('questions').select('*').in('id', questionIds);
      setQuestions((qs as Question[]) || []);
    } else {
      setQuestions([]);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!questionForm.bodyText.trim()) return;

    const correctOpts = questionForm.options.filter(o => o.isCorrect).map(o => o.id);
    if (['single', 'multiple', 'truefalse', 'dropdown'].includes(questionForm.type) && correctOpts.length === 0) {
      alert('Выберите правильный ответ!');
      return;
    }

    const payload = {
      type: questionForm.type,
      body: {
        text: questionForm.bodyText,
        text_translations: questionForm.bodyTranslations,
        image_url: questionForm.imageUrl || null
      },
      options: questionForm.options.filter(o => o.text.trim()).map(o => ({
        id: o.id,
        text: o.text,
        text_translations: o.text_translations
      })),
      correct_answers: correctOpts,
      correct_text: questionForm.correctText,
      correct_text_translations: questionForm.correctTextTranslations,
      correct_order: questionForm.correctOrder,
      correct_pairs: questionForm.correctPairs,
      explanation: {
        text: questionForm.explanationText,
        text_translations: questionForm.explanationTranslations
      },
      hint: questionForm.hint,
      hint_translations: questionForm.hintTranslations,
      difficulty: questionForm.difficulty,
      points: questionForm.points,
      is_published: true,
    };

    let questionId: string;

    if (editingQuestion) {
      await supabaseAdmin.from('questions').update(payload).eq('id', editingQuestion.id);
      questionId = editingQuestion.id;
    } else {
      const { data } = await supabaseAdmin.from('questions').insert(payload).select('id').maybeSingle();
      questionId = data?.id;
    }

    const { data: freshTestSet } = await supabaseAdmin.from('test_sets').select('question_ids').eq('id', testId).maybeSingle();
    const existingIds = (freshTestSet as any)?.question_ids || [];
    const newQuestionIds = editingQuestion
      ? existingIds.filter((id: string) => id !== editingQuestion.id)
      : existingIds;

    if (questionId && !newQuestionIds.includes(questionId)) {
      newQuestionIds.push(questionId);
    }

    await supabaseAdmin.from('test_sets').update({ question_ids: newQuestionIds }).eq('id', testId);

    setShowModal(false);
    setEditingQuestion(null);
    setQuestionForm({
      type: 'single',
      bodyText: '',
      bodyTranslations: { ru: '', en: '', kz: '' },
      imageUrl: '',
      options: [
        { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
        { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
        { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
        { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
      ],
      correctAnswers: [],
      correctText: '',
      correctTextTranslations: { ru: '', en: '', kz: '' },
      correctOrder: [],
      correctPairs: [],
      explanationText: '',
      explanationTranslations: { ru: '', en: '', kz: '' },
      hint: '',
      hintTranslations: { ru: '', en: '', kz: '' },
      difficulty: 'medium',
      points: 1,
    });
    await fetchData();
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Удалить вопрос?')) return;
    await supabaseAdmin.from('questions').delete().eq('id', questionId);

    const { data: freshTestSet } = await supabaseAdmin.from('test_sets').select('question_ids').eq('id', testId).maybeSingle();
    const newQuestionIds = ((freshTestSet as any)?.question_ids || []).filter((id: string) => id !== questionId);
    await supabaseAdmin.from('test_sets').update({ question_ids: newQuestionIds }).eq('id', testId);

    await fetchData();
  };

  const openEdit = (q: Question) => {
    const opts = (q.options || []).map((o: any) => ({
      id: o.id || generateId(),
      text: o.text || '',
      text_translations: o.text_translations || { ru: '', en: '', kz: '' },
      isCorrect: (q.correct_answers || []).includes(o.id)
    }));
    setQuestionForm({
      type: q.type as QuestionForm['type'],
      bodyText: (q.body as any)?.text || '',
      bodyTranslations: (q.body as any)?.text_translations || { ru: '', en: '', kz: '' },
      imageUrl: (q.body as any)?.image_url || '',
      options: opts.length > 0 ? opts : [
        { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
        { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
        { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
        { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false },
      ],
      correctAnswers: q.correct_answers || [],
      correctText: (q as any).correct_text || '',
      correctTextTranslations: (q as any).correct_text_translations || { ru: '', en: '', kz: '' },
      correctOrder: (q as any).correct_order || [],
      correctPairs: (q as any).correct_pairs || [],
      explanationText: (q.explanation as any)?.text || '',
      explanationTranslations: (q.explanation as any)?.text_translations || { ru: '', en: '', kz: '' },
      hint: q.hint || '',
      hintTranslations: (q as any).hint_translations || { ru: '', en: '', kz: '' },
      difficulty: (q.difficulty as any) || 'medium',
      points: q.points || 1,
    });
    setEditingQuestion(q);
    setShowModal(true);
  };

  const moveQuestion = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= questions.length) return;
    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(fromIdx, 1);
    newQuestions.splice(toIdx, 0, moved);
    setQuestions(newQuestions);
    const newIds = newQuestions.map(q => q.id);
    await supabaseAdmin.from('test_sets').update({ question_ids: newIds }).eq('id', testId);
  };

  const copyQuestion = async (q: Question) => {
    const payload = {
      type: q.type,
      body: q.body,
      options: q.options,
      correct_answers: q.correct_answers,
      correct_text: (q as any).correct_text,
      correct_text_translations: (q as any).correct_text_translations,
      correct_order: (q as any).correct_order,
      correct_pairs: (q as any).correct_pairs,
      explanation: q.explanation,
      hint: q.hint,
      hint_translations: (q as any).hint_translations,
      difficulty: q.difficulty,
      points: q.points,
      is_published: true,
    };
    const { data } = await supabaseAdmin.from('questions').insert(payload).select('id').maybeSingle();
    if (data?.id) {
      const { data: freshTestSet } = await supabaseAdmin.from('test_sets').select('question_ids').eq('id', testId).maybeSingle();
      const existingIds = (freshTestSet as any)?.question_ids || [];
      const newIds = [...existingIds, data.id];
      await supabaseAdmin.from('test_sets').update({ question_ids: newIds }).eq('id', testId);
      await fetchData();
    }
  };

  const filteredQuestions = questions.filter(q => {
    const bodyText = (q.body as any)?.text || '';
    const stripHtml = bodyText.replace(/<[^>]*>/g, '');
    const matchesSearch = !searchQuery || stripHtml.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesType = filterType === 'all' || q.type === filterType;
    return matchesSearch && matchesDifficulty && matchesType;
  });

  const parseImportLine = (cols: string[]) => {
    if (cols.length < 3) return null;

    const [type, question] = cols;
    const validTypes = ['single', 'multiple', 'truefalse', 'fill', 'numeric', 'short_answer', 'matching', 'ordering', 'dropdown', 'cloze', 'essay'];
    const qType = validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : 'single';

    // Find the correct answers column (contains letters like A,B or A;B or just A)
    let correctIdx = -1;
    let difficultyIdx = -1;
    let pointsIdx = -1;
    let explanationIdx = -1;
    let optionsStartIdx = 2;

    // Heuristic: look for columns that look like correct answers (letters)
    for (let i = 2; i < cols.length; i++) {
      const col = cols[i].trim();
      if (/^[A-H]([,;][A-H])*$/.test(col.toUpperCase()) && correctIdx === -1) {
        correctIdx = i;
      } else if (/^(easy|medium|hard)$/i.test(col) && difficultyIdx === -1) {
        difficultyIdx = i;
      } else if (/^\d+$/.test(col) && pointsIdx === -1 && i > correctIdx) {
        const num = parseInt(col);
        // Only accept reasonable point values (1-100), not random numbers from text
        if (num >= 1 && num <= 100) {
          pointsIdx = i;
        }
      }
    }

    // Options are between question and correct answer
    const options: { id: string; text: string; isCorrect: boolean }[] = [];
    const correctLetters = correctIdx >= 0 ? cols[correctIdx].toUpperCase().split(/[,;]/).map(s => s.trim()) : [];

    for (let i = optionsStartIdx; i < (correctIdx >= 0 ? correctIdx : cols.length); i++) {
      if (cols[i].trim()) {
        const letter = String.fromCharCode(65 + options.length);
        options.push({
          id: generateId(),
          text: cols[i].trim(),
          isCorrect: correctLetters.includes(letter),
        });
      }
    }

    // For fill/numeric/short_answer, the "correct" column is the answer text
    if (['fill', 'numeric', 'short_answer'].includes(qType) && options.length === 0 && correctIdx >= 0) {
      return {
        type: qType,
        body: { text: question, text_translations: {}, image_url: null },
        options: [],
        correct_answers: [],
        correct_text: cols[correctIdx],
        correct_text_translations: {},
        correct_order: [],
        correct_pairs: [],
        explanation: { text: explanationIdx >= 0 ? cols[explanationIdx] : '', text_translations: {} },
        hint: '',
        hint_translations: {},
        difficulty: difficultyIdx >= 0 ? cols[difficultyIdx].toLowerCase() : 'medium',
        points: pointsIdx >= 0 ? parseInt(cols[pointsIdx]) || 1 : 1,
        is_published: true,
      };
    }

    // For ordering, options are the items in order
    if (qType === 'ordering' && options.length === 0) {
      const items = cols.slice(optionsStartIdx, correctIdx >= 0 ? correctIdx : cols.length).filter(c => c.trim());
      return {
        type: 'ordering',
        body: { text: question, text_translations: {}, image_url: null },
        options: [],
        correct_answers: [],
        correct_text: '',
        correct_text_translations: {},
        correct_order: items,
        correct_pairs: [],
        explanation: { text: explanationIdx >= 0 ? cols[explanationIdx] : '', text_translations: {} },
        hint: '',
        hint_translations: {},
        difficulty: difficultyIdx >= 0 ? cols[difficultyIdx].toLowerCase() : 'medium',
        points: pointsIdx >= 0 ? parseInt(cols[pointsIdx]) || 1 : 1,
        is_published: true,
      };
    }

    const correctAnswers = options.filter(o => o.isCorrect).map(o => o.id);

    return {
      type: qType,
      body: { text: question, text_translations: {}, image_url: null },
      options: options.map(o => ({ id: o.id, text: o.text, text_translations: {} })),
      correct_answers: correctAnswers,
      correct_text: '',
      correct_text_translations: {},
      correct_order: [],
      correct_pairs: [],
      explanation: { text: explanationIdx >= 0 ? cols[explanationIdx] : '', text_translations: {} },
      hint: '',
      hint_translations: {},
      difficulty: difficultyIdx >= 0 ? cols[difficultyIdx].toLowerCase() : 'medium',
      points: pointsIdx >= 0 ? parseInt(cols[pointsIdx]) || 1 : 1,
      is_published: true,
    };
  };

  const handleImportPreview = () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const separator = importFormat === 'csv' ? ',' : importFormat === 'tsv' ? '\t' : '|';
      const lines = text.split('\n').filter(l => l.trim());

      const preview: ImportPreview = { total: 0, valid: 0, errors: 0, questions: [] };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        preview.total++;

        const cols = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
        const parsed = parseImportLine(cols);

        if (parsed) {
          preview.valid++;
          const bodyText = (parsed.body as any)?.text || '';
          preview.questions.push({
            question: bodyText.length > 80 ? bodyText.substring(0, 80) + '...' : bodyText,
            type: parsed.type,
            points: parsed.points,
            options: parsed.options?.length || 0,
          });
        } else {
          preview.errors++;
        }
      }

      setImportPreview(preview);
    };
    reader.readAsText(importFile);
  };

  const handleImport = async () => {
    if (!importFile || !importPreview) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const separator = importFormat === 'csv' ? ',' : importFormat === 'tsv' ? '\t' : '|';
      const lines = text.split('\n').filter(l => l.trim());
      const newQuestions: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
        const parsed = parseImportLine(cols);
        if (parsed) newQuestions.push(parsed);
      }

      if (newQuestions.length === 0) {
        alert('Не удалось распознать ни одного вопроса. Проверьте формат файла.');
        return;
      }

      console.log('Importing questions:', JSON.stringify(newQuestions[0], null, 2));

      const { data: inserted, error: insertError } = await supabaseAdmin.from('questions').insert(newQuestions).select('id');

      if (insertError) {
        console.error('Insert error:', insertError);
        alert(`Ошибка импорта: ${insertError.message}\n\nDetails: ${insertError.details || 'none'}\nHint: ${insertError.hint || 'none'}`);
        return;
      }

      const newIds = inserted?.map(d => d.id) || [];

      const { data: freshTestSet } = await supabaseAdmin.from('test_sets').select('question_ids').eq('id', testId).maybeSingle();
      const existingIds = (freshTestSet as any)?.question_ids || [];
      const allIds = [...existingIds, ...newIds];

      await supabaseAdmin.from('test_sets').update({ question_ids: allIds }).eq('id', testId);

      setShowImportModal(false);
      setImportFile(null);
      setImportPreview(null);
      await fetchData();
      alert(`Импортировано ${newQuestions.length} вопросов!`);
    };
    reader.readAsText(importFile);
  };

  const downloadTemplate = () => {
    const headers = [
      'ТИП_ВОПРОСА (single/multiple/truefalse/fill/numeric/short_answer/ordering/matching/dropdown/cloze/essay)',
      'ТЕКСТ_ВОПРОСА',
      'ВАРИАНТ_A',
      'ВАРИАНТ_B',
      'ВАРИАНТ_C',
      'ВАРИАНТ_D',
      'ВАРИАНТ_E (необязательно)',
      'ВАРИАНТ_F (необязательно)',
      'ВАРИАНТ_G (необязательно)',
      'ВАРИАНТ_H (необязательно)',
      'ПРАВИЛЬНЫЕ_ОТВЕТЫ (A,B или A;B для нескольких)',
      'СЛОЖНОСТЬ (easy/medium/hard)',
      'БАЛЛЫ (число)',
      'ОБЪЯСНЕНИЕ (необязательно)'
    ];

    const examples = [
      'single', 'Сколько будет 2+2?', '3', '4', '5', '6', '', '', '', '', 'B', 'easy', '1', 'Это простая арифметика',
      'multiple', 'Какие числа чётные?', '1', '2', '3', '4', '', '', '', '', 'B,D', 'medium', '2', 'Чётные делятся на 2',
      'truefalse', 'Земля плоская', '', '', '', '', '', '', '', '', 'false', 'easy', '1', 'Земля — геоид',
      'fill', 'Столица Франции — ___', '', '', '', '', '', '', '', '', 'Париж', 'easy', '1', '',
      'numeric', 'Чему равен корень из 144?', '', '', '', '', '', '', '', '', '12', 'medium', '2', '',
      'ordering', 'Расставьте по порядку', 'Весна', 'Лето', 'Осень', 'Зима', '', '', '', '', '', 'easy', '1', 'Времена года',
    ];

    const separator = importFormat === 'csv' ? ',' : importFormat === 'tsv' ? '\t' : '|';
    const headerLine = headers.join(separator);
    const exampleLines = [];
    for (let i = 0; i < examples.length; i += 14) {
      exampleLines.push(examples.slice(i, i + 14).join(separator));
    }

    const content = headerLine + '\n' + exampleLines.join('\n');
    const ext = importFormat === 'csv' ? 'csv' : importFormat === 'tsv' ? 'tsv' : 'txt';
    const mimeType = importFormat === 'csv' ? 'text/csv' : importFormat === 'tsv' ? 'text/tab-separated-values' : 'text/plain';

    const blob = new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_questions.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="skeleton" style={{ height: 200 }} />;
  }

  return (
    <div className="admin-questions-page">
      <div className="admin-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/admin" className="btn btn-ghost btn-sm">← Назад</Link>
          <div>
            <h2>Вопросы: {testSet?.name}</h2>
            <p className="text-muted">{questions.length} вопросов в тесте</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => { setEditingQuestion(null); setShowImportModal(true); setImportPreview(null); }}>📥 Импорт</button>
          <button className="btn btn-primary" onClick={() => { setEditingQuestion(null); setQuestionForm({ type: 'single', bodyText: '', bodyTranslations: { ru: '', en: '', kz: '' }, imageUrl: '', options: [{ id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false }, { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false }, { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false }, { id: generateId(), text: '', text_translations: { ru: '', en: '', kz: '' }, isCorrect: false }], correctAnswers: [], correctText: '', correctTextTranslations: { ru: '', en: '', kz: '' }, correctOrder: [], correctPairs: [], explanationText: '', explanationTranslations: { ru: '', en: '', kz: '' }, hint: '', hintTranslations: { ru: '', en: '', kz: '' }, difficulty: 'medium', points: 1 }); setShowModal(true); }}>+ Добавить вопрос</button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="questions-filters">
          <div className="questions-search">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Поиск по тексту вопроса..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="questions-filter-select">
            <option value="all">Все сложности</option>
            <option value="easy">Легко</option>
            <option value="medium">Средне</option>
            <option value="hard">Сложно</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="questions-filter-select">
            <option value="all">Все типы</option>
            <option value="single">Один ответ</option>
            <option value="multiple">Несколько ответов</option>
            <option value="truefalse">Верно/Неверно</option>
            <option value="fill">Заполнить пропуск</option>
            <option value="numeric">Числовой</option>
            <option value="short_answer">Краткий ответ</option>
            <option value="matching">Соответствие</option>
            <option value="ordering">Порядок</option>
            <option value="dropdown">Выпадающий список</option>
            <option value="cloze">Текст с пропусками</option>
            <option value="essay">Развёрнутый ответ</option>
          </select>
        </div>
      )}

      <div className="admin-questions-list">
        {filteredQuestions.map((q, i) => {
          const realIdx = questions.findIndex(orig => orig.id === q.id);
          const bodyText = getTranslation((q.body as any)?.text_translations, (q.body as any)?.text || '', language);
          return (
            <div key={q.id} className="admin-question-item">
              <div className="admin-question-number">{i + 1}</div>
              <div className="admin-question-content">
                <div className="admin-question-header">
                  <span className="badge">{q.type}</span>
                  <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-warning' : 'badge-info'}`}>{q.difficulty}</span>
                  <span className="badge">{q.points} балл</span>
                </div>
                <p className="admin-question-text" dangerouslySetInnerHTML={{ __html: bodyText }} />
                <p className="text-muted">{q.options?.length || 0} вариантов</p>
              </div>
              <div className="admin-question-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => moveQuestion(realIdx, realIdx - 1)} disabled={realIdx === 0} title="Вверх">↑</button>
                <button className="btn btn-ghost btn-sm" onClick={() => moveQuestion(realIdx, realIdx + 1)} disabled={realIdx === questions.length - 1} title="Вниз">↓</button>
                <button className="btn btn-ghost btn-sm" onClick={() => copyQuestion(q)} title="Копировать">📋</button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(q)} title="Редактировать">✏️</button>
                <button className="btn btn-ghost btn-sm danger" onClick={() => handleDelete(q.id)} title="Удалить">🗑️</button>
              </div>
            </div>
          );
        })}
        {filteredQuestions.length === 0 && questions.length > 0 && (
          <div className="empty-state"><p>Ничего не найдено по фильтрам</p></div>
        )}
        {questions.length === 0 && <div className="empty-state"><p>Нет вопросов. Добавьте вручную или импортируйте.</p></div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingQuestion ? 'Редактировать' : 'Добавить'} вопрос</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <QuestionEditor form={questionForm} onChange={setQuestionForm} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave}>{editingQuestion ? 'Сохранить' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => { setShowImportModal(false); setImportPreview(null); }}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📥 Импорт вопросов</h3>
              <button className="modal-close" onClick={() => { setShowImportModal(false); setImportPreview(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Формат файла</label>
                <div className="import-format-selector">
                  <button className={importFormat === 'csv' ? 'active' : ''} onClick={() => setImportFormat('csv')}>CSV</button>
                  <button className={importFormat === 'tsv' ? 'active' : ''} onClick={() => setImportFormat('tsv')}>TSV (Excel)</button>
                  <button className={importFormat === 'txt' ? 'active' : ''} onClick={() => setImportFormat('txt')}>TXT (|)</button>
                </div>
              </div>

              <div className="import-template-info">
                <p>📄 Шаблон содержит столбцы:</p>
                <div className="import-columns-list">
                  <span>ТИП_ВОПРОСА</span>
                  <span>ТЕКСТ_ВОПРОСА</span>
                  <span>ВАРИАНТ A–H</span>
                  <span>ПРАВИЛЬНЫЕ</span>
                  <span>СЛОЖНОСТЬ</span>
                  <span>БАЛЛЫ</span>
                  <span>ОБЪЯСНЕНИЕ</span>
                </div>
                <p className="import-hint">Для вопросов без вариантов (fill, numeric, ordering) столбец "ПРАВИЛЬНЫЕ" содержит ответ</p>
              </div>

              <button className="btn btn-ghost" onClick={downloadTemplate}>📄 Скачать шаблон ({importFormat.toUpperCase()})</button>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Выбрать файл</label>
                <input type="file" accept=".csv,.tsv,.txt" onChange={e => { setImportFile(e.target.files?.[0] || null); setImportPreview(null); }} ref={fileInputRef} />
              </div>

              {importFile && !importPreview && (
                <div className="import-preview">
                  <p>Выбран файл: <strong>{importFile.name}</strong></p>
                  <p className="text-muted">Нажмите "Предпросмотр" для проверки</p>
                  <button className="btn btn-secondary btn-sm" onClick={handleImportPreview} style={{ marginTop: 8 }}>👁 Предпросмотр</button>
                </div>
              )}

              {importPreview && (
                <div className="import-preview import-preview-result">
                  <div className="import-preview-stats">
                    <div className="import-stat">
                      <span className="import-stat-value">{importPreview.total}</span>
                      <span className="import-stat-label">Всего строк</span>
                    </div>
                    <div className="import-stat import-stat-success">
                      <span className="import-stat-value">{importPreview.valid}</span>
                      <span className="import-stat-label">Распознано</span>
                    </div>
                    <div className="import-stat import-stat-error">
                      <span className="import-stat-value">{importPreview.errors}</span>
                      <span className="import-stat-label">Ошибки</span>
                    </div>
                  </div>
                  {importPreview.questions.length > 0 && (
                    <div className="import-preview-questions">
                      <h4>Распознанные вопросы:</h4>
                      {importPreview.questions.slice(0, 10).map((q, i) => (
                        <div key={i} className="import-preview-question">
                          <span className="import-preview-q-num">{i + 1}</span>
                          <span className="import-preview-q-text">{q.question}</span>
                          <span className={`badge ${q.type === 'multiple' ? 'badge-warning' : 'badge-info'}`}>{q.type}</span>
                          <span className="badge">{q.points}б</span>
                        </div>
                      ))}
                      {importPreview.questions.length > 10 && (
                        <p className="text-muted">... и ещё {importPreview.questions.length - 10} вопросов</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setImportPreview(null); }}>Отмена</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={!importFile || !importPreview || importPreview.valid === 0}>
                Импортировать ({importPreview?.valid || 0} вопросов)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
