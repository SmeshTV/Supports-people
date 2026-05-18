import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuthStore();
  
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [testSet, setTestSet] = useState<any>(null);

  useEffect(() => {
    if (location.state?.attempt) {
      setAttempt(location.state.attempt);
      setQuestions(location.state.questions || []);
      setTestSet(location.state.testSet || null);
    } else {
      navigate('/');
    }
  }, [location, navigate]);

  if (!attempt) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" style={{ margin: '0 auto' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Результаты не найдены</h2>
          <Link to="/subjects" className="btn btn-primary" style={{ marginTop: '16px' }}>Выбрать предмет</Link>
        </div>
      </div>
    );
  }

  const score = attempt.score || 0;
  const maxScore = attempt.max_score || 1;
  const percentage = Math.round((score / maxScore) * 100);
  const correctCount = attempt.answers?.filter((a: any) => a.is_correct).length || 0;
  const incorrectCount = (attempt.answers?.length || 0) - correctCount;
  const passed = percentage >= (testSet?.settings?.passing_score_pct ?? 70);

  return (
    <div className="results-page">
      <div className="container">
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="card" style={{ textAlign: 'center', marginBottom: '24px', padding: '48px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: passed 
                ? 'linear-gradient(135deg, var(--success-soft) 0%, rgba(34, 197, 94, 0.1) 100%)' 
                : 'linear-gradient(135deg, var(--danger-soft) 0%, rgba(239, 68, 68, 0.1) 100%)' 
            }} />
            <div style={{ position: 'relative' }}>
              <span className={`badge ${passed ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: '20px', fontSize: '14px', padding: '8px 20px' }}>
                {passed ? 'ПРОЙДЕНО' : 'НЕ ПРОЙДЕНО'}
              </span>
              <div style={{ 
                fontSize: '72px', 
                fontWeight: 800, 
                background: 'var(--gradient-1)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px' 
              }}>
                {percentage}%
              </div>
              <p style={{ fontSize: '20px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{score} из {maxScore} баллов</p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Проходной балл: {testSet?.settings?.passing_score_pct ?? 70}%</p>
            </div>
          </div>

          <div className="results-stats">
            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--success)', marginBottom: '4px' }}>{correctCount}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Правильно</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--danger)', marginBottom: '4px' }}>{incorrectCount}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Неправильно</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>{attempt.answers?.length || 0}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Всего</div>
            </div>
          </div>

          <div className="results-actions" style={{ marginBottom: '32px' }}>
            <Link to={testSet ? `/test/${testSet.id}` : '/subjects'} className="btn btn-primary">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Пройти снова
            </Link>
            <Link to="/subjects" className="btn btn-secondary">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Больше тестов
            </Link>
          </div>

          {!user && attempt.id === 'guest' && (
            <div className="card" style={{ 
              background: 'var(--accent-soft)', 
              border: '1px solid var(--accent)', 
              marginBottom: '24px', 
              padding: '24px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'var(--accent)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Сохраните свой прогресс</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Создайте бесплатный аккаунт для отслеживания ваших результатов и улучшения с течением времени.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openAuthModal('register')}>Создать аккаунт</button>
              </div>
            </div>
          )}

          {questions.length > 0 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>Проверка ответов</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {questions.map((question, i) => {
                  const answer = attempt.answers?.find((a: any) => a.question_id === question.id);
                  const isCorrect = answer?.is_correct;
                  
                  return (
                    <div key={question.id} className="card" style={{ borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '10px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          background: isCorrect ? 'var(--success-soft)' : 'var(--danger-soft)', 
                          color: isCorrect ? 'var(--success)' : 'var(--danger)',
                          flexShrink: 0
                        }}>
                          {isCorrect ? (
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Вопрос {i + 1}</span>
                            <span className={`badge ${question.difficulty === 'easy' ? 'badge-success' : question.difficulty === 'hard' ? 'badge-warning' : 'badge-info'}`}>
                              {question.difficulty === 'easy' ? 'Легко' : question.difficulty === 'hard' ? 'Сложно' : 'Средне'}
                            </span>
                          </div>
                          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' }}>{question.body.text}</p>
                          {!isCorrect && (
                            <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--success-soft)', borderRadius: '8px' }}>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Правильный ответ:</p>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success)' }}>
                                {question.options.find((o: any) => question.correct_answers.includes(o.id))?.text || 'N/A'}
                              </p>
                            </div>
                          )}
                          {question.explanation?.text && (
                            <div style={{ 
                              padding: '12px', 
                              background: 'var(--bg-tertiary)', 
                              borderRadius: '8px', 
                              border: '1px solid var(--border)' 
                            }}>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Объяснение:</p>
                              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{question.explanation.text}</p>
                              {(question.explanation as any)?.image_url && (
                                <img src={(question.explanation as any).image_url} alt="Explanation" style={{ maxWidth: '100%', maxHeight: 200, marginTop: 8, borderRadius: 8 }} />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}