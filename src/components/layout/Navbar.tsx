import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useI18n } from '../../lib/i18n';

const DEV_EMAIL = 'smeshtrend@gmail.com';

const Logo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const isDevMode = useAuthStore((s) => s.isDevMode);
  const toggleDevMode = useAuthStore((s) => s.toggleDevMode);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const logout = useAuthStore((s) => s.logout);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();

  const languages = [
    { code: 'en' as const, name: 'English', flag: 'EN' },
    { code: 'ru' as const, name: 'Русский', flag: 'RU' },
    { code: 'kk' as const, name: 'Қазақша', flag: 'KK' },
  ];

  const handleSignOut = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar" style={isDevMode ? { boxShadow: 'inset 0 0 0 3px var(--warning)' } : {}}>
      <div className="container">
        <div className="navbar-inner">
          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon">
              <Logo />
            </div>
            <span className="nav-logo-text">{t('app.name', 'PrepIQ')}</span>
          </Link>

          <div className="nav-links">
            <Link to="/directions" className="nav-link">Направления</Link>
            <Link to="/subjects" className="nav-link">{t('nav.subjects', 'Предметы')}</Link>
            <Link to="/tests" className="nav-link">Тесты</Link>
            {user && <Link to="/dashboard" className="nav-link">{t('nav.dashboard', 'Панель')}</Link>}
            {user && <Link to="/bookmarks" className="nav-link">{t('nav.bookmarks', 'Закладки')}</Link>}
          </div>

          <div className="nav-actions">
            {user?.email === DEV_EMAIL && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--warning-soft)', borderRadius: '8px', border: '1px solid var(--warning)' }}>
                <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 600 }}>DEV</span>
                <button onClick={toggleDevMode} style={{ width: '32px', height: '16px', borderRadius: '8px', background: isDevMode ? 'var(--warning)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '2px', left: isDevMode ? '16px' : '2px', width: '12px', height: '12px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }} />
                </button>
              </div>
            )}

            <div className="lang-switcher">
              <button className="lang-switcher-btn" onClick={() => setLangOpen(!langOpen)}>
                <span>{languages.find(l => l.code === language)?.flag}</span>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setLangOpen(false)} />
                  <div className="lang-switcher-dropdown">
                    {languages.map((lang) => (
                      <button key={lang.code} onClick={() => { setLanguage(lang.code); setLangOpen(false); }} className={`lang-option ${language === lang.code ? 'active' : ''}`}>
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {user ? (
              <div className="user-menu">
                <button className="user-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="user-avatar">{user.display_name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}</div>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{user.display_name || user.email.split('@')[0]}</span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(false)} />
                    <div className="user-dropdown">
                      <div className="user-dropdown-header">
                        <div className="user-dropdown-name">{user.display_name || 'Пользователь'}</div>
                        <div className="user-dropdown-email">{user.email}</div>
                      </div>
                      {user.email === DEV_EMAIL && (
                        <>
                          <Link to="/admin" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--warning)">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Админ панель
                          </Link>
                          <Link to="/trash" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--danger)">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Корзина
                          </Link>
                        </>
                      )}
                      <Link to="/profile" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t('nav.profile', 'Профиль')}
                      </Link>
                      <button className="user-dropdown-item danger" onClick={handleSignOut}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Выйти
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => openAuthModal('login')}>{t('nav.signIn', 'Войти')}</button>
                <button className="btn btn-primary btn-sm" onClick={() => openAuthModal('register')}>{t('nav.signUp', 'Регистрация')}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}