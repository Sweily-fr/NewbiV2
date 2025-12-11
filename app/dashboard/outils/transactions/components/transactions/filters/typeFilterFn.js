// Custom filter function for filtering by type
export const typeFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const type = row.getValue(columnId);
  return filterValue.includes(type);
};
