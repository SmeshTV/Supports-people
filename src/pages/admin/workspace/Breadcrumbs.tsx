import { useSelection } from '../context/SelectionContext';

export function Breadcrumbs() {
  const { breadcrumbs, navigateBreadcrumb, selectEntity } = useSelection();

  return (
    <div className="admin-breadcrumbs">
      {breadcrumbs.map((bc, i) => (
        <span key={bc.id} className="breadcrumb-item">
          <button
            onClick={() => {
              navigateBreadcrumb(i);
              if (i === 0) selectEntity(null);
            }}
            className={i === breadcrumbs.length - 1 ? 'breadcrumb-current' : ''}
          >
            {bc.name}
          </button>
          {i < breadcrumbs.length - 1 && <span className="breadcrumb-sep">/</span>}
        </span>
      ))}
    </div>
  );
}
