import { useAuthStore } from '../store/authStore';
import { useI18n } from '../lib/i18n';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { language, setLanguage } = useI18n();

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
    { code: 'kk' as const, name: 'Қазақша', flag: '🇰🇿' },
  ];

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Профиль</h1>
            <p className="page-subtitle">Управление аккаунтом и настройками</p>
          </div>
        </div>

        <div className="profile-header">
          <div className="profile-avatar">
            {user?.display_name?.[0]?.toUpperCase() ?? user?.email[0].toUpperCase()}
          </div>
          <div className="profile-info">
            <div className="profile-name">{user?.display_name || 'Пользователь'}</div>
            <div className="profile-email">{user?.email}</div>
            <span className="badge" style={{ marginTop: 8 }}>{user?.role || 'student'}</span>
          </div>
        </div>

        <div className="card">
          <div className="settings-section">
            <div className="settings-title">Язык интерфейса</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid',
                    borderColor: language === lang.code ? 'var(--accent)' : 'var(--border)',
                    background: language === lang.code ? 'var(--accent-soft)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section" style={{ marginBottom: 0 }}>
            <div className="settings-title">Аккаунт</div>
            <div className="settings-row">
              <span className="settings-label">Email</span>
              <span style={{ fontSize: 14 }}>{user?.email}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Роль</span>
              <span className="badge">{user?.role || 'student'}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <button className="btn btn-secondary" onClick={logout} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </main>
  );
}