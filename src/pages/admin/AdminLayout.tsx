import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AdminProvider } from './context/AdminContext';
import { SelectionProvider, useSelection } from './context/SelectionContext';
import { AdminSidebar } from './sidebar/AdminSidebar';
import { Workspace } from './workspace/Workspace';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { CreateModal } from './modals/CreateModal';
import { ContextMenu } from './modals/ContextMenu';

const DEV_EMAIL = 'smeshtrend@gmail.com';

function AdminLayoutInner() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    sidebarOpen,
    propertiesOpen,
    showCreateMenu,
    contextMenuPos,
    contextActions,
    toggleSidebar,
    setShowCreateMenu,
    hideContextMenu,
  } = useSelection();

  useEffect(() => {
    if (!user || user.email !== DEV_EMAIL) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.email !== DEV_EMAIL) {
    return null;
  }

  return (
    <div className="admin-layout" style={{ paddingTop: 64 }}>
      {/* Mobile Sidebar Toggle */}
      <button className="admin-mobile-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={toggleSidebar} />}

      {/* Left Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <AdminSidebar />
      </div>

      {/* Main Workspace */}
      <div className="admin-main">
        <Workspace />
      </div>

      {/* Right Properties Panel */}
      {propertiesOpen && (
        <div className="admin-properties">
          <PropertiesPanel />
        </div>
      )}

      {/* Create Modal */}
      <CreateModal isOpen={showCreateMenu} onClose={() => setShowCreateMenu(false)} />

      {/* Context Menu */}
      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          actions={contextActions}
          onClose={hideContextMenu}
        />
      )}
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminProvider>
      <SelectionProvider>
        <AdminLayoutInner />
      </SelectionProvider>
    </AdminProvider>
  );
}
