import { useState } from 'react';

export const useKanbanSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Fonction pour filtrer les tâches selon la recherche
  const filterTasks = (tasks = []) => {
    if (!searchQuery?.trim()) return tasks;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return tasks;

    return tasks.filter((task) => {
      if (!task) return false;

      // Vérifier le titre et la description
      if (
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      ) {
        return true;
      }

      // Vérifier les tags
      if (
        Array.isArray(task.tags) &&
        task.tags.some(
          (tag) =>
            tag?.name?.toLowerCase().includes(query) ||
            tag?.color?.toLowerCase().includes(query)
        )
      ) {
        return true;
      }

      // Vérifier la checklist
      if (
        Array.isArray(task.checklist) &&
        task.checklist.some((item) => item?.text?.toLowerCase().includes(query))
      ) {
        return true;
      }

      // Vérifier la date d'échéance
      try {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          if (!isNaN(dueDate.getTime())) {
            const dateFormats = [
              dueDate.toLocaleDateString("fr-FR"),
              dueDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
              dueDate.toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
              dueDate.toISOString().split("T")[0],
            ];

            if (
              dateFormats.some((format) =>
                format?.toLowerCase().includes(query)
              )
            ) {
              return true;
            }
          }
        }
      } catch (e) {
        console.error("Erreur lors du traitement de la date:", e);
      }

      return false;
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    filterTasks,
  };
};
