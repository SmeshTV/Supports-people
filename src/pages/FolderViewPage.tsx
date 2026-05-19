import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, type Direction, type Course, type Discipline, type Attestation, type AttestationExam, type Section, type HelperArticle, type TestSet } from '../lib/supabase';

type FolderItem = {
  id: string;
  type: 'direction' | 'course' | 'discipline' | 'attestation' | 'attestation_exam' | 'section' | 'helper_article' | 'test_set';
  name: string;
  description?: string;
  icon: string;
  hasChildren: boolean;
  data: any;
};

const TYPE_ICONS: Record<string, string> = {
  direction: '📂',
  course: '🎓',
  discipline: '📚',
  attestation: '📋',
  attestation_exam: '📝',
  section: '📄',
  helper_article: '💡',
  test_set: '✅',
};

const TYPE_COLORS: Record<string, string> = {
  direction: '#6366f1',
  course: '#8b5cf6',
  discipline: '#3b82f6',
  attestation: '#f59e0b',
  attestation_exam: '#ef4444',
  section: '#22c55e',
  helper_article: '#ec4899',
  test_set: '#14b8a6',
};

export default function FolderViewPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<FolderItem[]>([]);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!folderId) {
      setLoading(false);
      return;
    }
    loadFolder(folderId);
  }, [folderId]);

  const loadFolder = async (id: string) => {
    const results = await Promise.all([
      supabase.from('directions').select('*').eq('id', id).maybeSingle(),
      supabase.from('courses').select('*').eq('id', id).maybeSingle(),
      supabase.from('disciplines').select('*').eq('id', id).maybeSingle(),
      supabase.from('attestations').select('*').eq('id', id).maybeSingle(),
      supabase.from('attestation_exams').select('*').eq('id', id).maybeSingle(),
    ]);

    let name = 'Папка';

    for (const { data } of results) {
      if (data) {
        name = (data as any).name || name;
        break;
      }
    }

    setFolderName(name);

    const [
      { data: childDirs },
      { data: courses },
      { data: disciplines },
      { data: attestations },
      { data: attExams },
      { data: sections },
      { data: articles },
      { data: tests },
    ] = await Promise.all([
      supabase.from('directions').select('*').or(`direction_type.eq.${id},parent_id.eq.${id}`).eq('is_published', true).order('order_index'),
      supabase.from('courses').select('*').or(`direction_id.eq.${id},parent_id.eq.${id}`).eq('is_published', true).order('order_index'),
      supabase.from('disciplines').select('*').or(`course_id.eq.${id},direction_id.eq.${id},parent_id.eq.${id}`).eq('is_published', true).order('order_index'),
      supabase.from('attestations').select('*').or(`discipline_id.eq.${id},parent_id.eq.${id}`).eq('is_active', true).order('order_index'),
      supabase.from('attestation_exams').select('*').or(`attestation_id.eq.${id},parent_id.eq.${id}`).eq('is_published', true).order('order_index'),
      supabase.from('sections').select('*').or(`discipline_id.eq.${id},direction_id.eq.${id},parent_id.eq.${id}`).eq('is_published', true).order('order_index'),
      supabase.from('helper_articles').select('*').or(`parent_id.eq.${id}`).eq('is_published', true).order('order_index'),
      supabase.from('test_sets').select('*').or(`category_id.eq.${id},discipline_id.eq.${id},direction_id.eq.${id},course_id.eq.${id},parent_id.eq.${id}`).eq('is_published', true),
    ]);

    const folderItems: FolderItem[] = [];

    (childDirs as Direction[] || []).forEach(d => {
      folderItems.push({ id: d.id, type: 'direction', name: d.name, description: d.description, icon: TYPE_ICONS.direction, hasChildren: true, data: d });
    });

    (courses as Course[] || []).forEach(c => {
      folderItems.push({ id: c.id, type: 'course', name: c.name, description: c.short_name, icon: TYPE_ICONS.course, hasChildren: true, data: c });
    });

    (disciplines as Discipline[] || []).forEach(d => {
      folderItems.push({ id: d.id, type: 'discipline', name: d.name, description: d.description, icon: TYPE_ICONS.discipline, hasChildren: true, data: d });
    });

    (attestations as Attestation[] || []).forEach(a => {
      folderItems.push({ id: a.id, type: 'attestation', name: a.name, icon: TYPE_ICONS.attestation, hasChildren: true, data: a });
    });

    (attExams as AttestationExam[] || []).forEach(e => {
      folderItems.push({ id: e.id, type: 'attestation_exam', name: e.name, description: e.description, icon: TYPE_ICONS.attestation_exam, hasChildren: false, data: e });
    });

    (sections as Section[] || []).forEach(s => {
      folderItems.push({ id: s.id, type: 'section', name: s.name, description: s.description, icon: TYPE_ICONS.section, hasChildren: false, data: s });
    });

    (articles as HelperArticle[] || []).forEach(a => {
      folderItems.push({ id: a.id, type: 'helper_article', name: a.title, icon: TYPE_ICONS.helper_article, hasChildren: false, data: a });
    });

    (tests as TestSet[] || []).forEach(t => {
      folderItems.push({ id: t.id, type: 'test_set', name: t.name, description: t.description, icon: TYPE_ICONS.test_set, hasChildren: false, data: t });
    });

    setItems(folderItems);
    setLoading(false);
  };

  const handleClick = (item: FolderItem) => {
    if (item.hasChildren || ['direction', 'course', 'discipline', 'attestation'].includes(item.type)) {
      navigate(`/folder/${item.id}`);
    } else if (item.type === 'section') {
      navigate(`/section/${item.id}`);
    } else if (item.type === 'helper_article') {
      navigate(`/helper/${item.id}`);
    } else if (item.type === 'test_set') {
      navigate(`/test/${item.id}`);
    } else if (item.type === 'attestation_exam') {
      navigate(`/university/exam-detail/${item.id}`);
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, FolderItem[]>);

  const typeOrder = ['direction', 'course', 'discipline', 'attestation', 'attestation_exam', 'section', 'helper_article', 'test_set'];
  const typeNames: Record<string, string> = {
    direction: 'Папки',
    course: 'Курсы',
    discipline: 'Дисциплины',
    attestation: 'Аттестации',
    attestation_exam: 'Экзамены',
    section: 'Темы',
    helper_article: 'Статьи',
    test_set: 'Тесты',
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="skeleton" style={{ height: 400 }} />
        </div>
      </div>
    );
  }

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>
            <div>
              <h1 className="page-title">{folderName}</h1>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <h3 className="empty-state-title">Папка пуста</h3>
            <p className="empty-state-description">Содержимое появится здесь позже</p>
          </div>
        ) : (
          <div className="folder-view">
            {typeOrder.map(type => {
              const group = groupedItems[type];
              if (!group || group.length === 0) return null;
              return (
                <div key={type} className="folder-group">
                  <h2 className="folder-group-title">
                    <span className="folder-group-icon" style={{ background: TYPE_COLORS[type] + '22', color: TYPE_COLORS[type] }}>
                      {TYPE_ICONS[type]}
                    </span>
                    {typeNames[type] || type}
                    <span className="folder-group-count">{group.length}</span>
                  </h2>
                  <div className="folder-grid">
                    {group.map(item => (
                      <div
                        key={item.id}
                        className="folder-item-card"
                        onClick={() => handleClick(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && handleClick(item)}
                      >
                        <div className="folder-item-icon" style={{ background: TYPE_COLORS[type] + '22', color: TYPE_COLORS[type] }}>
                          {TYPE_ICONS[type]}
                        </div>
                        <div className="folder-item-body">
                          <h3 className="folder-item-name">{item.name}</h3>
                          {item.description && <p className="folder-item-desc">{item.description}</p>}
                          {item.type === 'test_set' && (
                            <span className="folder-item-badge">{item.data.question_ids?.length || 0} вопросов</span>
                          )}
                        </div>
                      </div>
                    ))}
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
