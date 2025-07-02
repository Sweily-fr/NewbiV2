import { useState, useEffect } from 'react';

export function useCollapsibleColumn(columnId) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Charger l'état depuis le localStorage
    const collapsedColumns = JSON.parse(localStorage.getItem('collapsedColumns') || '{}');
    if (collapsedColumns[columnId] !== undefined) {
      setIsCollapsed(collapsedColumns[columnId]);
    }
  }, [columnId]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const newState = !prev;
      // Mettre à jour le localStorage
      const collapsedColumns = JSON.parse(localStorage.getItem('collapsedColumns') || '{}');
      collapsedColumns[columnId] = newState;
      localStorage.setItem('collapsedColumns', JSON.stringify(collapsedColumns));
      return newState;
    });
  };

  return { isCollapsed, toggleCollapse };
}
