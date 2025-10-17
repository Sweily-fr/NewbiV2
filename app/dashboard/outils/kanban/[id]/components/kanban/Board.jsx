"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, ArrowLeft, LoaderCircle, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { DragDropContext } from "@hello-pangea/dnd";
import Link from "next/link";
import { toast } from "@/src/components/ui/sonner";
import { format, parse, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_BOARD,
  CREATE_COLUMN,
  UPDATE_TASK,
  MOVE_TASK,
} from "@/src/graphql/kanbanQueries";
import Column from "./Column";
import AddColumnDialog from "./AddColumnDialog";

const Board = () => {
  const { id } = useParams();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // État pour les filtres avancés
  const [filters, setFilters] = useState({
    title: "",
    tags: [],
    priority: "",
    dueDate: null,
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // GraphQL hooks
  const {
    data,
    loading: isLoading,
    error,
    refetch,
  } = useQuery(GET_BOARD, {
    variables: { id },
    errorPolicy: "all",
  });

  const [createColumn] = useMutation(CREATE_COLUMN);
  const [updateTask] = useMutation(UPDATE_TASK);
  const [moveTask] = useMutation(MOVE_TASK);

  // Extraire les colonnes et tâches des données GraphQL
  const columns = data?.board?.columns || [];
  const tasks = data?.board?.tasks || [];

  // Associer les tâches aux colonnes
  const columnsWithTasks = columns.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.columnId === column.id),
  }));

  // Extraire tous les tags uniques des tâches
  useEffect(() => {
    const tags = new Set();
    columnsWithTasks.forEach((column) => {
      column.tasks?.forEach((task) => {
        task.tags?.forEach((tag) => {
          const tagName =
            typeof tag === "string" ? tag : tag.name || tag.text || "";
          if (tagName) tags.add(tagName);
        });
      });
    });
    setAvailableTags(Array.from(tags));
  }, [columnsWithTasks]);

  // Vérifier si des filtres sont actifs
  useEffect(() => {
    const hasActiveFilters =
      filters.title !== "" ||
      filters.tags.length > 0 ||
      filters.priority !== "" ||
      filters.dueDate !== null;
    setIsFilterActive(hasActiveFilters);
  }, [filters]);

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setFilters({
      title: "",
      tags: [],
      priority: "",
      dueDate: null,
    });
  };

  // Fonctions pour gérer les colonnes
  const handleAddColumn = useCallback(
    async (newColumnData) => {
      try {
        const { data: mutationData } = await createColumn({
          variables: {
            input: {
              ...newColumnData,
              boardId: id,
            },
          },
        });

        if (mutationData?.createColumn) {
          // Refetch pour mettre à jour les données
          await refetch();
          toast.success("Colonne créée avec succès");
          return true;
        }
        throw new Error("Erreur lors de la création de la colonne");
      } catch (error) {
        console.error("Erreur création colonne:", error);
        toast.error(
          error.message || "Erreur lors de la création de la colonne"
        );
        return false;
      }
    },
    [id, createColumn, refetch]
  );

  // Gestion des erreurs GraphQL
  useEffect(() => {
    if (error) {
      console.error("Erreur GraphQL:", error);
      toast.error("Erreur lors du chargement des données");
    }
  }, [error]);

  // Gestion du glisser-déposer
  const onDragEnd = useCallback(
    async (result) => {
      const { source, destination, draggableId, type } = result;
      setIsDragging(false);

      // Si pas de destination ou si la position n'a pas changé, ne rien faire
      if (
        !destination ||
        (source.droppableId === destination.droppableId &&
          source.index === destination.index)
      ) {
        return;
      }

      // Gestion du drag and drop des tâches
      if (type === "task") {
        try {
          // Utiliser la mutation MOVE_TASK pour déplacer la tâche
          const { data: moveData } = await moveTask({
            variables: {
              id: draggableId,
              columnId: destination.droppableId,
              position: destination.index,
            },
          });

          if (moveData?.moveTask) {
            // Refetch pour mettre à jour l'interface
            await refetch();

            // Afficher une notification de succès
            const sourceCol = columnsWithTasks.find(
              (col) => col.id === source.droppableId
            );
            const destCol = columnsWithTasks.find(
              (col) => col.id === destination.droppableId
            );
            const sourceColName = sourceCol?.title || "colonne source";
            const destColName = destCol?.title || "colonne destination";

            if (source.droppableId === destination.droppableId) {
              toast.success(`Tâche déplacée avec succès dans "${destColName}"`);
            } else {
              toast.success(
                `Tâche déplacée de "${sourceColName}" vers "${destColName}"`
              );
            }
          } else {
            throw new Error("Erreur lors du déplacement de la tâche");
          }
        } catch (error) {
          console.error("Erreur lors du drag and drop:", error);
          toast.error("Erreur lors du déplacement de la tâche");
        }
      }
    },
    [moveTask, refetch, columnsWithTasks]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex flex-col bg-white p-6 w-full pb-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <Link href="/boards" className="inline-block">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Tableau Kanban</h1>
            </div>
            <p className="text-muted-foreground text-sm ml-10">
              Gérez vos tâches efficacement
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Bouton de filtre avancé */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={isFilterActive ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                  {isFilterActive && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-primary-foreground"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtres avancés</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground"
                      onClick={resetFilters}
                    >
                      Réinitialiser
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Titre contient</Label>
                    <Input
                      placeholder="Rechercher dans le titre..."
                      value={filters.title}
                      onChange={(e) =>
                        setFilters({ ...filters, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Priorité</Label>
                    <Select
                      value={filters.priority}
                      onValueChange={(value) =>
                        setFilters({ ...filters, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les priorités" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Toutes les priorités
                        </SelectItem>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date d'échéance</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {filters.dueDate ? (
                            format(new Date(filters.dueDate), "PPP", {
                              locale: fr,
                            })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            filters.dueDate
                              ? new Date(filters.dueDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            setFilters({ ...filters, dueDate: date })
                          }
                          initialFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {availableTags.length > 0 && (
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                          <Button
                            key={tag}
                            variant={
                              filters.tags.includes(tag) ? "default" : "outline"
                            }
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => {
                              setFilters((prev) => ({
                                ...prev,
                                tags: prev.tags.includes(tag)
                                  ? prev.tags.filter((t) => t !== tag)
                                  : [...prev.tags, tag],
                              }));
                            }}
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher une tâche..."
                className="pl-10 w-64 h-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button onClick={() => setIsAddingColumn(true)} className="h-8">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une colonne
            </Button>
          </div>
        </div>

        <div
          className="w-full overflow-hidden"
          style={{ minHeight: "calc(100vh - 180px)" }}
        >
          <DragDropContext
            onDragEnd={onDragEnd}
            onDragStart={() => setIsDragging(true)}
          >
            <div
              className="scroll-container"
              style={{
                display: "flex",
                overflowX: "auto",
                padding: "0 1rem 1rem 1rem",
                height: "100%",
                alignItems: "flex-start",
                gap: "1rem",
                scrollbarWidth: "none" /* Firefox */,
                scrollbarColor: "transparent transparent",
                WebkitOverflowScrolling: "touch",
                msOverflowStyle: "none" /* IE and Edge */,
                scrollBehavior: "smooth",
              }}
            >
              <style jsx>{`
                .scroll-container {
                  scrollbar-width: none; /* Firefox */
                  -ms-overflow-style: none; /* IE and Edge */
                  scrollbar-color: transparent transparent;
                }
                .scroll-container::-webkit-scrollbar {
                  display: none; /* Chrome, Safari and Opera */
                  width: 0;
                  height: 0;
                }
                .scroll-container::-webkit-scrollbar-thumb {
                  background-color: transparent;
                }
                .scroll-container::-webkit-scrollbar-track {
                  background-color: transparent;
                }
              `}</style>

              {columnsWithTasks.map((column) => {
                // Fonction pour normaliser les dates pour la comparaison
                const normalizeDate = (dateString) => {
                  if (!dateString) return "";
                  try {
                    const date = new Date(dateString);
                    // Formater en YYYY-MM-DD pour une comparaison précise
                    return date.toISOString().split("T")[0];
                  } catch (e) {
                    return "";
                  }
                };

                // Fonction pour essayer de parser la requête comme une date
                const parseQueryAsDate = (query) => {
                  // Essayer différents formats de date
                  const dateFormats = [
                    "d MMMM yyyy", // 27 juin 2025
                    "d MMM yyyy", // 27 juin 2025 (abrégé)
                    "d/M/yyyy", // 27/6/2025
                    "d-M-yyyy", // 27-6-2025
                    "d.M.yyyy", // 27.6.2025
                    "yyyy-MM-dd", // 2025-06-27 (format ISO)
                  ];

                  for (const format of dateFormats) {
                    try {
                      // Essayer avec le format complet
                      const parsed = parse(query, format, new Date(), {
                        locale: fr,
                      });
                      if (isValid(parsed)) {
                        return parsed;
                      }

                      // Essayer avec le format court (sans l'année)
                      if (format.includes("yyyy")) {
                        const shortFormat = format
                          .replace(" yyyy", "")
                          .replace("-yyyy", "")
                          .replace(".yyyy", "");
                        const currentYear = new Date().getFullYear();
                        const dateWithCurrentYear = `${query} ${currentYear}`;
                        const parsedShort = parse(
                          dateWithCurrentYear,
                          `${shortFormat} yyyy`,
                          new Date(),
                          { locale: fr }
                        );
                        if (isValid(parsedShort)) {
                          return parsedShort;
                        }
                      }
                    } catch (e) {
                      // Continuer avec le format suivant
                    }
                  }
                  return null;
                };

                const filteredTasks =
                  column.tasks?.flatMap((task) => {
                    const taskDueDate = task.dueDate
                      ? new Date(task.dueDate)
                      : null;

                    // Vérifier si la tâche correspond aux filtres avancés
                    const matchesFilters = () => {
                      // Filtre par titre
                      if (
                        filters.title &&
                        !task.title
                          ?.toLowerCase()
                          .includes(filters.title.toLowerCase())
                      ) {
                        return false;
                      }

                      // Filtre par priorité
                      if (
                        filters.priority &&
                        filters.priority !== "all" &&
                        task.priority !== filters.priority
                      ) {
                        return false;
                      }

                      // Filtre par date d'échéance
                      if (filters.dueDate) {
                        const filterDate = new Date(filters.dueDate);
                        if (
                          !taskDueDate ||
                          taskDueDate.getDate() !== filterDate.getDate() ||
                          taskDueDate.getMonth() !== filterDate.getMonth() ||
                          taskDueDate.getFullYear() !== filterDate.getFullYear()
                        ) {
                          return false;
                        }
                      }

                      // Filtre par tags
                      if (filters.tags.length > 0) {
                        const taskTags = (task.tags || []).map((tag) =>
                          typeof tag === "string"
                            ? tag.toLowerCase()
                            : (tag.name || "").toLowerCase()
                        );
                        const hasMatchingTag = filters.tags.some((tag) =>
                          taskTags.includes(tag.toLowerCase())
                        );
                        if (!hasMatchingTag) return false;
                      }

                      return true;
                    };

                    // Vérifier les filtres avancés
                    if (!matchesFilters()) {
                      return [];
                    }

                    // Si recherche textuelle, vérifier la correspondance
                    if (searchQuery) {
                      const query = searchQuery.trim().toLowerCase();
                      const queryAsDate = parseQueryAsDate(query);

                      // Vérifier la date
                      if (queryAsDate && taskDueDate) {
                        const queryDateStr = queryAsDate
                          .toISOString()
                          .split("T")[0];
                        const taskDateStr = taskDueDate
                          .toISOString()
                          .split("T")[0];
                        if (queryDateStr === taskDateStr) {
                          return [task];
                        }
                      }

                      // Vérifier les autres champs
                      const matchesSearch = [
                        task.title,
                        task.description,
                        task.priority,
                        taskDueDate
                          ? format(taskDueDate, "d MMMM yyyy", { locale: fr })
                          : "",
                        taskDueDate
                          ? format(taskDueDate, "d MMM yyyy", { locale: fr })
                          : "",
                        taskDueDate ? format(taskDueDate, "d/M/yyyy") : "",
                        ...(task.tags || []).map((tag) =>
                          typeof tag === "string" ? tag : tag.name
                        ),
                        ...(task.comments || []).map((c) => c.content || ""),
                      ].some(
                        (field) =>
                          field &&
                          field.toString().toLowerCase().includes(query)
                      );

                      return matchesSearch ? [task] : [];
                    }

                    return [task];
                  }) || [];

                if (
                  (searchQuery || isFilterActive) &&
                  filteredTasks.length === 0
                ) {
                  return null;
                }

                return (
                  <Column
                    key={column.id}
                    column={{
                      ...column,
                      tasks: searchQuery ? filteredTasks : column.tasks,
                      // Ajouter un indicateur visuel pour les colonnes filtrées
                      isSearching: !!searchQuery,
                    }}
                    onUpdate={refetch}
                    isDragging={isDragging}
                    columns={columnsWithTasks}
                  />
                );
              })}

              {/* Bouton pour ajouter une colonne à droite */}
              <div className="flex-shrink-0 w-80 h-27 mt-0">
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="w-full h-full rounded-lg border-2 border-dashed border-muted-foreground/40 hover:border-muted-foreground/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter une colonne
                </button>
              </div>
            </div>
          </DragDropContext>
        </div>

        <AddColumnDialog
          open={isAddingColumn}
          onOpenChange={setIsAddingColumn}
          onAddColumn={handleAddColumn}
        />
      </div>
    </div>
  );
};

export default Board;
