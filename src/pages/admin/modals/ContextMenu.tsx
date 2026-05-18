type ContextMenuProps = {
  x: number;
  y: number;
  actions: { label: string; action: () => void }[];
  onClose: () => void;
};

export function ContextMenu({ x, y, actions, onClose }: ContextMenuProps) {
  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={e => e.stopPropagation()}
    >
      {actions.map((action, i) => (
        <button
          key={i}
          className="context-menu-item"
          onClick={() => {
            action.action();
            onClose();
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
