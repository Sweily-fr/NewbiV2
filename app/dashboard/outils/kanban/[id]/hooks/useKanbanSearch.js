import { useState, useCallback } from "react";
import { formatLocalDate } from "@/src/utils/dateFormatter";
import { createSearchMatcher } from "@/src/utils/search-text";

export const useKanbanSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  // Bouton « Aa » : recherche exacte (majuscules et accents respectés)
  const [searchExact, setSearchExact] = useState(false);

  // Fonction pour filtrer les tâches selon la recherche (mémorisée pour éviter les re-calculs)
  // Sans accents ni majuscules, sauf si le bouton « Aa » est coché
  const filterTasks = useCallback(
    (tasks = []) => {
      if (!searchQuery?.trim()) return tasks;

      const match = createSearchMatcher(searchQuery, { exact: searchExact });

      return tasks.filter((task) => {
        if (!task) return false;

        // Vérifier le titre et la description
        if (match(task.title, task.description)) {
          return true;
        }

        // Vérifier les tags
        if (
          Array.isArray(task.tags) &&
          task.tags.some((tag) => match(tag?.name, tag?.color))
        ) {
          return true;
        }

        // Vérifier la checklist
        if (
          Array.isArray(task.checklist) &&
          task.checklist.some((item) => match(item?.text))
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
                formatLocalDate(dueDate),
              ];

              if (match(...dateFormats)) {
                return true;
              }
            }
          }
        } catch (e) {
          console.error("Erreur lors du traitement de la date:", e);
        }

        return false;
      });
    },
    [searchQuery, searchExact],
  );

  return {
    searchQuery,
    setSearchQuery,
    searchExact,
    setSearchExact,
    filterTasks,
  };
};
