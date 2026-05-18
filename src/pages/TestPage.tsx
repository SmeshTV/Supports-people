import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, supabaseAdmin, type TestSet, type Question, type Category } from '../lib/supabase';
import { useTestStore } from '../store/testStore';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../lib/i18n';
import { getTranslation } from '../lib/translations';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function checkAnswer(question: Question, selectedIds: string[], textAnswer: string, orderAnswer: string[], matchAnswer: { left: string; right: string }[], language: string): boolean {
  const correct = question.correct_answers;

  if (question.type === 'single' || question.type === 'truefalse' || question.type === 'dropdown') {
    return selectedIds.length === 1 && selectedIds[0] === correct[0];
  }

  if (question.type === 'multiple') {
    return (
      selectedIds.length === correct.length &&
      selectedIds.every((id) => correct.includes(id)) &&
      correct.every((id) => selectedIds.includes(id))
    );
  }

  if (question.type === 'fill') {
    const correctText = getTranslation((question as any).correct_text_translations, question.correct_text || '', language);
    return textAnswer.trim().toLowerCase() === correctText.trim().toLowerCase();
  }

  if (question.type === 'numeric') {
    const expected = parseFloat(question.correct_text || '0');
    const actual = parseFloat(textAnswer);
    if (isNaN(actual)) return false;
    return Math.abs(actual - expected) <= expected * 0.1;
  }

  if (question.type === 'short_answer') {
    const correctText = getTranslation((question as any).correct_text_translations, question.correct_text || '', language);
    const keywords = correctText.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    return keywords.some(kw => textAnswer.toLowerCase().includes(kw));
  }

  if (question.type === 'ordering') {
    const correctOrder = question.correct_order || [];
    return orderAnswer.length === correctOrder.length && orderAnswer.every((v, i) => v === correctOrder[i]);
  }

  if (question.type === 'matching') {
    const correctPairs = question.correct_pairs || [];
    if (matchAnswer.length !== correctPairs.length) return false;
    return matchAnswer.every(ma => correctPairs.some(cp => cp.left === ma.left && cp.right === ma.right));
  }

  if (question.type === 'cloze') {
    const regex = /\[([^\]]+)\]/g;
    const bodyText = getTranslation((question.body as any)?.text_translations, (question.body as any)?.text || '', language);
    const correctAnswers: string[] = [];
    let match;
    while ((match = regex.exec(bodyText)) !== null) {
      correctAnswers.push(match[1].trim().toLowerCase());
    }
    const userAnswers = textAnswer.split('||').map(a => a.trim().toLowerCase());
    return correctAnswers.every((ca, i) => userAnswers[i] === ca);
  }

  if (question.type === 'essay') {
    return true;
  }

  if (question.type === 'hotspot') {
    return selectedIds.length > 0;
  }

  return false;
}

