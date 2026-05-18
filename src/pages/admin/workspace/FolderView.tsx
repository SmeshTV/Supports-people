import { useNavigate } from 'react-router-dom';
import { useSelection } from '../context/SelectionContext';
import { useDeleteItem } from '../hooks/useDeleteItem';
import { usePublishToggle } from '../hooks/usePublishToggle';
import { getEntityLabel } from '../hooks/useAdminData';

type FolderViewProps = {
  items: any[];
};

export function FolderView({ items }: FolderViewProps) {
  const navigate = useNavigate();
  const { selectEntity, navigateToFolder, showContextMenu } = useSelection();
  const deleteItem = useDeleteItem();
  const togglePublish = usePublishToggle();

  const handleDoubleClick = (item: any) => {
    selectEntity(item.id);
    if (['direction_type', 'direction', 'course', 'discipline', 'attestation'].includes(item.type)) {
      navigateToFolder(item.id, item.name, item.type);
    } else if (item.type === 'section') {
      navigate(`/section/${item.id}`);
    } else if (item.type === 'test_set') {
      navigate(`/test/${item.id}`);
    } else if (item.type === 'helper_article') {
      navigate(`/helper/${item.id}`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();

    const actions: { label: string; action: () => void }[] = [];

    if (['direction_type', 'direction', 'course', 'discipline', 'attestation'].includes(item.type)) {
      actions.push({
        label: '📂 Открыть',
        action: () => navigateToFolder(item.id, item.name, item.type),
      });
    }

    if (item.type === 'test_set') {
      actions.push({
        label: '❓ Редактировать вопросы',
        action: () => navigate(`/admin/questions/${item.id}`),
      });
    }

    actions.push({
      label: '✏️ Редактировать',
      action: () => selectEntity(item.id),
    });

    actions.push({
      label: item.isPublished ? '👁 Скрыть' : '👁 Показать',
      action: () => togglePublish(item.type, item.id, item.isPublished),
    });

    actions.push({
      label: '🗑️ Удалить',
      action: () => {
        if (confirm(`Переместить "${item.name}" в корзину?`)) {
          deleteItem(item.type, item.id, item.parentId);
        }
      },
    });

    showContextMenu(e.clientX, e.clientY, actions);
  };

  return (
    <div className="folder-grid">
      {items.map(item => (
        <div
          key={item.id}
          className={`folder-item ${!item.isPublished ? 'folder-item-unpublished' : ''}`}
          onDoubleClick={() => handleDoubleClick(item)}
          onContextMenu={e => handleContextMenu(e, item)}
          onClick={() => selectEntity(item.id)}
        >
          <div className="folder-item-icon">{item.icon}</div>
          <div className="folder-item-name">{item.name}</div>
          <div className="folder-item-type">{getEntityLabel(item.type)}</div>
          {item.type === 'test_set' && (
            <div className="folder-item-badge">
              {item.data?.question_ids?.length || 0} вопросов
            </div>
          )}
          <button
            className="folder-item-publish-btn"
            onClick={e => {
              e.stopPropagation();
              togglePublish(item.type, item.id, item.isPublished);
            }}
            title={item.isPublished ? 'Скрыть' : 'Показать'}
          >
            {item.isPublished ? '👁' : '👁‍🗨'}
          </button>
        </div>
      ))}
    </div>
  );
}
