import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type HelperArticle } from '../lib/supabase';

const CATEGORY_NAMES: Record<string, string> = {
  preparation: 'Подготовка',
  lifehacks: 'Лайфхаки',
  tips: 'Советы',
  faq: 'Вопросы',
  general: 'Общее',
};

export default function SchoolHelperArticlePage() {
  const { articleId } = useParams<{ articleId: string }>();
  const [article, setArticle] = useState<HelperArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!articleId) return;
      
      const { data } = await supabase
        .from('helper_articles')
        .select('*')
        .eq('id', articleId)
        .maybeSingle();
      
      setArticle((data as HelperArticle) || null);
      setLoading(false);
    };
    fetchData();
  }, [articleId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="skeleton" style={{ height: 400 }} />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <main className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Статья не найдена</h3>
            <Link to="/school/helper" className="btn btn-primary">Назад</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/school/helper" className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <div>
              <span className="badge badge-info" style={{ marginBottom: 8, display: 'inline-block' }}>
                {CATEGORY_NAMES[article.category] || article.category}
              </span>
              <h1 className="page-title">{article.title}</h1>
            </div>
          </div>
        </div>

        <div className="article-content">
          <div className="card" style={{ padding: 32 }}>
            <div className="rich-text-render">
              <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
            </div>
            
            {article.tags && article.tags.length > 0 && (
              <div className="article-tags" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {article.tags.map((tag, i) => (
                  <span key={i} className="article-tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
