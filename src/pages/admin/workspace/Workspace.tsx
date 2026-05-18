import { useAdminData } from '../context/AdminContext';
import { useSelection } from '../context/SelectionContext';
import { getChildrenForFolder } from '../hooks/useAdminData';
import { Breadcrumbs } from './Breadcrumbs';
import { FolderView } from './FolderView';
import { EmptyState } from './EmptyState';

export function Workspace() {
  const { entities, loading } = useAdminData();
  const { currentFolderId, setShowCreateMenu, showContextMenu } = useSelection();

  const children = getChildrenForFolder(entities, currentFolderId);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const actions = [
      { type: 'direction', label: 'Папку', icon: '📂' },
      { type: 'course', label: 'Курс', icon: '🎓' },
      { type: 'discipline', label: 'Дисциплину', icon: '📚' },
      { type: 'attestation', label: 'Аттестацию', icon: '📋' },
      { type: 'attestation_exam', label: 'Экзамен', icon: '📝' },
      { type: 'section', label: 'Тему', icon: '📄' },
      { type: 'test_set', label: 'Тест', icon: '✅' },
      { type: 'helper_article', label: 'Статью', icon: '💡' },
    ].map(opt => ({
      label: `${opt.icon} Создать ${opt.label}`,
      action: () => setShowCreateMenu(true)
    }));
    showContextMenu(e.clientX, e.clientY, actions);
  };

  if (loading) {
    return (
      <div className="admin-main-header">
        <Breadcrumbs />
      </div>
    );
  }

  return (
    <>
      <div className="admin-main-header">
        <Breadcrumbs />
        <div className="admin-header-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateMenu(true)}
          >
            + Создать
          </button>
        </div>
      </div>

      <div className="admin-content" onContextMenu={handleContextMenu}>
        {children.length === 0 ? (
          <EmptyState />
        ) : (
          <FolderView items={children} />
        )}
      </div>
    </>
  );
}
