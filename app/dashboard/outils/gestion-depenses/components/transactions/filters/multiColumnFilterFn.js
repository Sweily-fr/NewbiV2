// Custom filter function for multi-column searching
export const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchableRowContent =
    `${row.original.description} ${row.original.category} ${row.original.paymentMethod} ${row.original.amount}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};
