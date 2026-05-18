import { useEffect, useState, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type Subject, type TestSet } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../lib/i18n';

const ICONS: Record<string, JSX.Element> = {
  chart: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  leaf: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  globe: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  flash: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  book: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  brain: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M12 18v4"/></svg>,
  atom: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>,
  calculator: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/></svg>,
  music: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  palette: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>,
};

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const { t } = useI18n();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: s }, { data: attempts }] = await Promise.all([
        supabase.from('subjects').select('*').eq('is_published', true).order('order_index').limit(6),
        supabase.from('test_attempts').select('test_set_id'),
      ]);
      
      // Count attempts per test_set
      const testCounts: Record<string, number> = {};
      (attempts || []).forEach((a: any) => {
        if (a.test_set_id) testCounts[a.test_set_id] = (testCounts[a.test_set_id] || 0) + 1;
      });
      
      // Get all test sets and sort by popularity
      const { data: allTestSets } = await supabase.from('test_sets').select('*').eq('is_published', true);
      
      // Sort by popularity (most attempts first)
      const sortedTestSets = (allTestSets as TestSet[] || []).sort((a, b) => 
        (testCounts[b.id] || 0) - (testCounts[a.id] || 0)
      );
      
      // Take top 6 (divisible by 3)
      const popularTestSets = sortedTestSets.slice(0, 6);
      
      setSubjects((s as Subject[]) ?? []);
      setTestSets(popularTestSets);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <main>
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient hero-gradient-1" />
          <div className="hero-gradient hero-gradient-2" />
          <div className="hero-grid" />
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge animate-fade-in">
              <span className="hero-badge-dot" />
              {t('home.stats.free', 'Бесплатно — без карты')}
            </div>
            <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {t('home.hero', 'Превратите обучение в')}
              <br />
              <span className="hero-title-accent">{t('home.heroAccent', 'уверенный успех')}</span>
            </h1>
            <p className="hero-description animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {t('home.heroDesc', 'Интерактивные тесты с мгновенной обратной связью и подробными объяснениями. Изучайте эффективнее, достигайте лучших результатов.')}
            </p>
            <div className="hero-actions animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/directions" className="btn btn-primary btn-lg">
                {t('home.exploreSubjects', 'Начать обучение')}
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              {!user && (
                <button className="btn btn-secondary btn-lg" onClick={() => openAuthModal('register')}>
                  {t('home.createAccount', 'Создать аккаунт')}
                </button>
              )}
            </div>
            <div className="hero-features animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                { icon: '✓', text: t('home.features.0', 'Мгновенная обратная связь') },
                { icon: '✓', text: t('home.features.1', 'Подробные объяснения') },
                { icon: '✓', text: t('home.features.2', 'Отслеживание прогресса') },
              ].map((f) => (
                <div key={f.text} className="hero-feature">
                  <div className="hero-feature-icon">{f.icon}</div>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-value">{subjects.length || 0}</div>
              <div className="stat-label">{t('home.stats.subjects', 'Предметов')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{testSets.length * 25}+</div>
              <div className="stat-label">{t('home.stats.questions', 'Вопросов')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">100%</div>
              <div className="stat-label">{t('home.stats.free', 'Бесплатно')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('home.browseSubjects', 'Популярные предметы')}</h2>
            <Link to="/subjects" className="btn btn-ghost btn-sm">
              {t('home.allSubjects', 'Все предметы')}
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="subjects-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="subject-skeleton skeleton" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="empty-state-title">{t('home.noSubjects', 'Предметы скоро появятся')}</h3>
              <p className="empty-state-description">{t('home.noSubjectsDesc', 'Скоро здесь будет много интересных предметов для изучения')}</p>
            </div>
          ) : (
            <div className="subjects-grid">
              {subjects.map((subject, i) => {
                const gradient = GRADIENTS[i % GRADIENTS.length];
                const icon = ICONS[subject.icon] || ICONS.book;
                return (
                  <Link key={subject.id} to={`/subjects/${subject.id}`} className="subject-card">
                    <div className="subject-card-inner">
                      <div className="subject-card-header" style={{ background: gradient }}>
                        <div className="subject-card-icon">{icon}</div>
                      </div>
                      <div className="subject-card-body">
                        <h3 className="subject-card-title">{subject.name}</h3>
                        <p className="subject-card-desc">{subject.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: 'var(--bg-secondary)', padding: '64px 0' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('home.popularTests', 'Рекомендуемые тесты')}</h2>
          </div>

          {testSets.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="empty-state-title">{t('home.noTests', 'Тесты скоро появятся')}</h3>
              <p className="empty-state-description">{t('home.noTestsDesc', 'Создайте первый тест в админ панели')}</p>
            </div>
          ) : (
            <div className="tests-grid">
              {testSets.map((ts) => (
                <Link key={ts.id} to={`/test/${ts.id}`} className="test-card">
                  <div className="test-card-inner">
                    <div className="test-card-header">
                      <div>
                        <h3 className="test-card-title">{ts.name}</h3>
                        <p className="test-card-desc">{ts.description}</p>
                      </div>
                      <span className={`badge ${ts.settings.mode === 'exam' ? 'badge-warning' : 'badge-success'}`}>
                        {ts.settings.mode === 'exam' ? 'Экзамен' : 'Практика'}
                      </span>
                    </div>
                    <div className="test-card-meta">
                      <div className="test-card-meta-item">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {ts.question_ids.length} вопросов
                      </div>
                      <div className="test-card-meta-item">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Проходной: {ts.settings.passing_score_pct}%
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {!user && (
        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div className="cta-icon">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="cta-title">{t('home.trackProgress', 'Отслеживайте свой прогресс')}</h2>
              <p className="cta-description">
                {t('home.trackProgressDesc', 'Создайте бесплатный аккаунт чтобы сохранять результаты, отслеживать серии и видеть улучшения со временем.')}
              </p>
              <button className="btn btn-primary btn-lg" onClick={() => openAuthModal('register')}>
                {t('home.startFree', 'Начать бесплатно')}
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}