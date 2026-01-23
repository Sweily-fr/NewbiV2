// Custom filter function for multi-column searching
export const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchTerm = (filterValue ?? "").toLowerCase().trim();
  
  // Si le terme de recherche est vide, afficher toutes les lignes
  if (!searchTerm) return true;
  
  // Construire le contenu recherchable avec gestion des valeurs nulles/undefined
  const description = row.original.description || "";
  const vendor = row.original.vendor || "";
  const category = row.original.category || "";
  const paymentMethod = row.original.paymentMethod || "";
  const amount = row.original.amount ? row.original.amount.toString() : "";
  const notes = row.original.notes || "";
  
  const searchableRowContent = `${description} ${vendor} ${category} ${paymentMethod} ${amount} ${notes}`.toLowerCase();
  
  return searchableRowContent.includes(searchTerm);
};
