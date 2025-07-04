import { useState, useEffect } from 'react';

export const useColumnCollapse = (boardId) => {
  const [collapsedColumns, setCollapsedColumns] = useState({});

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(`kanban-collapsed-${boardId}`);
      if (savedState) {
        setCollapsedColumns(JSON.parse(savedState));
      }
    } catch (error) {
      console.error('Failed to load collapsed columns state', error);
    }
  }, [boardId]);

  // Save to localStorage whenever collapsedColumns changes
  useEffect(() => {
    try {
      if (Object.keys(collapsedColumns).length > 0) {
        localStorage.setItem(
          `kanban-collapsed-${boardId}`,
          JSON.stringify(collapsedColumns)
        );
      }
    } catch (error) {
      console.error('Failed to save collapsed columns state', error);
    }
  }, [collapsedColumns, boardId]);

  // Check if a column is collapsed
  const isColumnCollapsed = (columnId) => {
    return !!collapsedColumns[columnId];
  };

  // Toggle collapse state for a column
  const toggleColumnCollapse = (columnId) => {
    setCollapsedColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  // Expand all columns
  const expandAll = () => {
    setCollapsedColumns({});
  };

  // Count of collapsed columns
  const collapsedColumnsCount = Object.values(collapsedColumns).filter(
    (isCollapsed) => isCollapsed
  ).length;

  return {
    isColumnCollapsed,
    toggleColumnCollapse,
    expandAll,
    collapsedColumnsCount,
  };
};