export default function TestPage() {
  const { language } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentTest, questions, currentIndex, answers, isFinished,
    showExplanation, lastAnswerCorrect,
    startTest, answerQuestion, nextQuestion, resetTest,
  } = useTestStore();

  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [orderAnswer, setOrderAnswer] = useState<string[]>([]);
  const [matchAnswer, setMatchAnswer] = useState<{ left: string; right: string }[]>([]);
  const [testSet, setTestSet] = useState<TestSet | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<any[]>([]);
  const [shuffledOrderOptions, setShuffledOrderOptions] = useState<string[]>([]);
  const [matchRightShuffled, setMatchRightShuffled] = useState<string[]>([]);

  const getQuestionBodyText = (question: Question): string => {
    return getTranslation((question.body as any)?.text_translations, (question.body as any)?.text || '', language);
  };

  const getOptionText = (option: any): string => {
    return getTranslation(option.text_translations, option.text || '', language);
  };

  const getExplanationText = (question: Question): string => {
    return getTranslation((question.explanation as any)?.text_translations, (question.explanation as any)?.text || '', language);
  };

  const getHintText = (question: Question): string => {
    return getTranslation((question as any).hint_translations, question.hint || '', language);
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      single: language === 'en' ? 'Single choice' : language === 'kk' ? 'Бір жауап' : 'Один ответ',
      multiple: language === 'en' ? 'Multiple choice' : language === 'kk' ? 'Көп жауап' : 'Несколько ответов',
      truefalse: language === 'en' ? 'True/False' : language === 'kk' ? 'Шын/Жалған' : 'Верно/Неверно',
      fill: language === 'en' ? 'Fill in blank' : language === 'kk' ? 'Бос орын' : 'Заполнить пропуск',
      numeric: language === 'en' ? 'Numeric' : language === 'kk' ? 'Сандық' : 'Числовой',
      short_answer: language === 'en' ? 'Short answer' : language === 'kk' ? 'Қысқа жауап' : 'Краткий ответ',
      matching: language === 'en' ? 'Matching' : language === 'kk' ? 'Сәйкестендіру' : 'Соответствие',
      ordering: language === 'en' ? 'Ordering' : language === 'kk' ? 'Реттілік' : 'Порядок',
      dropdown: language === 'en' ? 'Dropdown' : language === 'kk' ? 'Выпадающий список' : 'Выпадающий список',
      cloze: language === 'en' ? 'Cloze' : language === 'kk' ? 'Мәтінмен жұмыс' : 'Текст с пропусками',
      essay: language === 'en' ? 'Essay' : language === 'kk' ? 'Эссе' : 'Развёрнутый ответ',
      hotspot: language === 'en' ? 'Hotspot' : language === 'kk' ? 'Нүкте' : 'Точка на изображении',
    };
    return labels[type] || type;
  };

  const getDifficultyLabel = (difficulty: string): string => {
    if (difficulty === 'easy') return language === 'en' ? 'Easy' : language === 'kk' ? 'Оңай' : 'Легко';
    if (difficulty === 'hard') return language === 'en' ? 'Hard' : language === 'kk' ? 'Қиын' : 'Сложно';
    return language === 'en' ? 'Medium' : language === 'kk' ? 'Орташа' : 'Средне';
  };

  useEffect(() => {
    if (!id) return;
    const fetchTest = async () => {
      const { data: ts } = await supabase.from('test_sets').select('*').eq('id', id).maybeSingle();
      if (!ts) { navigate('/subjects'); return; }
      const tsCast = ts as TestSet;
      setTestSet(tsCast);

      let questions: Question[] = [];
      if (tsCast.question_ids && tsCast.question_ids.length > 0) {
        const { data: qs } = await supabase.from('questions').select('*').in('id', tsCast.question_ids);
        questions = (qs as Question[]) ?? [];
      } else if (tsCast.subject_id) {
        const { data: cats } = await supabase.from('categories').select('id').eq('subject_id', tsCast.subject_id);
        const catIds = (cats as Category[] || []).map(c => c.id);
        if (catIds.length > 0) {
          const { data: qs } = await supabase.from('questions').select('*').in('category_id', catIds);
          questions = (qs as Question[]) ?? [];
        }
      }

      if (questions.length > 0) {
        startTest(tsCast, questions);
      }
      setLoading(false);
    };
    fetchTest();
    return () => resetTest();
  }, [id, navigate, startTest, resetTest]);

  useEffect(() => {
    if (!questions[currentIndex]) return;
    setSelectedIds([]);
    setTextAnswer('');
    const q = questions[currentIndex];

    if (q.type === 'ordering') {
      const shuffled = [...(q.correct_order || [])].sort(() => Math.random() - 0.5);
      setShuffledOrderOptions(shuffled);
      setOrderAnswer([]);
    }

    if (q.type === 'matching') {
      const pairs = q.correct_pairs || [];
      const shuffledRight = [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
      setMatchRightShuffled(shuffledRight);
      setMatchAnswer(pairs.map(p => ({ left: p.left, right: '' })));
    }

    if (['single', 'multiple', 'truefalse', 'dropdown'].includes(q.type) && q.options) {
      const opts = [...q.options].sort(() => Math.random() - 0.5);
      setShuffledOptions(opts);
    } else {
      setShuffledOptions(q.options || []);
    }
  }, [currentIndex, questions]);

  useEffect(() => {
    if (isFinished && testSet) { saveAttemptAndNavigate(); }
  }, [isFinished]);

  const saveAttemptAndNavigate = async () => {
    const score = answers.filter((a) => a.is_correct).reduce((sum, a) => {
      const q = questions.find((q) => q.id === a.question_id);
      return sum + (q?.points ?? 1);
    }, 0);
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
    const passed = maxScore > 0 && (score / maxScore) * 100 >= (testSet?.settings.passing_score_pct ?? 70);

    const attemptData = { test_set_id: id, user_id: user?.id ?? null, started_at: new Date().toISOString(), finished_at: new Date().toISOString(), answers, score, max_score: maxScore, passed };

    if (user) {
      await supabase.from('test_attempts').insert(attemptData);
      const today = new Date().toISOString().split('T')[0];
      const { data: streak } = await supabaseAdmin.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle();

      if (streak) {
        const lastDate = streak.last_activity_date;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let newStreak = streak.current_streak;
        if (lastDate === yesterday) {
          newStreak = streak.current_streak + 1;
        } else if (lastDate !== today) {
          newStreak = 1;
        }
        await supabaseAdmin.from('user_streaks').update({
          current_streak: newStreak,
          longest_streak: Math.max(streak.longest_streak, newStreak),
          last_activity_date: today
        }).eq('user_id', user.id);
      } else {
        await supabaseAdmin.from('user_streaks').insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today
        });
      }
      navigate(`/results/${id}`, { state: { attempt: { ...attemptData, id }, questions, testSet } });
      return;
    }
    navigate('/results/guest', { state: { attempt: { ...attemptData, id: 'guest' }, questions, testSet } });
  };

  const handleStartTest = () => {
    setShowIntro(false);
    setTestStarted(true);
  };

  const handleConfirm = useCallback(() => {
    const question = questions[currentIndex];
    if (!question) return;

    if (['single', 'multiple', 'truefalse', 'dropdown'].includes(question.type) && selectedIds.length === 0) return;
    if (['fill', 'numeric', 'short_answer'].includes(question.type) && !textAnswer.trim()) return;
    if (question.type === 'ordering' && orderAnswer.length === 0) return;
    if (question.type === 'matching' && matchAnswer.some(m => !m.right.trim())) return;

    const isCorrect = checkAnswer(question, selectedIds, textAnswer, orderAnswer, matchAnswer, language);
    answerQuestion(question.id, selectedIds, isCorrect);
  }, [selectedIds, textAnswer, orderAnswer, matchAnswer, questions, currentIndex, answerQuestion]);

  const handleNext = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!testStarted || showExplanation) {
        if (e.key === 'Enter' && showExplanation) handleNext();
        return;
      }
      const question = questions[currentIndex];
      if (!question) return;
      if (['single', 'multiple', 'truefalse', 'dropdown'].includes(question.type)) {
        const opts = shuffledOptions;
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < opts.length) {
          const opt = opts[idx];
          if (question.type === 'multiple') {
            setSelectedIds(prev => prev.includes(opt.id) ? prev.filter(id => id !== opt.id) : [...prev, opt.id]);
          } else {
            setSelectedIds([opt.id]);
          }
        }
      }
      if (e.key === 'Enter') handleConfirm();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showExplanation, questions, currentIndex, shuffledOptions, handleConfirm, handleNext, testStarted]);

  if (loading || !currentTest) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Загрузка теста...</p>
        </div>
      </div>
    );
  }

  if (showIntro && testSet) {
    return (
      <div className="page-container">
        <div className="container" style={{ maxWidth: 600, paddingTop: 80 }}>
          <div className="intro-modal">
            <div className="intro-modal-header">
              <div className="intro-modal-icon">📋</div>
              <h2>{testSet.name}</h2>
            </div>

            {testSet.description && (
              <div className="intro-modal-section">
                <h3>📝 Описание</h3>
                <p>{testSet.description}</p>
              </div>
            )}

            {(testSet as any).source_description && (
              <div className="intro-modal-section">
                <h3>📚 Источник вопросов</h3>
                <p>{(testSet as any).source_description}</p>
              </div>
            )}

            <div className="intro-modal-section">
              <h3>📊 Информация о тесте</h3>
              <div className="intro-info-grid">
                <div className="intro-info-item">
                  <span className="intro-info-label">Вопросов</span>
                  <span className="intro-info-value">{questions.length}</span>
                </div>
                <div className="intro-info-item">
                  <span className="intro-info-label">Режим</span>
                  <span className={`badge ${testSet.settings?.mode === 'exam' ? 'badge-warning' : 'badge-success'}`}>
                    {testSet.settings?.mode === 'exam' ? 'Экзамен' : 'Практика'}
                  </span>
                </div>
                <div className="intro-info-item">
                  <span className="intro-info-label">Проходной балл</span>
                  <span className="intro-info-value">{testSet.settings?.passing_score_pct || 70}%</span>
                </div>
                <div className="intro-info-item">
                  <span className="intro-info-label">Макс. баллов</span>
                  <span className="intro-info-value">{questions.reduce((s, q) => s + q.points, 0)}</span>
                </div>
                <div className="intro-info-item">
                  <span className="intro-info-label">Перемешивание</span>
                  <span className="intro-info-value">{testSet.settings?.shuffle_questions ? 'Да' : 'Нет'}</span>
                </div>
                <div className="intro-info-item">
                  <span className="intro-info-label">Попытки</span>
                  <span className="intro-info-value">{testSet.settings?.allow_retakes ? 'Без ограничений' : '1'}</span>
                </div>
              </div>
            </div>

            <div className="intro-modal-warning">
              <p>⚠️ Внимательно читайте каждый вопрос перед ответом. Для вопросов с несколькими ответами выберите все правильные варианты.</p>
            </div>

            <div className="intro-modal-actions">
              <button className="btn btn-ghost" onClick={() => navigate(-1)}>Отмена</button>
              <button className="btn btn-primary btn-lg" onClick={handleStartTest}>
                ▶ Начать тест
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  if (!question) return null;

  const alreadyAnswered = answers.find((a) => a.question_id === question.id);
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const correctCount = answers.filter((a) => a.is_correct).length;

  const needsTextAnswer = ['fill', 'numeric', 'short_answer', 'essay', 'cloze'].includes(question.type);
  const needsOrdering = question.type === 'ordering';
  const needsMatching = question.type === 'matching';

  return (
    <div className="test-page">
      <div className="test-header">
        <div className="container">
          <div className="test-header-inner">
            <div className="test-progress">
              <span className="test-progress-text">
                Вопрос {currentIndex + 1} из {questions.length}
              </span>
              <div className="test-progress-bar">
                <div className="test-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="badge badge-success">{correctCount} правильных</span>
            </div>
            <span className="test-timer">{currentTest.name}</span>
          </div>
        </div>
      </div>

      <div className="test-content">
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="test-question-number">{language === 'en' ? 'Question' : language === 'kk' ? 'Сұрақ' : 'Вопрос'} {currentIndex + 1}</span>
            <span className="badge badge-info">{getTypeLabel(question.type)}</span>
            <span className={`badge ${question.difficulty === 'easy' ? 'badge-success' : question.difficulty === 'hard' ? 'badge-warning' : 'badge-info'}`}>
              {getDifficultyLabel(question.difficulty)}
            </span>
            <span className="badge">{question.points} {language === 'en' ? 'pts' : language === 'kk' ? 'ұпай' : 'балл'}</span>
            {question.type === 'multiple' && <span className="badge badge-warning">{language === 'en' ? 'Select all' : language === 'kk' ? 'Барлығын таңдаңыз' : 'Выберите все'}</span>}
          </div>

          <h2 className="test-question-text" dangerouslySetInnerHTML={{ __html: getQuestionBodyText(question) }} />

          {(question.body as any)?.image_url && (
            <img src={(question.body as any).image_url} alt="Question" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12, marginBottom: 16 }} />
          )}

          {question.hint && !showExplanation && !alreadyAnswered && (
            <div className="test-hint">💡 {getHintText(question)}</div>
          )}

          {/* Options (single, multiple, truefalse, dropdown) */}
          {['single', 'multiple', 'truefalse', 'dropdown'].includes(question.type) && (
            <div className="options-list">
              {shuffledOptions.map((option, i) => {
                const optionSelected = selectedIds.includes(option.id);
                const isCorrect = question.correct_answers.includes(option.id);
                const wasSelected = selectedIds.includes(option.id) || (alreadyAnswered?.selected_option_ids.includes(option.id));

                let borderColor = 'var(--border)';
                let backgroundColor = 'var(--bg-card)';
                let iconBg = 'var(--bg-tertiary)';
                let iconColor = 'var(--text-muted)';
                let showCheck = false;
                let showX = false;

                if (showExplanation || alreadyAnswered) {
                  if (isCorrect) {
                    borderColor = 'var(--success)';
                    backgroundColor = 'var(--success-soft)';
                    iconBg = 'var(--success)';
                    iconColor = 'white';
                    showCheck = true;
                  } else if (wasSelected && !isCorrect) {
                    borderColor = 'var(--danger)';
                    backgroundColor = 'var(--danger-soft)';
                    iconBg = 'var(--danger)';
                    iconColor = 'white';
                    showX = true;
                  }
                } else if (optionSelected) {
                  borderColor = 'var(--accent)';
                  backgroundColor = 'var(--accent-soft)';
                  iconBg = 'var(--accent)';
                  iconColor = 'white';
                }

                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      if (showExplanation || alreadyAnswered) return;
                      if (question.type === 'multiple') {
                        setSelectedIds(prev => prev.includes(option.id) ? prev.filter(id => id !== option.id) : [...prev, option.id]);
                      } else {
                        setSelectedIds([option.id]);
                      }
                    }}
                    className={`option-card ${optionSelected && !showExplanation && !alreadyAnswered ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && !showExplanation && !alreadyAnswered && (question.type === 'multiple' ? setSelectedIds(prev => prev.includes(option.id) ? prev.filter(id => id !== option.id) : [...prev, option.id]) : setSelectedIds([option.id]))}
                    style={{
                      border: `2px solid ${borderColor}`,
                      background: backgroundColor,
                      cursor: showExplanation || alreadyAnswered ? 'default' : 'pointer'
                    }}
                  >
                    <div className="option-letter" style={{ background: iconBg, color: iconColor, border: 'none' }}>
                      {showCheck ? (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : showX ? (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        LETTERS[i]
                      )}
                    </div>
                    <span className="option-text">{getOptionText(option)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fill / Numeric / Short Answer / Essay / Cloze */}
          {needsTextAnswer && !showExplanation && !alreadyAnswered && (
            <div className="text-answer-section">
              {question.type === 'essay' ? (
                <textarea
                  value={textAnswer}
                  onChange={e => setTextAnswer(e.target.value)}
                  placeholder="Напишите развёрнутый ответ..."
                  rows={8}
                  className="text-answer-input"
                />
              ) : (
                <input
                  type={question.type === 'numeric' ? 'number' : 'text'}
                  value={textAnswer}
                  onChange={e => setTextAnswer(e.target.value)}
                  placeholder={
                    question.type === 'fill' ? 'Введите пропущенное слово...' :
                    question.type === 'numeric' ? 'Введите число...' :
                    question.type === 'cloze' ? 'Введите ответы через || ...' :
                    'Введите ответ...'
                  }
                  className="text-answer-input"
                />
              )}
              {question.type === 'cloze' && <p className="form-hint">Введите ответы для каждого пропуска, разделяя их символом ||</p>}
            </div>
          )}

          {/* Show correct answer after explanation for text types */}
          {(showExplanation || alreadyAnswered) && needsTextAnswer && (
            <div className="correct-answer-display">
              <p>Правильный ответ: <strong>{question.correct_text || '—'}</strong></p>
            </div>
          )}

          {/* Ordering */}
          {needsOrdering && !showExplanation && !alreadyAnswered && (
            <div className="ordering-test-section">
              <p className="ordering-instruction">Расставьте элементы в правильном порядке:</p>
              <div className="ordering-test-list">
                {shuffledOrderOptions.map((item) => {
                  const orderIdx = orderAnswer.indexOf(item);
                  if (orderIdx === -1) {
                    return (
                      <div key={item} className="ordering-test-item" onClick={() => setOrderAnswer(prev => [...prev, item])}>
                        {item}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
              <h4 style={{ marginTop: 20, marginBottom: 10 }}>Ваш порядок:</h4>
              <div className="ordering-test-placed">
                {orderAnswer.map((item, i) => (
                  <div key={item} className="ordering-test-placed-item" onClick={() => setOrderAnswer(prev => prev.filter(v => v !== item))}>
                    <span className="ordering-placed-num">{i + 1}</span>
                    {item}
                    <span className="ordering-remove">×</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ordering correct display */}
          {(showExplanation || alreadyAnswered) && needsOrdering && (
            <div className="correct-answer-display">
              <p>Правильный порядок:</p>
              <ol className="correct-order-list">
                {(question.correct_order || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Matching */}
          {needsMatching && !showExplanation && !alreadyAnswered && (
            <div className="matching-test-section">
              <p className="matching-instruction">Соедините элементы из левой колонки с правой:</p>
              <div className="matching-test-grid">
                <div className="matching-test-col">
                  <h4>Левая колонка</h4>
                  {matchAnswer.map((m, i) => (
                    <div key={i} className="matching-test-left">{m.left}</div>
                  ))}
                </div>
                <div className="matching-test-col">
                  <h4>Правая колонка</h4>
                  {matchAnswer.map((m, i) => (
                    <select
                      key={i}
                      value={m.right}
                      onChange={e => {
                        const newMatch = [...matchAnswer];
                        newMatch[i] = { ...newMatch[i], right: e.target.value };
                        setMatchAnswer(newMatch);
                      }}
                      className="matching-test-select"
                    >
                      <option value="">Выберите...</option>
                      {matchRightShuffled.map((opt, j) => (
                        <option key={j} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Matching correct display */}
          {(showExplanation || alreadyAnswered) && needsMatching && (
            <div className="correct-answer-display">
              <p>Правильные соответствия:</p>
              <div className="matching-correct-list">
                {(question.correct_pairs || []).map((pair, i) => (
                  <div key={i} className="matching-correct-item">
                    <span className="matching-correct-left">{pair.left}</span>
                    <span className="matching-correct-arrow">→</span>
                    <span className="matching-correct-right">{pair.right}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!showExplanation && !alreadyAnswered && (
            <div className="test-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleConfirm}
                disabled={
                  (['single', 'multiple', 'truefalse', 'dropdown'].includes(question.type) && selectedIds.length === 0) ||
                  (needsTextAnswer && !textAnswer.trim()) ||
                  (needsOrdering && orderAnswer.length === 0) ||
                  (needsMatching && matchAnswer.some(m => !m.right.trim()))
                }
                style={{ width: '100%' }}
              >
                Подтвердить ответ
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          )}

          {(showExplanation || alreadyAnswered) && (
            <div style={{
              borderRadius: '12px',
              padding: '24px',
              border: `2px solid ${lastAnswerCorrect ?? alreadyAnswered?.is_correct ? 'var(--success)' : 'var(--danger)'}`,
              background: lastAnswerCorrect ?? alreadyAnswered?.is_correct ? 'var(--success-soft)' : 'var(--danger-soft)',
              marginTop: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: lastAnswerCorrect ?? alreadyAnswered?.is_correct ? 'var(--success)' : 'var(--danger)',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  {lastAnswerCorrect ?? alreadyAnswered?.is_correct ? '✓' : '✗'}
                </div>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: lastAnswerCorrect ?? alreadyAnswered?.is_correct ? 'var(--success)' : 'var(--danger)'
                }}>
                  {lastAnswerCorrect ?? alreadyAnswered?.is_correct ? 'Правильно!' : 'Неправильно'}
                </span>
              </div>
              {question.explanation && (
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid var(--border)'
                }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{language === 'en' ? 'Explanation:' : language === 'kk' ? 'Түсіндірме:' : 'Объяснение:'}</p>
                  <div dangerouslySetInnerHTML={{ __html: getExplanationText(question) }} style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }} />
                </div>
              )}
              <button className="btn btn-primary btn-lg" onClick={handleNext} style={{ width: '100%' }}>
                {currentIndex + 1 >= questions.length ? (language === 'en' ? 'See Results' : language === 'kk' ? 'Нәтижелерді көр' : 'Посмотреть результаты') : (language === 'en' ? 'Next Question' : language === 'kk' ? 'Келесі сұрақ' : 'Следующий вопрос')}
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          {['single', 'multiple', 'truefalse', 'dropdown'].includes(question.type) && (
            <>Нажмите <kbd style={{ padding: '4px 8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'monospace' }}>1-{shuffledOptions.length}</kbd> для выбора
            <span style={{ margin: '0 8px' }}>·</span></>
          )}
          Нажмите <kbd style={{ padding: '4px 8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'monospace' }}>Enter</kbd> для подтверждения
        </div>
      </div>
    </div>
  );
}
