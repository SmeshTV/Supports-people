import { useState, useCallback, useEffect } from 'react';

export function useContextMenu() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [actions, setActions] = useState<{ label: string; action: () => void }[]>([]);

  const show = useCallback((e: React.MouseEvent, items: { label: string; action: () => void }[]) => {
    e.preventDefault();
    setActions(items);
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  const hide = useCallback(() => {
    setPos(null);
    setActions([]);
  }, []);

  useEffect(() => {
    const handleClick = () => hide();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [hide]);

  return { pos, actions, show, hide };
}
