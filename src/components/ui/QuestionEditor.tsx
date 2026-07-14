import { useState } from 'react';
import RichTextEditor from './RichTextEditor';

type QuestionType = 'single' | 'multiple' | 'truefalse' | 'fill' | 'short_answer' | 'essay' | 'matching' | 'ordering' | 'numeric' | 'dropdown' | 'cloze' | 'hotspot';

type Option = {
  id: string;
  text: string;
  text_translations?: Record<string, string>;
  isCorrect: boolean;
};

type Pair = { left: string; left_translations?: Record<string, string>; right: string; right_translations?: Record<string, string> };

type Translations = {
  [key: string]: string;
};

type QuestionForm = {
  type: QuestionType;
  bodyText: string;
  bodyTranslations: Translations;
  imageUrl: string;
  options: Option[];
  correctAnswers: string[];
  correctText: string;
  correctTextTranslations: Translations;
  correctOrder: string[];
  correctOrderTranslations: Record<string, string[]>;
  correctPairs: Pair[];
  explanationText: string;
  explanationTranslations: Translations;
  hint: string;
  hintTranslations: Translations;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
};

interface QuestionEditorProps {
  form: QuestionForm;
  onChange: (form: QuestionForm) => void;
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string; desc: string }[] = [
  { value: 'single', label: 'Один ответ', icon: '⊙', desc: 'Выберите один правильный вариант' },
  { value: 'multiple', label: 'Несколько ответов', icon: '☑', desc: 'Выберите все правильные варианты' },
  { value: 'truefalse', label: 'Верно / Неверно', icon: '✓✗', desc: 'Утверждение верно или нет' },
  { value: 'fill', label: 'Заполнить пропуск', icon: '✏️', desc: 'Введите пропущенное слово' },
  { value: 'numeric', label: 'Числовой ответ', icon: '#', desc: 'Введите число' },
  { value: 'short_answer', label: 'Краткий ответ', icon: '📝', desc: 'Короткий текстовый ответ' },
  { value: 'matching', label: 'Соответствие', icon: '⇄', desc: 'Соедините пары' },
  { value: 'ordering', label: 'Порядок', icon: '↕', desc: 'Расставьте в правильном порядке' },
  { value: 'dropdown', label: 'Выпадающий список', icon: '▾', desc: 'Выберите из списка' },
  { value: 'cloze', label: 'Текст с пропусками', icon: '📄', desc: 'Заполните несколько пропусков в тексте' },
  { value: 'essay', label: 'Развёрнутый ответ', icon: '📃', desc: 'Напишите развёрнутый ответ' },
  { value: 'hotspot', label: 'Точка на изображении', icon: '🎯', desc: 'Кликните на правильную область' },
];

const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'kz', label: 'Қазақша', flag: '🇰🇿' },
];

const generateId = () => crypto.randomUUID();

