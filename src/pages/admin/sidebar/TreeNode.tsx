import { useAdminData } from '../context/AdminContext';
import { useSelection } from '../context/SelectionContext';
import { isFolderType, getEntityLabel } from '../hooks/useAdminData';

type TreeNodeProps = {
  entity: any;
  depth: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  isFolder: boolean;
};

export function TreeNode({ entity, depth, isExpanded, onToggle, isFolder }: TreeNodeProps) {
  const { entities } = useAdminData();
  const { selectEntity, navigateToFolder, currentFolderId } = useSelection();

  const children = isFolder
    ? entities.filter(e => e.parentId === entity.id)
    : [];

  const hasChildren = children.length > 0 || isFolder;

  const handleClick = () => {
    if (isFolder) {
      onToggle(entity.id);
    }
    selectEntity(entity.id);
  };

  const handleDoubleClick = () => {
    if (isFolder) {
      navigateToFolder(entity.id, entity.name, entity.type);
    }
  };

  return (
    <div>
      <div
        className={`tree-node ${currentFolderId === entity.id ? 'tree-node-active' : ''} ${!entity.isPublished ? 'tree-node-unpublished' : ''}`}
        style={{ paddingLeft: depth * 16 }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <button
          className="tree-node-toggle"
          onClick={e => {
            e.stopPropagation();
            if (hasChildren) onToggle(entity.id);
          }}
        >
          {hasChildren ? (isExpanded ? '▼' : '▶') : ' '}
        </button>
        <span className="tree-node-icon">{entity.icon}</span>
        <span className="tree-node-name">{entity.name}</span>
        <span className="tree-node-type">{getEntityLabel(entity.type)}</span>
      </div>
      {isExpanded && children.map(child => (
        <TreeNode
          key={child.id}
          entity={child}
          depth={depth + 1}
          isExpanded={isExpanded}
          onToggle={onToggle}
          isFolder={isFolderType(child.type)}
        />
      ))}
    </div>
  );
}
