import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export default function BookmarksPage() {
  const { t } = useI18n();
  
  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('bookmarks.title', 'Закладки')}</h1>
            <p className="page-subtitle">{t('bookmarks.subtitle', 'Сохраненные вопросы для повторения')}</p>
          </div>
        </div>

        <div className="card empty-card">
          <div className="empty-card-icon">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h2 className="empty-card-title">{t('bookmarks.noBookmarks', 'Закладок пока нет')}</h2>
          <p className="empty-card-desc">{t('bookmarks.noBookmarksDesc', 'Во время прохождения теста нажмите на иконку закладки рядом с вопросом чтобы сохранить его для повторения.')}</p>
          <Link to="/subjects" className="btn btn-primary">{t('bookmarks.startLearning', 'Начать обучение')}</Link>
        </div>
      </div>
    </main>
  );
}