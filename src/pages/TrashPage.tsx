import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin, type TrashItem, TRASH_TABLES } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const DEV_EMAIL = 'smeshtrend@gmail.com';

export default function TrashPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.email !== DEV_EMAIL) {
      navigate('/');
      return;
    }
    fetchTrash();
  }, [user]);

  const fetchTrash = async () => {
    const { data } = await supabaseAdmin
      .from('trash')
      .select('*')
      .eq('is_restored', false)
      .order('deleted_at', { ascending: false });

    const allItems = (data as TrashItem[]) || [];
    const now = new Date();
    const expired = allItems.filter(item => new Date(item.expires_at) < now);
    const active = allItems.filter(item => new Date(item.expires_at) >= now);

    for (const item of expired) {
      await supabaseAdmin.from('trash').delete().eq('id', item.id);
    }

    setItems(active);
    setLoading(false);
  };

  const handleRestore = async (item: TrashItem) => {
    setRestoring(item.id);

    const table = TRASH_TABLES[item.content_type];
    if (!table) {
      await supabaseAdmin.from('trash').update({ is_restored: true, restored_at: new Date().toISOString() }).eq('id', item.id);
      setItems(items.filter(i => i.id !== item.id));
      setRestoring(null);
      return;
    }

    const { error: insertError } = await supabaseAdmin.from(table).insert(item.content_data);

    if (!insertError) {
      await supabaseAdmin.from('trash').update({ is_restored: true, restored_at: new Date().toISOString() }).eq('id', item.id);
      setItems(items.filter(i => i.id !== item.id));
    } else {
      alert('Ошибка восстановления: ' + insertError.message);
    }
    setRestoring(null);
  };

  const handlePermanentDelete = async (trashId: string, name: string) => {
    if (!confirm(`Удалить "${name}" навсегда? Это действие нельзя отменить.`)) return;

    const { error } = await supabaseAdmin.from('trash').delete().eq('id', trashId);
    if (!error) {
      setItems(items.filter(item => item.id !== trashId));
    }
  };

  const formatContentType = (type: string) => {
    const types: Record<string, string> = {
      subject: 'Предмет',
      direction: 'Папка (Направление)',
      course: 'Папка (Курс)',
      semester: 'Семестр',
      discipline: 'Папка (Дисциплина)',
      section: 'Тема',
      test_set: 'Тест',
      question: 'Вопрос',
      exam: 'Экзамен',
      attestation: 'Аттестация',
      attestation_exam: 'Экзамен',
      helper_article: 'Статья',
    };
    return types[type] || type;
  };

  const getContentTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      direction: '📂', course: '🎓', discipline: '📚', attestation: '📋',
      attestation_exam: '📝', section: '📄', test_set: '✅', question: '❓',
      helper_article: '💡',
    };
    return icons[type] || '📄';
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Истёк';
    return `${diff} дн.`;
  };

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/admin')} className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>
            <div>
              <h1 className="page-title">🗑️ Корзина</h1>
              <p className="page-subtitle">Восстановление удалённых элементов (удаляются через 30 дней)</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 200 }} />
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="empty-state-title">Корзина пуста</h3>
            <p className="empty-state-description">Удалённые элементы будут появляться здесь</p>
          </div>
        ) : (
          <div className="trash-list">
            {items.map((item) => {
              const name = (item.content_data as any)?.name || (item.content_data as any)?.title || `ID: ${item.content_id.slice(0, 8)}...`;
              return (
                <div key={item.id} className="trash-item">
                  <div className="trash-item-icon">{getContentTypeIcon(item.content_type)}</div>
                  <div className="trash-item-content">
                    <div className="trash-item-header">
                      <span className="badge">{formatContentType(item.content_type)}</span>
                      <span className="trash-time">
                        Удалено: {new Date(item.deleted_at).toLocaleDateString('ru')} • Осталось: {getTimeRemaining(item.expires_at)}
                      </span>
                    </div>
                    <div className="trash-item-name">{name}</div>
                    {(item.content_data as any)?.description && (
                      <p className="trash-item-desc">{(item.content_data as any).description}</p>
                    )}
                  </div>
                  <div className="trash-item-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleRestore(item)}
                      disabled={restoring === item.id}
                    >
                      ↩ Восстановить
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handlePermanentDelete(item.id, name)}
                    >
                      🗑 Удалить навсегда
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
