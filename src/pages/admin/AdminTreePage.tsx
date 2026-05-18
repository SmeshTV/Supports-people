import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabaseAdmin, type DirectionType, type Direction, type Course, type Discipline, type Attestation, type AttestationExam, type Section, type HelperArticle, type TestSet, type Question, moveToTrash } from '../../lib/supabase';
import RichTextEditor from '../../components/ui/RichTextEditor';
import { useI18n } from '../../lib/i18n';

const DEV_EMAIL = 'smeshtrend@gmail.com';

type TreeNode = {
  id: string;
  type: string;
  name: string;
  icon: string;
  children: TreeNode[];
  data: any;
  expanded: boolean;
};

type Breadcrumb = {
  id: string;
  name: string;
  type: string;
};

const TYPE_ICONS: Record<string, string> = {
  direction_type: '📁',
  direction: '📂',
  course: '🎓',
  discipline: '📚',
  attestation: '📋',
  attestation_exam: '📝',
  section: '📄',
  helper_article: '💡',
  test_set: '✅',
};

const TYPE_LABELS: Record<string, string> = {
  direction_type: 'Раздел',
  direction: 'Папка',
  course: 'Курс',
  discipline: 'Дисциплина',
  attestation: 'Аттестация',
  attestation_exam: 'Экзамен',
  section: 'Тема',
  helper_article: 'Статья',
  test_set: 'Тест',
};

const TYPE_LABELS_EN: Record<string, string> = {
  direction_type: 'Section',
  direction: 'Folder',
  course: 'Course',
  discipline: 'Discipline',
  attestation: 'Attestation',
  attestation_exam: 'Exam',
  section: 'Topic',
  helper_article: 'Article',
  test_set: 'Test',
};

const TYPE_LABELS_KZ: Record<string, string> = {
  direction_type: 'Бөлім',
  direction: 'Қалта',
  course: 'Курс',
  discipline: 'Пән',
  attestation: 'Аттестация',
  attestation_exam: 'Емтихан',
  section: 'Тақырып',
  helper_article: 'Мақала',
  test_set: 'Сынақ',
};

const getTypeLabel = (type: string, lang: string) => {
  if (lang === 'en') return TYPE_LABELS_EN[type] || type;
  if (lang === 'kk') return TYPE_LABELS_KZ[type] || type;
  return TYPE_LABELS[type] || type;
};

