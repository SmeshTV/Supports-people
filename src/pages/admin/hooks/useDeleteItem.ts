import { useAdminData } from '../context/AdminContext';

export function useDeleteItem() {
  const { deleteEntity } = useAdminData();

  return async (type: string, id: string, parentId: string | null) => {
    await deleteEntity(type, id, parentId);
  };
}
