import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../ui/Modal';
import { useI18n } from '../../lib/i18n';

export default function AuthModal() {
  const authModal = useAuthStore((s) => s.authModal);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);
  const authLoading = useAuthStore((s) => s.authLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const { t } = useI18n();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isOpen = authModal === 'login' || authModal === 'register';

  const handleClose = () => {
    closeAuthModal();
    setMode('login');
    setEmail('');
    setPassword('');
    setDisplayName('');
    setFormError('');
    setSuccessMessage('');
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!email || !password) {
      setFormError(t('auth.fillAll', 'Заполните все поля'));
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setFormError(t('auth.invalidEmail', 'Введите корректный email'));
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setFormError(t('auth.minChars', 'Пароль должен быть минимум 6 символов'));
      return;
    }

    try {
      if (mode === 'register') {
        const result = await register(email, password, displayName || email.split('@')[0]);
        if (result.user) {
          setSuccessMessage(t('auth.checkInbox', 'Проверьте почту!'));
          setTimeout(() => {
            handleClose();
          }, 2000);
        } else if (result.error) {
          setFormError(result.error);
        }
      } else {
        const result = await login(email, password);
        if (result.user) {
          handleClose();
        } else if (result.error) {
          setFormError(result.error);
        }
      }
    } catch (err: any) {
      setFormError(err.message || t('auth.genericError', 'Произошла ошибка. Попробуйте снова.'));
    }
  };

  const displayError = formError || error || '';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <div className="auth-modal-icon">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="auth-modal-title">{mode === 'login' ? t('auth.signIn', 'Вход в аккаунт') : t('auth.signUp', 'Создание аккаунта')}</h2>
          <p className="auth-modal-subtitle">
            {mode === 'login' ? t('auth.loginSubtitle', 'Войдите чтобы продолжить обучение') : t('auth.registerSubtitle', 'Заполните данные для регистрации')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">{t('auth.displayName', 'Имя')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('auth.displayNamePlaceholder', 'Как вас называть?')}
                className="form-input"
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t('auth.email', 'Email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder', 'example@mail.com')}
              className="form-input"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.password', 'Пароль')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? t('auth.passwordHint', 'Минимум 6 символов') : t('auth.passwordPlaceholder', 'Ваш пароль')}
              className="form-input"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          {successMessage && (
            <div style={{ padding: '12px 16px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
          )}

          {displayError && (
            <div className="form-error">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {displayError}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={authLoading}>
            {authLoading ? (
              <div className="spinner" />
            ) : mode === 'login' ? (
              t('auth.signIn', 'Войти')
            ) : (
              t('auth.signUp', 'Создать аккаунт')
            )}
          </button>

          <div className="auth-switch">
            {mode === 'login' ? (
              <>{t('auth.noAccount', 'Нет аккаунта?')} <button type="button" onClick={() => { setMode('register'); clearError(); setFormError(''); }}>{t('auth.signUp', 'Зарегистрироваться')}</button></>
            ) : (
              <>{t('auth.haveAccount', 'Уже есть аккаунт?')} <button type="button" onClick={() => { setMode('login'); clearError(); setFormError(''); }}>{t('auth.signIn', 'Войти')}</button></>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}