export default function QuestionEditor({ form, onChange }: QuestionEditorProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [activeLang, setActiveLang] = useState('ru');

  const update = (partial: Partial<QuestionForm>) => {
    onChange({ ...form, ...partial });
  };

  const updateTranslation = (field: 'bodyTranslations' | 'explanationTranslations' | 'hintTranslations' | 'correctTextTranslations', lang: string, value: string) => {
    const current = form[field] || { ru: '', en: '', kz: '' };
    update({ [field]: { ...current, [lang]: value } });
  };

  const updateOptionTranslation = (idx: number, lang: string, value: string) => {
    const newOptions = [...form.options];
    const opt = { ...newOptions[idx] };
    opt.text_translations = { ...(opt.text_translations || {}), [lang]: value };
    newOptions[idx] = opt;
    update({ options: newOptions });
  };

  const handleOptionCorrect = (idx: number) => {
    const newOptions = form.options.map((o, i) => {
      if (i === idx) {
        return { ...o, isCorrect: form.type === 'multiple' ? !o.isCorrect : true };
      }
      return form.type === 'multiple' ? o : { ...o, isCorrect: false };
    });
    update({ options: newOptions });
  };

  const addOption = () => {
    const translations: Record<string, string> = {};
    LANGUAGES.forEach(l => { translations[l.code] = ''; });
    update({ options: [...form.options, { id: generateId(), text: '', text_translations: translations, isCorrect: false }] });
  };

  const removeOption = (idx: number) => {
    if (form.options.length <= 2) return;
    update({ options: form.options.filter((_, i) => i !== idx) });
  };

  const updateOptionText = (idx: number, text: string) => {
    update({ options: form.options.map((o, i) => i === idx ? { ...o, text } : o) });
  };

  const addPair = () => {
    const translations: Record<string, string> = {};
    LANGUAGES.forEach(l => { translations[l.code] = ''; });
    update({ correctPairs: [...form.correctPairs, { left: '', left_translations: { ...translations }, right: '', right_translations: { ...translations } }] });
  };

  const removePair = (idx: number) => {
    if (form.correctPairs.length <= 1) return;
    update({ correctPairs: form.correctPairs.filter((_, i) => i !== idx) });
  };

  const updatePair = (idx: number, side: 'left' | 'right', value: string) => {
    update({ correctPairs: form.correctPairs.map((p, i) => i === idx ? { ...p, [side]: value } : p) });
  };

  const updatePairTranslation = (idx: number, side: 'left' | 'right', lang: string, value: string) => {
    const newPairs = [...form.correctPairs];
    const pair = { ...newPairs[idx] };
    const transField = side === 'left' ? 'left_translations' : 'right_translations';
    pair[transField] = { ...(pair[transField] || {}), [lang]: value };
    newPairs[idx] = pair;
    update({ correctPairs: newPairs });
  };

  const addOrderItem = () => {
    const newOrder = [...form.correctOrder, ''];
    const newTranslations = { ...(form.correctOrderTranslations || {}) };
    LANGUAGES.forEach(l => {
      newTranslations[l.code] = [...(newTranslations[l.code] || []), ''];
    });
    update({ correctOrder: newOrder, correctOrderTranslations: newTranslations });
  };

  const removeOrderItem = (idx: number) => {
    if (form.correctOrder.length <= 2) return;
    const newTranslations = { ...(form.correctOrderTranslations || {}) };
    LANGUAGES.forEach(l => {
      if (newTranslations[l.code]) {
        newTranslations[l.code] = newTranslations[l.code].filter((_: string, i: number) => i !== idx);
      }
    });
    update({
      correctOrder: form.correctOrder.filter((_, i) => i !== idx),
      correctOrderTranslations: newTranslations,
    });
  };

  const updateOrderItem = (idx: number, value: string) => {
    update({ correctOrder: form.correctOrder.map((v, i) => i === idx ? value : v) });
  };

  const updateOrderItemTranslation = (idx: number, lang: string, value: string) => {
    const newTranslations = { ...(form.correctOrderTranslations || {}) };
    const arr = [...(newTranslations[lang] || [])];
    arr[idx] = value;
    newTranslations[lang] = arr;
    update({ correctOrderTranslations: newTranslations });
  };

  const moveOrderItem = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= form.correctOrder.length) return;
    const arr = [...form.correctOrder];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    const newTranslations = { ...(form.correctOrderTranslations || {}) };
    LANGUAGES.forEach(l => {
      if (newTranslations[l.code] && newTranslations[l.code].length > 1) {
        const tArr = [...newTranslations[l.code]];
        [tArr[idx], tArr[newIdx]] = [tArr[newIdx], tArr[idx]];
        newTranslations[l.code] = tArr;
      }
    });
    update({ correctOrder: arr, correctOrderTranslations: newTranslations });
  };

  const isOptionsType = ['single', 'multiple', 'truefalse', 'dropdown'].includes(form.type);
  const isMatchingType = form.type === 'matching';
  const isOrderingType = form.type === 'ordering';
  const isClozeType = form.type === 'cloze';
  const isHotspotType = form.type === 'hotspot';

  const steps = [
    { num: 1, label: 'Тип' },
    { num: 2, label: 'Контент' },
    { num: 3, label: 'Ответы' },
    { num: 4, label: 'Настройки' },
  ];

  return (
    <div className="question-editor">
      {/* Step Navigation */}
      <div className="editor-steps">
        {steps.map(s => (
          <button
            key={s.num}
            type="button"
            className={`editor-step ${activeStep === s.num ? 'active' : ''}`}
            onClick={() => setActiveStep(s.num)}
          >
            <span className="editor-step-num">{s.num}</span>
            <span className="editor-step-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Step 1: Type Selection */}
      {activeStep === 1 && (
        <div className="form-group">
          <label>Тип вопроса</label>
          <div className="question-type-grid">
            {QUESTION_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={`question-type-btn ${form.type === t.value ? 'active' : ''}`}
                onClick={() => {
                  let newOptions = form.options;
                  if (t.value === 'truefalse') {
                    newOptions = [
                      { id: generateId(), text: 'Верно', text_translations: { ru: 'Верно', en: 'True', kz: 'Дұрыс' }, isCorrect: false },
                      { id: generateId(), text: 'Неверно', text_translations: { ru: 'Неверно', en: 'False', kz: 'Қате' }, isCorrect: false },
                    ];
                  } else if (isOptionsType && !['single', 'multiple', 'truefalse', 'dropdown'].includes(form.type)) {
                    const translations: Record<string, string> = {};
                    LANGUAGES.forEach(l => { translations[l.code] = ''; });
                    newOptions = [
                      { id: generateId(), text: '', text_translations: { ...translations }, isCorrect: false },
                      { id: generateId(), text: '', text_translations: { ...translations }, isCorrect: false },
                      { id: generateId(), text: '', text_translations: { ...translations }, isCorrect: false },
                      { id: generateId(), text: '', text_translations: { ...translations }, isCorrect: false },
                    ];
                  }
                  update({ type: t.value, options: newOptions });
                  setActiveStep(2);
                }}
              >
                <span className="question-type-icon">{t.icon}</span>
                <span className="question-type-label">{t.label}</span>
                <span className="question-type-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Content (Question Body + Translations) */}
      {activeStep === 2 && (
        <>
          {/* Language Tabs */}
          <div className="lang-tabs">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                type="button"
                className={`lang-tab ${activeLang === lang.code ? 'active' : ''}`}
                onClick={() => setActiveLang(lang.code)}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>

          {activeLang === 'ru' ? (
            <div className="form-group">
              <label>Текст вопроса (основной)</label>
              <RichTextEditor content={form.bodyText} onChange={(html) => update({ bodyText: html })} height={150} />
            </div>
          ) : (
            <div className="form-group">
              <label>Текст вопроса ({LANGUAGES.find(l => l.code === activeLang)?.label})</label>
              <RichTextEditor
                content={form.bodyTranslations?.[activeLang] || ''}
                onChange={(html) => updateTranslation('bodyTranslations', activeLang, html)}
                height={150}
              />
            </div>
          )}

          {/* Image URL */}
          <div className="form-group">
            <label>URL картинки (необязательно)</label>
            <input type="text" value={form.imageUrl} onChange={e => update({ imageUrl: e.target.value })} placeholder="https://example.com/image.jpg" />
          </div>

          {/* Hint with translations */}
          <div className="form-group">
            <label>Подсказка (необязательно)</label>
            {activeLang === 'ru' ? (
              <input type="text" value={form.hint} onChange={e => update({ hint: e.target.value })} placeholder="Подсказка для студента" />
            ) : (
              <input
                type="text"
                value={form.hintTranslations?.[activeLang] || ''}
                onChange={e => updateTranslation('hintTranslations', activeLang, e.target.value)}
                placeholder={`Подсказка на ${LANGUAGES.find(l => l.code === activeLang)?.label}`}
              />
            )}
          </div>
        </>
      )}

      {/* Step 3: Answers */}
      {activeStep === 3 && (
        <>
          {/* Language Tabs for options */}
          <div className="lang-tabs">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                type="button"
                className={`lang-tab ${activeLang === lang.code ? 'active' : ''}`}
                onClick={() => setActiveLang(lang.code)}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>

          {/* Options (single, multiple, truefalse, dropdown) */}
          {isOptionsType && (
            <div className="form-group">
              <label>
                {form.type === 'single' && 'Варианты ответа (отметьте правильный)'}
                {form.type === 'multiple' && 'Варианты ответа (отметьте все правильные)'}
                {form.type === 'truefalse' && 'Выберите правильный ответ'}
                {form.type === 'dropdown' && 'Варианты для выпающего списка'}
              </label>
              <div className="options-editor">
                {form.options.map((opt, idx) => (
                  <div key={opt.id} className="option-row">
                    <button type="button" className={`option-correct-btn ${opt.isCorrect ? 'active' : ''}`} onClick={() => handleOptionCorrect(idx)}>
                      {opt.isCorrect ? '✓' : ''}
                    </button>
                    <div className="option-text-group">
                      {activeLang === 'ru' ? (
                        <input
                          type="text"
                          value={opt.text}
                          onChange={e => updateOptionText(idx, e.target.value)}
                          placeholder={`Вариант ${idx + 1}`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={opt.text_translations?.[activeLang] || ''}
                          onChange={e => updateOptionTranslation(idx, activeLang, e.target.value)}
                          placeholder={`Вариант ${idx + 1} (${LANGUAGES.find(l => l.code === activeLang)?.label})`}
                        />
                      )}
                    </div>
                    {form.type !== 'truefalse' && form.options.length > 2 && (
                      <button type="button" className="option-remove-btn" onClick={() => removeOption(idx)}>✕</button>
                    )}
                  </div>
                ))}
                {form.type !== 'truefalse' && (
                  <button type="button" className="option-add-btn" onClick={addOption}>+ Добавить вариант</button>
                )}
              </div>
            </div>
          )}

          {/* Fill / Short Answer */}
          {form.type === 'fill' && (
            <div className="form-group">
              <label>Правильный ответ</label>
              {activeLang === 'ru' ? (
                <input type="text" value={form.correctText} onChange={e => update({ correctText: e.target.value })} placeholder="Введите правильный ответ" />
              ) : (
                <input
                  type="text"
                  value={form.correctTextTranslations?.[activeLang] || ''}
                  onChange={e => updateTranslation('correctTextTranslations', activeLang, e.target.value)}
                  placeholder={`Ответ на ${LANGUAGES.find(l => l.code === activeLang)?.label}`}
                />
              )}
              <p className="form-hint">Ответ будет сравниваться без учёта регистра</p>
            </div>
          )}

          {form.type === 'short_answer' && (
            <div className="form-group">
              <label>Ключевые слова для проверки (через запятую)</label>
              {activeLang === 'ru' ? (
                <input type="text" value={form.correctText} onChange={e => update({ correctText: e.target.value })} placeholder="ключевое1, ключевое2" />
              ) : (
                <input
                  type="text"
                  value={form.correctTextTranslations?.[activeLang] || ''}
                  onChange={e => updateTranslation('correctTextTranslations', activeLang, e.target.value)}
                  placeholder={`Ключевые слова на ${LANGUAGES.find(l => l.code === activeLang)?.label}`}
                />
              )}
              <p className="form-hint">Ответ считается правильным, если содержит хотя бы одно ключевое слово</p>
            </div>
          )}

          {/* Numeric */}
          {form.type === 'numeric' && (
            <div className="form-group">
              <label>Правильный ответ (число)</label>
              <input type="number" value={form.correctText} onChange={e => update({ correctText: e.target.value })} placeholder="42" />
              <p className="form-hint">Допускается ответ ±10% от правильного</p>
            </div>
          )}

          {/* Essay */}
          {form.type === 'essay' && (
            <div className="form-group">
              <label>Примерный правильный ответ (для преподавателя)</label>
              {activeLang === 'ru' ? (
                <RichTextEditor content={form.correctText} onChange={(html) => update({ correctText: html })} height={150} />
              ) : (
                <RichTextEditor
                  content={form.correctTextTranslations?.[activeLang] || ''}
                  onChange={(html) => updateTranslation('correctTextTranslations', activeLang, html)}
                  height={150}
                />
              )}
              <p className="form-hint">Этот ответ виден только преподавателю при проверке</p>
            </div>
          )}

          {/* Matching */}
          {isMatchingType && (
            <div className="form-group">
              <label>Пары для соответствия</label>
              <div className="matching-editor">
                <div className="matching-header">
                  <span>Левая колонка</span>
                  <span>Правая колонка</span>
                  <span style={{ width: 40 }}></span>
                </div>
                {form.correctPairs.map((pair, idx) => (
                  <div key={idx} className="matching-row">
                    {activeLang === 'ru' ? (
                      <>
                        <input type="text" value={pair.left} onChange={e => updatePair(idx, 'left', e.target.value)} placeholder={`Элемент ${idx + 1}`} />
                        <input type="text" value={pair.right} onChange={e => updatePair(idx, 'right', e.target.value)} placeholder={`Соответствие ${idx + 1}`} />
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={pair.left_translations?.[activeLang] || ''}
                          onChange={e => updatePairTranslation(idx, 'left', activeLang, e.target.value)}
                          placeholder={`Элемент (${LANGUAGES.find(l => l.code === activeLang)?.label})`}
                        />
                        <input
                          type="text"
                          value={pair.right_translations?.[activeLang] || ''}
                          onChange={e => updatePairTranslation(idx, 'right', activeLang, e.target.value)}
                          placeholder={`Соответствие (${LANGUAGES.find(l => l.code === activeLang)?.label})`}
                        />
                      </>
                    )}
                    {form.correctPairs.length > 1 && (
                      <button type="button" className="option-remove-btn" onClick={() => removePair(idx)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="option-add-btn" onClick={addPair}>+ Добавить пару</button>
              </div>
            </div>
          )}

          {/* Ordering */}
          {isOrderingType && (
            <div className="form-group">
              <label>Правильный порядок (сверху вниз)</label>
              <div className="ordering-editor">
                {form.correctOrder.map((item, idx) => (
                  <div key={idx} className="ordering-row">
                    <span className="ordering-number">{idx + 1}</span>
                    {activeLang === 'ru' ? (
                      <input type="text" value={item} onChange={e => updateOrderItem(idx, e.target.value)} placeholder={`Элемент ${idx + 1}`} />
                    ) : (
                      <input
                        type="text"
                        value={form.correctOrderTranslations?.[activeLang]?.[idx] || ''}
                        onChange={e => updateOrderItemTranslation(idx, activeLang, e.target.value)}
                        placeholder={`Элемент ${idx + 1} (${LANGUAGES.find(l => l.code === activeLang)?.label})`}
                      />
                    )}
                    <div className="ordering-arrows">
                      <button type="button" className="ordering-arrow-btn" onClick={() => moveOrderItem(idx, -1)} disabled={idx === 0}>↑</button>
                      <button type="button" className="ordering-arrow-btn" onClick={() => moveOrderItem(idx, 1)} disabled={idx === form.correctOrder.length - 1}>↓</button>
                    </div>
                    {form.correctOrder.length > 2 && (
                      <button type="button" className="option-remove-btn" onClick={() => removeOrderItem(idx)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="option-add-btn" onClick={addOrderItem}>+ Добавить элемент</button>
              </div>
            </div>
          )}

          {/* Dropdown */}
          {form.type === 'dropdown' && (
            <div className="form-group">
              <label>Текст с пропуском [___]</label>
              <RichTextEditor content={form.bodyText} onChange={(html) => update({ bodyText: html })} height={100} />
              <p className="form-hint">Используйте [___] для обозначения пропуска в тексте</p>
            </div>
          )}

          {/* Cloze */}
          {isClozeType && (
            <div className="form-group">
              <label>Текст с пропусками</label>
              <RichTextEditor content={form.bodyText} onChange={(html) => update({ bodyText: html })} height={200} />
              <p className="form-hint">Используйте [ответ] для обозначения пропуска. Пример: Столица Франции — [Париж]</p>
            </div>
          )}

          {/* Hotspot */}
          {isHotspotType && (
            <div className="form-group">
              <label>URL изображения</label>
              <input type="text" value={form.imageUrl} onChange={e => update({ imageUrl: e.target.value })} placeholder="https://example.com/diagram.jpg" />
              <p className="form-hint">Студент должен кликнуть на правильную область изображения</p>
            </div>
          )}
        </>
      )}

      {/* Step 4: Settings (Explanation, Difficulty, Points) */}
      {activeStep === 4 && (
        <>
          {/* Language Tabs for explanation */}
          <div className="lang-tabs">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                type="button"
                className={`lang-tab ${activeLang === lang.code ? 'active' : ''}`}
                onClick={() => setActiveLang(lang.code)}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>

          {/* Explanation with translations */}
          <div className="form-group">
            <label>Объяснение (показывается после ответа)</label>
            {activeLang === 'ru' ? (
              <RichTextEditor content={form.explanationText} onChange={(html) => update({ explanationText: html })} height={120} />
            ) : (
              <RichTextEditor
                content={form.explanationTranslations?.[activeLang] || ''}
                onChange={(html) => updateTranslation('explanationTranslations', activeLang, html)}
                height={120}
              />
            )}
          </div>

          {/* Difficulty & Points */}
          <div className="form-row">
            <div className="form-group">
              <label>Сложность</label>
              <select value={form.difficulty} onChange={e => update({ difficulty: e.target.value as any })}>
                <option value="easy">Легко</option>
                <option value="medium">Средне</option>
                <option value="hard">Сложно</option>
              </select>
            </div>
            <div className="form-group">
              <label>Баллы</label>
              <input type="number" value={form.points} onChange={e => update({ points: parseInt(e.target.value) || 1 })} min="1" />
            </div>
          </div>
        </>
      )}

      {/* Step Navigation Buttons */}
      <div className="editor-step-nav">
        {activeStep > 1 && (
          <button type="button" className="btn btn-secondary" onClick={() => setActiveStep(activeStep - 1)}>← Назад</button>
        )}
        {activeStep < 4 && (
          <button type="button" className="btn btn-primary" onClick={() => setActiveStep(activeStep + 1)}>Далее →</button>
        )}
      </div>
    </div>
  );
}

export { generateId };
export type { QuestionForm, QuestionType, Translations };
