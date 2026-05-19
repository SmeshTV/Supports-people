import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Breadcrumb = {
  id: string;
  name: string;
  type: string;
};

type SelectionContextValue = {
  currentFolderId: string | null;
  currentFolderType: string | null;
  selectedEntityId: string | null;
  breadcrumbs: Breadcrumb[];
  sidebarOpen: boolean;
  propertiesOpen: boolean;
  showCreateMenu: boolean;
  contextMenuPos: { x: number; y: number } | null;
  contextActions: { label: string; action: () => void }[];
  navigateToFolder: (id: string, name: string, type: string) => void;
  navigateBreadcrumb: (index: number) => void;
  selectEntity: (id: string | null) => void;
  toggleSidebar: () => void;
  toggleProperties: () => void;
  setShowCreateMenu: (open: boolean) => void;
  showContextMenu: (x: number, y: number, actions: { label: string; action: () => void }[]) => void;
  hideContextMenu: () => void;
  reset: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderType, setCurrentFolderType] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
    { id: 'root', name: 'Корень', type: 'root' }
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [contextActions, setContextActions] = useState<{ label: string; action: () => void }[]>([]);

  const navigateToFolder = useCallback((id: string, name: string, type: string) => {
    setCurrentFolderId(id);
    setCurrentFolderType(type);
    setSelectedEntityId(null);
    setBreadcrumbs(prev => [...prev, { id, name, type }]);
    setPropertiesOpen(false);
  }, []);

  const navigateBreadcrumb = useCallback((index: number) => {
    const bc = breadcrumbs[index];
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setCurrentFolderId(bc.id === 'root' ? null : bc.id);
    setCurrentFolderType(bc.type === 'root' ? null : bc.type);
    setSelectedEntityId(null);
    setPropertiesOpen(false);
  }, [breadcrumbs]);

  const selectEntity = useCallback((id: string | null) => {
    setSelectedEntityId(id);
    setPropertiesOpen(!!id);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const toggleProperties = useCallback(() => setPropertiesOpen(prev => !prev), []);

  const showContextMenu = useCallback((x: number, y: number, actions: { label: string; action: () => void }[]) => {
    setContextActions(actions);
    setContextMenuPos({ x, y });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenuPos(null);
    setContextActions([]);
  }, []);

  const reset = useCallback(() => {
    setCurrentFolderId(null);
    setCurrentFolderType(null);
    setSelectedEntityId(null);
    setBreadcrumbs([{ id: 'root', name: 'Корень', type: 'root' }]);
    setPropertiesOpen(false);
    setShowCreateMenu(false);
    hideContextMenu();
  }, [hideContextMenu]);

  return (
    <SelectionContext.Provider value={{
      currentFolderId,
      currentFolderType,
      selectedEntityId,
      breadcrumbs,
      sidebarOpen,
      propertiesOpen,
      showCreateMenu,
      contextMenuPos,
      contextActions,
      navigateToFolder,
      navigateBreadcrumb,
      selectEntity,
      toggleSidebar,
      toggleProperties,
      setShowCreateMenu,
      showContextMenu,
      hideContextMenu,
      reset,
    }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within SelectionProvider');
  return ctx;
}