export default function AdminTreePage() {
  const { language } = useI18n();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: 'root', name: 'Корень', type: 'root' }]);
  const [folderItems, setFolderItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [allTestSets, setAllTestSets] = useState<TestSet[]>([]);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [selectedTestSet, setSelectedTestSet] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [contextActions, setContextActions] = useState<{ label: string; action: () => void }[]>([]);
  const createMenuRef = useRef<HTMLDivElement>(null);

  const showContextMenu = (e: React.MouseEvent, actions: { label: string; action: () => void }[]) => {
    setContextActions(actions);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!user || user.email !== DEV_EMAIL) {
      navigate('/');
      return;
    }
    loadAllData();
  }, [user]);

  useEffect(() => {
    const handleClick = () => {
      setShowCreateMenu(false);
      setContextMenuPos(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const loadAllData = async () => {
    const [{ data: dts }, { data: dirs }, { data: courses }, { data: discs }, { data: atts }, { data: attExams }, { data: sections }, { data: articles }, { data: tests }] = await Promise.all([
      supabaseAdmin.from('direction_types').select('*').order('order_index'),
      supabaseAdmin.from('directions').select('*').order('order_index'),
      supabaseAdmin.from('courses').select('*').order('order_index'),
      supabaseAdmin.from('disciplines').select('*').order('order_index'),
      supabaseAdmin.from('attestations').select('*').order('order_index'),
      supabaseAdmin.from('attestation_exams').select('*').order('order_index'),
      supabaseAdmin.from('sections').select('*').order('order_index'),
      supabaseAdmin.from('helper_articles').select('*').order('order_index'),
      supabaseAdmin.from('test_sets').select('*').order('created_at'),
    ]);

    const directionTypeMap: Record<string, string> = {};
    (dts as DirectionType[] || []).forEach(dt => { directionTypeMap[dt.type] = dt.id; });

    const allItems: any[] = [];

    (dts as DirectionType[] || []).forEach(dt => {
      allItems.push({ id: dt.id, type: 'direction_type', name: dt.name_ru, icon: TYPE_ICONS.direction_type, data: dt, parentId: null });
    });

    (dirs as Direction[] || []).forEach(dir => {
      allItems.push({ id: dir.id, type: 'direction', name: dir.name, icon: TYPE_ICONS.direction, data: dir, parentId: directionTypeMap[dir.direction_type] || null });
    });

    (courses as Course[] || []).forEach(c => {
      allItems.push({ id: c.id, type: 'course', name: c.name, icon: TYPE_ICONS.course, data: c, parentId: c.direction_id });
    });

    (discs as Discipline[] || []).forEach(d => {
      allItems.push({ id: d.id, type: 'discipline', name: d.name, icon: TYPE_ICONS.discipline, data: d, parentId: d.course_id || d.direction_id });
    });

    (atts as Attestation[] || []).forEach(a => {
      allItems.push({ id: a.id, type: 'attestation', name: a.name, icon: TYPE_ICONS.attestation, data: a, parentId: a.discipline_id });
    });

    (attExams as AttestationExam[] || []).forEach(e => {
      allItems.push({ id: e.id, type: 'attestation_exam', name: e.name, icon: TYPE_ICONS.attestation_exam, data: e, parentId: e.attestation_id });
    });

    (sections as Section[] || []).forEach(s => {
      allItems.push({ id: s.id, type: 'section', name: s.name, icon: TYPE_ICONS.section, data: s, parentId: s.discipline_id || s.direction_id || s.parent_id });
    });

    (articles as HelperArticle[] || []).forEach(a => {
      allItems.push({ id: a.id, type: 'helper_article', name: a.title, icon: TYPE_ICONS.helper_article, data: a, parentId: a.parent_id });
    });

    (tests as TestSet[] || []).forEach(t => {
      const tData = t as any;
      allItems.push({ id: t.id, type: 'test_set', name: t.name, icon: TYPE_ICONS.test_set, data: t, parentId: tData.discipline_id || tData.direction_id || tData.category_id });
    });

    setAllTestSets((tests as TestSet[]) || []);

    const buildTree = (parentId: string | null): TreeNode[] => {
      return allItems
        .filter(item => item.parentId === parentId)
        .map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          icon: item.icon,
          children: buildTree(item.id),
          data: item.data,
          expanded: false,
        }));
    };

    setTree(buildTree(null));
    setFolderItems(allItems.filter(item => item.parentId === currentFolder));
    setLoading(false);
  };

  const toggleNode = (nodeId: string) => {
    const toggleInTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) return { ...node, expanded: !node.expanded };
        return { ...node, children: toggleInTree(node.children) };
      });
    };
    setTree(toggleInTree(tree));
  };

  const openFolder = (node: TreeNode) => {
    setCurrentFolder(node.id);
    setBreadcrumbs(prev => [...prev, { id: node.id, name: node.name, type: node.type }]);
    const allItems: any[] = [];
    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach(n => {
        allItems.push({ id: n.id, type: n.type, name: n.name, icon: n.icon, data: n.data, parentId: null });
        flatten(n.children);
      });
    };
    flatten(tree);
    setFolderItems(allItems.filter(item => {
      const findParent = (nodes: TreeNode[], targetId: string): string | null => {
        for (const n of nodes) {
          if (n.children.some(c => c.id === targetId)) return n.id;
          const found = findParent(n.children, targetId);
          if (found) return found;
        }
        return null;
      };
      return findParent(tree, item.id) === node.id || item.parentId === node.id;
    }));
  };

  const navigateBreadcrumb = (index: number) => {
    const bc = breadcrumbs[index];
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setCurrentFolder(bc.id === 'root' ? null : bc.id);
  };

  const getDefaultFormData = (type: string, parentId: string | null = null) => {
    switch(type) {
      case 'direction': return { name: '', description: '', direction_type: 'school', icon: 'book', color: '#6366f1', is_published: true, order_index: 0 };
      case 'course': return { name: '', short_name: '', direction_id: parentId, order_index: 1, is_published: true };
      case 'discipline': return { name: '', description: '', course_id: null, direction_id: null, order_index: 0, is_published: true };
      case 'attestation': return { name: '', discipline_id: parentId, attestation_type: 'attestation1', order_index: 0, is_active: true };
      case 'attestation_exam': return { name: '', attestation_id: parentId, exam_type: 'intermediate', description: '', has_lectures: false, test_set_id: null, order_index: 0, is_published: true };
      case 'section': return { name: '', description: '', content: '', lecture_content: '', direction_id: null, discipline_id: null, parent_id: parentId, order_index: 0, is_published: true, test_set_id: null, image_url: null };
      case 'helper_article': return { title: '', content: '', category: 'general', tags: [], parent_id: parentId, order_index: 0, is_published: true };
      case 'test_set': return { name: '', description: '', source_description: '', direction_id: null, discipline_id: null, section_id: null, is_published: true, settings: { mode: 'practice', passing_score_pct: 70, show_explanations: 'immediate', shuffle_questions: true, shuffle_options: true, allow_retakes: true, time_limit_sec: null, question_count: null, difficulty_filter: null }, question_ids: [] };
      default: return {};
    }
  };

  const openCreateModal = (type: string) => {
    setShowCreateMenu(false);
    setModalType(type);
    setEditingItem(null);
    setFormData(getDefaultFormData(type, currentFolder));
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setModalType(item.type);
    setEditingItem(item.data);
    setFormData({ ...item.data });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const nameKey = modalType === 'helper_article' ? 'title' : 'name';
      if (modalType !== 'question' && !formData[nameKey]?.trim()) return;

      const tableMap: Record<string, string> = {
        direction: 'directions', course: 'courses', discipline: 'disciplines',
        attestation: 'attestations', attestation_exam: 'attestation_exams',
        section: 'sections', helper_article: 'helper_articles', test_set: 'test_sets',
      };

      const table = tableMap[modalType];
      if (!table) return;

      if (editingItem) {
        await supabaseAdmin.from(table).update(formData).eq('id', editingItem.id);
      } else {
        await supabaseAdmin.from(table).insert(formData);
      }

      setShowModal(false);
      loadAllData();
    } catch (e) {
      console.error(e);
      alert('Ошибка сохранения: ' + (e as any).message);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Переместить "${item.name}" в корзину?`)) return;
    await moveToTrash(supabaseAdmin, item.type, item.id, item.parentId);
    loadAllData();
  };

  const openQuestionsEditor = (testSetId: string) => {
    setSelectedTestSet(testSetId);
    loadQuestions(testSetId);
    setShowQuestionEditor(true);
  };

  const loadQuestions = async (testSetId: string) => {
    const { data } = await supabaseAdmin.from('questions').select('*');
    const testSet = allTestSets.find(i => i.id === testSetId);
    const questionIds = testSet?.question_ids || [];
    setQuestions((data as Question[] || []).filter(q => questionIds.includes(q.id)));
  };

  const handleDragStart = (nodeId: string) => {
    setDraggedNode(nodeId);
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    setDragOverNode(nodeId);
  };

  const handleDrop = async (e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault();
    if (!draggedNode || draggedNode === targetNodeId) {
      setDraggedNode(null);
      setDragOverNode(null);
      return;
    }

    const findItem = (nodes: TreeNode[], id: string): any => {
      for (const n of nodes) {
        if (n.id === id) return n;
        const found = findItem(n.children, id);
        if (found) return found;
      }
      return null;
    };

    const draggedItem = findItem(tree, draggedNode);
    if (!draggedItem) return;

    const tableMap: Record<string, string> = {
      direction: 'directions', course: 'courses', discipline: 'disciplines',
      attestation: 'attestations', attestation_exam: 'attestation_exams',
      section: 'sections', helper_article: 'helper_articles', test_set: 'test_sets',
    };

    const table = tableMap[draggedItem.type];
    if (!table) return;

    const parentIdField = draggedItem.type === 'direction' ? 'direction_type' :
                          draggedItem.type === 'course' ? 'direction_id' :
                          draggedItem.type === 'discipline' ? (draggedItem.data?.course_id !== undefined ? 'course_id' : 'direction_id') :
                          draggedItem.type === 'attestation' ? 'discipline_id' :
                          draggedItem.type === 'attestation_exam' ? 'attestation_id' :
                          draggedItem.type === 'section' ? (draggedItem.data?.discipline_id !== undefined ? 'discipline_id' : 'direction_id') :
                          draggedItem.type === 'helper_article' ? 'parent_id' :
                          draggedItem.type === 'test_set' ? 'category_id' : null;

    if (parentIdField) {
      await supabaseAdmin.from(table).update({ [parentIdField]: targetNodeId }).eq('id', draggedNode);
    }

    setDraggedNode(null);
    setDragOverNode(null);
    loadAllData();
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isFolder = node.children.length > 0 || ['direction_type', 'direction', 'course', 'discipline', 'attestation'].includes(node.type);
    const isDragOver = dragOverNode === node.id;

    return (
      <div key={node.id}>
        <div
          className={`tree-node ${isDragOver ? 'tree-node-dragover' : ''}`}
          style={{ paddingLeft: depth * 16 }}
          draggable
          onDragStart={() => handleDragStart(node.id)}
          onDragOver={e => isFolder && handleDragOver(e, node.id)}
          onDrop={e => isFolder && handleDrop(e, node.id)}
          onDragEnd={() => { setDraggedNode(null); setDragOverNode(null); }}
        >
          <button className="tree-node-toggle" onClick={() => isFolder && toggleNode(node.id)}>
            {isFolder ? (node.expanded ? (language === 'en' ? '▼' : language === 'kk' ? '▼' : '▼') : (language === 'en' ? '▶' : language === 'kk' ? '▶' : '▶')) : ' '}
          </button>
          <span className="tree-node-icon">{node.icon}</span>
          <span className="tree-node-name" onDoubleClick={() => isFolder && openFolder(node)}>
            {node.name}
          </span>
          <span className="tree-node-type">{getTypeLabel(node.type, language)}</span>
        </div>
        {node.expanded && node.children.map(child => renderTreeNode(child, depth + 1))}
      </div>
    );
  };

  const CREATE_OPTIONS = [
    { type: 'direction', label: 'Папку', labelEn: 'Folder', labelKz: 'Қалта', icon: '📂' },
    { type: 'course', label: 'Курс', labelEn: 'Course', labelKz: 'Курс', icon: '🎓' },
    { type: 'discipline', label: 'Дисциплину', labelEn: 'Discipline', labelKz: 'Пән', icon: '📚' },
    { type: 'attestation', label: 'Аттестацию', labelEn: 'Attestation', labelKz: 'Аттестация', icon: '📋' },
    { type: 'attestation_exam', label: 'Экзамен', labelEn: 'Exam', labelKz: 'Емтихан', icon: '📝' },
    { type: 'section', label: 'Тему', labelEn: 'Topic', labelKz: 'Тақырып', icon: '📄' },
    { type: 'test_set', label: 'Тест', labelEn: 'Test', labelKz: 'Сынақ', icon: '✅' },
    { type: 'helper_article', label: 'Статью', labelEn: 'Article', labelKz: 'Мақала', icon: '💡' },
  ];

  if (loading) return <div className="skeleton" style={{ height: 400 }} />;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h3>📁 {language === 'en' ? 'Tree' : language === 'kk' ? 'Ағаш' : 'Дерево'}</h3>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <div className="sidebar-tree">
          {tree.map(node => renderTreeNode(node))}
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-main-header">
          <div className="admin-breadcrumbs">
            {breadcrumbs.map((bc, i) => (
              <span key={bc.id} className="breadcrumb-item">
                <button onClick={() => navigateBreadcrumb(i)}>{bc.name}</button>
                {i < breadcrumbs.length - 1 && <span className="breadcrumb-sep">/</span>}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }} ref={createMenuRef}>
              <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); setShowCreateMenu(!showCreateMenu); }}>
                + {language === 'en' ? 'Create' : language === 'kk' ? 'Құру' : 'Создать'}
              </button>
              {showCreateMenu && (
                <div className="create-menu" onClick={e => e.stopPropagation()}>
                  {CREATE_OPTIONS.map(opt => (
                    <button key={opt.type} className="create-menu-item" onClick={() => openCreateModal(opt.type)}>
                      <span>{opt.icon}</span>
                      <span>{language === 'en' ? opt.labelEn || opt.label : language === 'kk' ? opt.labelKz || opt.label : opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link to="/admin/tests" className="btn btn-secondary btn-sm">✅ {language === 'en' ? 'My Tests' : language === 'kk' ? 'Менің сынақтарым' : 'Мои тесты'}</Link>
            <Link to="/trash" className="btn btn-ghost btn-sm">🗑️ {language === 'en' ? 'Trash' : language === 'kk' ? 'Қоқыс' : 'Корзина'}</Link>
          </div>
        </div>

        <div className="admin-content"
          onContextMenu={e => {
            e.preventDefault();
            const actions = CREATE_OPTIONS.map(opt => ({
              label: `${opt.icon} ${language === 'en' ? 'Create' : language === 'kk' ? 'Құру' : 'Создать'} ${opt.label}`,
              action: () => openCreateModal(opt.type)
            }));
            showContextMenu(e, actions);
          }}
        >
          {folderItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <h3 className="empty-state-title">{language === 'en' ? 'Folder is empty' : language === 'kk' ? 'Қалта бос' : 'Папка пуста'}</h3>
              <p className="empty-state-description">{language === 'en' ? 'Click "Create" to add' : language === 'kk' ? 'Қосу үшін "Құру" басыңыз' : 'Нажмите "Создать" для добавления'}</p>
            </div>
          ) : (
            <div className="folder-grid">
              {folderItems.map(item => (
                <div
                  key={item.id}
                  className="folder-item"
                  onDoubleClick={() => {
                    if (['direction_type', 'direction', 'course', 'discipline', 'attestation'].includes(item.type)) {
                      const treeNode = tree.find(n => n.id === item.id) || findNode(tree, item.id);
                      if (treeNode) openFolder(treeNode);
                    } else if (item.type === 'section') {
                      navigate(`/section/${item.id}`);
                    } else if (item.type === 'helper_article') {
                      navigate(`/helper/${item.id}`);
                    } else if (item.type === 'test_set') {
                      navigate(`/test/${item.id}`);
                    }
                  }}
                  onContextMenu={e => {
                    e.preventDefault();
                    const actions = [
                      { label: language === 'en' ? '✏️ Edit' : language === 'kk' ? '✏️ Өзгерту' : '✏️ Редактировать', action: () => openEditModal(item) },
                      { label: language === 'en' ? '🗑️ Delete' : language === 'kk' ? '🗑️ Жою' : '🗑️ Удалить', action: () => handleDelete(item) },
                    ];
                    if (item.type === 'test_set') {
                      actions.unshift({ label: language === 'en' ? '❓ Questions' : language === 'kk' ? '❓ Сұрақтар' : '❓ Вопросы', action: () => openQuestionsEditor(item.id) });
                    }
                    if (['direction_type', 'direction', 'course', 'discipline', 'attestation'].includes(item.type)) {
                      actions.unshift({ label: language === 'en' ? '📂 Open' : language === 'kk' ? '📂 Ашу' : '📂 Открыть', action: () => { const tn = findNode(tree, item.id); if (tn) openFolder(tn); } });
                    }
                    showContextMenu(e, actions);
                  }}
                >
                  <div className="folder-item-icon">{item.icon}</div>
                  <div className="folder-item-name">{item.name}</div>
                  <div className="folder-item-type">{getTypeLabel(item.type, language)}</div>
                  {item.type === 'test_set' && (
                    <div className="folder-item-badge">{item.data.question_ids?.length || 0} вопросов</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenuPos && (
        <div className="context-menu" style={{ left: contextMenuPos.x, top: contextMenuPos.y }} onClick={e => e.stopPropagation()}>
          {contextActions.map((action, i) => (
            <button key={i} className="context-menu-item" onClick={() => { action.action(); setContextMenuPos(null); }}>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>{editingItem ? (language === 'en' ? '✏️ Edit' : language === 'kk' ? '✏️ Өзгерту' : '✏️ Редактировать') : (language === 'en' ? '➕ Create' : language === 'kk' ? '➕ Құру' : '➕ Создать')} {getTypeLabel(modalType, language)}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {modalType === 'helper_article' && (
                <>
                  <div className="form-group"><label>Название</label><input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
                  <div className="form-group"><label>Содержание</label><RichTextEditor content={formData.content || ''} onChange={(html) => setFormData({ ...formData, content: html })} height={400} /></div>
                  <div className="form-group"><label>Категория</label>
                    <select value={formData.category || 'general'} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      <option value="preparation">Подготовка</option><option value="lifehacks">Лайфхаки</option><option value="tips">Советы</option><option value="faq">Вопросы</option><option value="general">Общее</option>
                    </select>
                  </div>
                </>
              )}
              {modalType === 'direction' && (
                <>
                  <div className="form-group"><label>Тип</label>
                    <select value={formData.direction_type || 'school'} onChange={e => setFormData({ ...formData, direction_type: e.target.value })}>
                      <option value="school">Школа</option><option value="university">Университет</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Название</label><input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="form-group"><label>Описание</label><textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                </>
              )}
              {modalType === 'course' && (
                <>
                  <div className="form-group"><label>Название</label><input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="1 курс, 2 курс..." /></div>
                  <div className="form-group"><label>Короткое название</label><input type="text" value={formData.short_name || ''} onChange={e => setFormData({ ...formData, short_name: e.target.value })} /></div>
                </>
              )}
              {modalType === 'discipline' && (
                <>
                  <div className="form-group"><label>Название</label><input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="form-group"><label>Описание</label><textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                </>
              )}
              {modalType === 'attestation' && (
                <>
                  <div className="form-group"><label>Название</label><input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="form-group"><label>Тип</label>
                    <select value={formData.attestation_type || 'attestation1'} onChange={e => setFormData({ ...formData, attestation_type: e.target.value })}>
                      <option value="attestation1">Аттестация 1</option><option value="attestation2">Аттестация 2</option><option value="session">Сессия</option>
                    </select>
                  </div>
                </>
              )}
              {modalType === 'attestation_exam' && (
                <>
                  <div className="form-group"><label>Название</label><input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="form-group"><label>Тип</label>
                    <select value={formData.exam_type || 'intermediate'} onChange={e => setFormData({ ...formData, exam_type: e.target.value })}>
                      <option value="intermediate">Промежуточный</option><option value="midterm">Midterm</option><option value="endterm">Endterm</option><option value="test">Тест</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Описание</label><textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                </>
              )}
              {modalType === 'section' && (
                <>
                  <div className="form-group"><label>Название</label><input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="form-group"><label>Описание</label><textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
                  <div className="form-group"><label>Содержание</label><RichTextEditor content={formData.content || ''} onChange={(html) => setFormData({ ...formData, content: html })} height={250} /></div>
                  <div className="form-group"><label>Лекция</label><RichTextEditor content={formData.lecture_content || ''} onChange={(html) => setFormData({ ...formData, lecture_content: html })} height={350} /></div>
                  <div className="form-group"><label>Привязать тест</label>
                    <select value={formData.test_set_id || ''} onChange={e => setFormData({ ...formData, test_set_id: e.target.value || null })}>
                      <option value="">Без теста</option>
                      {allTestSets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              {modalType === 'test_set' && (
                <>
                  <div className="form-group"><label>Название</label><input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="form-group"><label>Описание</label><textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
                  <div className="form-group"><label>Источник вопросов</label><textarea value={formData.source_description || ''} onChange={e => setFormData({ ...formData, source_description: e.target.value })} rows={2} /></div>
                  <div className="form-row">
                    <div className="form-group"><label>Режим</label>
                      <select value={formData.settings?.mode || 'practice'} onChange={e => setFormData({ ...formData, settings: { ...formData.settings, mode: e.target.value } })}>
                        <option value="practice">Практика</option><option value="exam">Экзамен</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Проходной %</label><input type="number" value={formData.settings?.passing_score_pct || 70} onChange={e => setFormData({ ...formData, settings: { ...formData.settings, passing_score_pct: parseInt(e.target.value) || 70 } })} /></div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{language === 'en' ? 'Cancel' : language === 'kk' ? 'Бас тарту' : 'Отмена'}</button>
              <button className="btn btn-primary" onClick={handleSave}>{editingItem ? (language === 'en' ? 'Save' : language === 'kk' ? 'Сақтау' : 'Сохранить') : (language === 'en' ? 'Create' : language === 'kk' ? 'Құру' : 'Создать')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Question Editor Modal */}
      {showQuestionEditor && selectedTestSet && (
        <div className="modal-overlay" onClick={() => setShowQuestionEditor(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>❓ {language === 'en' ? 'Test Questions' : language === 'kk' ? 'Сынақ сұрақтары' : 'Вопросы теста'}</h3>
              <button className="modal-close" onClick={() => setShowQuestionEditor(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/questions/${selectedTestSet}`)}>{language === 'en' ? 'Open full question editor →' : language === 'kk' ? 'Сұрақтар редакторын ашу →' : 'Открыть полный редактор вопросов →'}</button>
              </div>
              {questions.length === 0 ? (
                <p className="text-muted">{language === 'en' ? 'No questions. Add in the full editor.' : language === 'kk' ? 'Сұрақтар жоқ. Толық редакторда қосыңыз.' : 'Нет вопросов. Добавьте в полном редакторе.'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {questions.map((q, i) => (
                    <div key={q.id} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <span className="badge">{i + 1}</span>
                        <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-warning' : 'badge-info'}`}>{q.difficulty}</span>
                        <span className="badge">{q.points} баллов</span>
                      </div>
                      <p style={{ marginBottom: 8 }}>{(q.body as any)?.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowQuestionEditor(false)}>{language === 'en' ? 'Close' : language === 'kk' ? 'Жабу' : 'Закрыть'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}
