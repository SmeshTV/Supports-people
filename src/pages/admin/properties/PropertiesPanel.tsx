import { useAdminData } from '../context/AdminContext';
import { useSelection } from '../context/SelectionContext';
import { findEntity } from '../hooks/useAdminData';
import { SectionProperties } from './SectionProperties';
import { TestProperties } from './TestProperties';
import { CommonProperties } from './CommonFields';

export function PropertiesPanel() {
  const { selectedEntityId } = useSelection();
  const { entities } = useAdminData();

  if (!selectedEntityId) return null;

  const entity = findEntity(entities, selectedEntityId);
  if (!entity) return null;

  return (
    <>
      <div className="properties-header">
        <h3>📋 Свойства</h3>
        <span className="properties-type">{entity.icon} {entity.name}</span>
      </div>

      <div className="properties-content">
        {entity.type === 'section' && <SectionProperties entity={entity} />}
        {entity.type === 'test_set' && <TestProperties entity={entity} />}
        <CommonProperties entity={entity} />
      </div>
    </>
  );
}
