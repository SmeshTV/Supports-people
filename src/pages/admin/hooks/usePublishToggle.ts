import { useAdminData } from '../context/AdminContext';

export function usePublishToggle() {
  const { togglePublish } = useAdminData();

  return async (type: string, id: string, current: boolean) => {
    await togglePublish(type, id, current);
  };
}
