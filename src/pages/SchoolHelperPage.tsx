import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type HelperArticle } from '../lib/supabase';

const CATEGORY_ICONS: Record<string, string> = {
  preparation: '📚',
  lifehacks: '💡',
  tips: '⚡',
  faq: '❓',
  general: '📝',
};

const CATEGORY_NAMES: Record<string, string> = {
  preparation: 'Подготовка',
  lifehacks: 'Лайфхаки',
  tips: 'Советы',
  faq: 'Вопросы',
  general: 'Общее',
};

export default function SchoolHelperPage() {
  const [articles, setArticles] = useState<HelperArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('helper_articles')
        .select('*')
        .eq('is_published', true)
        .order('order_index');
      
      setArticles((data as HelperArticle[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const categories = Array.from(new Set(articles.map(a => a.category)));
  const filteredArticles = selectedCategory 
    ? articles.filter(a => a.category === selectedCategory)
    : articles;

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="subjects-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="subject-skeleton skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/directions/school" className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <div>
              <h1 className="page-title">Вспомогательные материалы</h1>
              <p className="page-subtitle">Лайфхаки, советы и гайды для учёбы</p>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="category-filters">
            <button 
              className={`category-filter ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              Все
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                className={`category-filter ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {CATEGORY_ICONS[cat] || '📝'} {CATEGORY_NAMES[cat] || cat}
              </button>
            ))}
          </div>
        )}

        {filteredArticles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет материалов</h3>
            <p className="empty-state-description">Материалы будут добавлены позже</p>
          </div>
        ) : (
          <div className="articles-grid">
            {filteredArticles.map((article) => (
              <Link key={article.id} to={`/helper/${article.id}`} className="article-card">
                <div className="article-card-inner">
                  <div className="article-card-icon">
                    {CATEGORY_ICONS[article.category] || '📝'}
                  </div>
                  <div className="article-card-body">
                    <h3 className="article-card-title">{article.title}</h3>
                    {article.tags && article.tags.length > 0 && (
                      <div className="article-tags">
                        {article.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="article-tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
