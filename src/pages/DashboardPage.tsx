import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ tests: 0, avg: 0, best: 0, streak: 0 });
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      const [{ data: attempts }, { data: streak }] = await Promise.all([
        supabase.from('test_attempts').select('*').eq('user_id', user.id).order('finished_at', { ascending: false }).limit(10),
        supabaseAdmin.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle()
      ]);
      
      if (attempts && attempts.length > 0) {
        const scores = attempts.map((r: any) => r.max_score > 0 ? Math.round((r.score / r.max_score) * 100) : 0);
        setStats({
          tests: attempts.length,
          avg: Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length),
          best: Math.max(...scores),
          streak: streak?.current_streak || 0,
        });
        setRecentTests(attempts);
      } else {
        setStats({
          tests: 0,
          avg: 0,
          best: 0,
          streak: streak?.current_streak || 0,
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Добро пожаловать, {user?.display_name || 'Студент'}!</h1>
            <p className="page-subtitle">Ваш прогресс в обучении</p>
          </div>
          {user && (
            <div className="user-info-badge">
              <div className="user-avatar-sm">{user.display_name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}</div>
              <span>{user.display_name || user.email.split('@')[0]}</span>
            </div>
          )}
        </div>

        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="stats-value">{stats.tests}</div>
            <div className="stats-label">Тестов пройдено</div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v-8m0 8h-8m8-4a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            </div>
            <div className="stats-value">{stats.avg}%</div>
            <div className="stats-label">Средний балл</div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="stats-value">{stats.best}%</div>
            <div className="stats-label">Лучший результат</div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
            <div className="stats-value">{stats.streak}</div>
            <div className="stats-label">Дней подряд</div>
          </div>
        </div>

        <div className="section-gap">
          <h2 className="section-title-sm">Недавние тесты</h2>
          {loading ? (
            <div className="card skeleton-card">
              <div className="skeleton" style={{ height: 80 }} />
            </div>
          ) : recentTests.length === 0 ? (
            <div className="card empty-card">
              <div className="empty-card-icon">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="empty-card-title">Нет тестов</h3>
              <p className="empty-card-desc">Начните первый тест чтобы увидеть результаты здесь</p>
              <Link to="/subjects" className="btn btn-primary">Выбрать предмет</Link>
            </div>
          ) : (
            <div className="recent-list">
              {recentTests.map((test) => (
                <div key={test.id} className="recent-item card">
                  <div className="recent-item-info">
                    <div className="recent-item-title">{test.test_set_id || 'Тест'}</div>
                    <div className="recent-item-date">{test.finished_at ? new Date(test.finished_at).toLocaleDateString('ru') : '-'}</div>
                  </div>
                  <div className="recent-item-score" style={{ color: test.max_score > 0 && Math.round((test.score / test.max_score) * 100) >= 70 ? 'var(--success)' : test.max_score > 0 && Math.round((test.score / test.max_score) * 100) >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                    {test.max_score > 0 ? Math.round((test.score / test.max_score) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-gap">
          <h2 className="section-title-sm">Быстрые действия</h2>
          <div className="quick-actions-grid">
            <Link to="/subjects" className="quick-action-card card card-hover">
              <div className="quick-action-icon" style={{ background: 'var(--accent-soft)' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent)">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="quick-action-title">Продолжить обучение</h3>
              <p className="quick-action-desc">Выбрать предмет и пройти тест</p>
            </Link>
            <Link to="/bookmarks" className="quick-action-card card card-hover">
              <div className="quick-action-icon" style={{ background: 'var(--warning-soft)' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--warning)">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="quick-action-title">Закладки</h3>
              <p className="quick-action-desc">Просмотреть сохраненные вопросы</p>
            </Link>
            <Link to="/profile" className="quick-action-card card card-hover">
              <div className="quick-action-icon" style={{ background: 'var(--success-soft)' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--success)">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="quick-action-title">Профиль</h3>
              <p className="quick-action-desc">Настройки аккаунта и статистика</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}