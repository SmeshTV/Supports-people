import { useState } from 'react';
import { useAdminData } from '../context/AdminContext';
import { useSelection } from '../context/SelectionContext';
import { buildTree, isFolderType } from '../hooks/useAdminData';
import { TreeNode } from './TreeNode';

export function AdminSidebar() {
  const { entities } = useAdminData();
  const { sidebarOpen, toggleSidebar } = useSelection();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const tree = buildTree(entities);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="sidebar-header">
        <h3>📁 Навигация</h3>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>
      <div className="sidebar-tree">
        {tree.map(node => (
          <TreeNode
            key={node.id}
            entity={node}
            depth={0}
            isExpanded={expandedNodes.has(node.id)}
            onToggle={toggleNode}
            isFolder={isFolderType(node.type)}
          />
        ))}
      </div>
    </>
  );
}
