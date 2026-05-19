import { useState, useCallback } from 'react';
import { useAdminData } from '../context/AdminContext';
import { useSelection } from '../context/SelectionContext';
import { isFolderType, getEntityLabel } from '../hooks/useAdminData';
import { supabaseAdmin } from '../../../lib/supabase';

type TreeNodeProps = {
  entity: any;
  depth: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  isFolder: boolean;
};

const TABLE_MAP: Record<string, string> = {
  direction: 'directions',
  course: 'courses',
  discipline: 'disciplines',
  attestation: 'attestations',
  attestation_exam: 'attestation_exams',
  section: 'sections',
  helper_article: 'helper_articles',
  test_set: 'test_sets',
};

function getDropUpdateData(targetType: string, targetId: string, draggedType: string): Record<string, any> | null {
  const d: Record<string, any> = {};

  switch (targetType) {
    case 'direction_type':
      if (draggedType === 'direction') {
        return {};
      }
      return null;
    case 'direction':
      d.direction_id = targetId;
      if (draggedType === 'discipline') {
        d.course_id = null;
      }
      if (draggedType === 'test_set') {
        d.course_id = null;
        d.discipline_id = null;
      }
      break;
    case 'course':
      d.course_id = targetId;
      if (draggedType === 'discipline') {
        d.direction_id = null;
      }
      if (draggedType === 'test_set') {
        d.direction_id = null;
        d.discipline_id = null;
      }
      break;
    case 'discipline':
      d.discipline_id = targetId;
      if (draggedType === 'attestation') {
        return null;
      }
      if (draggedType === 'section') {
        d.direction_id = null;
      }
      if (draggedType === 'test_set') {
        d.direction_id = null;
        d.course_id = null;
      }
      break;
    case 'attestation':
      d.parent_id = targetId;
      if (draggedType === 'attestation_exam') {
        d.attestation_id = targetId;
      }
      if (draggedType === 'section') {
        d.direction_id = null;
        d.discipline_id = null;
      }
      if (draggedType === 'test_set') {
        d.direction_id = null;
        d.discipline_id = null;
        d.course_id = null;
      }
      break;
    case 'attestation_exam':
      d.parent_id = targetId;
      if (draggedType === 'section') {
        d.direction_id = null;
        d.discipline_id = null;
      }
      if (draggedType === 'test_set') {
        d.direction_id = null;
        d.discipline_id = null;
        d.course_id = null;
      }
      break;
    case 'section':
      d.parent_id = targetId;
      if (draggedType === 'test_set') {
        d.section_id = targetId;
        d.direction_id = null;
        d.discipline_id = null;
        d.course_id = null;
      }
      break;
    default:
      if (isFolderType(targetType)) {
        d.parent_id = targetId;
      } else {
        return null;
      }
  }

  return d;
}

export function TreeNode({ entity, depth, isExpanded, onToggle, isFolder }: TreeNodeProps) {
  const { entities, refresh } = useAdminData();
  const { selectEntity, navigateToFolder, currentFolderId } = useSelection();
  const [dragOver, setDragOver] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

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

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', entity.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(entity.id);
    (e.currentTarget as HTMLDivElement).style.opacity = '0.4';
  }, [entity.id]);

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).style.opacity = '1';
    setDragOver(false);
    setDraggedId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedIdData = e.dataTransfer.getData('text/plain');
    if (draggedIdData && draggedIdData !== entity.id && isFolderType(entity.type)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOver(true);
    }
  }, [entity.id, entity.type]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const draggedIdData = e.dataTransfer.getData('text/plain');
    if (!draggedIdData || draggedIdData === entity.id) return;
    if (!isFolderType(entity.type)) return;

    const draggedEntity = entities.find(en => en.id === draggedIdData);
    if (!draggedEntity) return;

    const isDescendant = (parentId: string | null): boolean => {
      if (!parentId) return false;
      if (parentId === draggedIdData) return true;
      const p = entities.find(en => en.id === parentId);
      return p ? isDescendant(p.parentId) : false;
    };
    if (isDescendant(entity.parentId)) return;

    const updateData = getDropUpdateData(entity.type, entity.id, draggedEntity.type);
    if (!updateData) return;

    const table = TABLE_MAP[draggedEntity.type];
    if (!table) return;

    const siblings = entities.filter(en => en.parentId === entity.id);
    updateData.order_index = siblings.length;

    const { error } = await supabaseAdmin.from(table).update(updateData).eq('id', draggedIdData);
    if (error) {
      console.error('Drop error:', error);
      alert('Ошибка: ' + error.message);
      return;
    }

    await refresh();
  }, [entity.id, entity.type, entities, refresh]);

  const isBeingDragged = draggedId === entity.id;

  return (
    <div>
      <div
        className={`tree-node ${currentFolderId === entity.id ? 'tree-node-active' : ''} ${!entity.isPublished ? 'tree-node-unpublished' : ''} ${dragOver ? 'tree-node-dragover' : ''} ${isBeingDragged ? 'tree-node-dragging' : ''}`}
        style={{ paddingLeft: depth * 16 }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
