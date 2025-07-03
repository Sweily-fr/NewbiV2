"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  useBoard,
  useCreateColumn,
  useCreateTask,
  useMoveTask,
  useTaskDragAndDrop,
} from "@/src/hooks/useKanban";
import Column from "./components/kanban/Column";
import AddColumnDialog from "./components/kanban/AddColumnDialog";
import AddTaskDialog from "./components/kanban/AddTaskDialog";

export default function KanbanBoard() {
  const { id } = useParams();
  const router = useRouter();
  const { board, loading, error, refetch } = useBoard(id);
  const { createColumn } = useCreateColumn();
  const { createTask } = useCreateTask();
  const { moveTask } = useMoveTask();
  const { onDragEnd } = useTaskDragAndDrop();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);

  const handleAddColumn = async (title, color) => {
    try {
      await createColumn({
        variables: {
          input: {
            title,
            color,
            boardId: id,
            order: board?.columns?.length || 0,
          },
        },
      });
      toast.success("Colonne ajoutée avec succès");
      refetch();
    } catch (error) {
      console.error("Erreur lors de la création de la colonne:", error);
      toast.error("Erreur lors de la création de la colonne");
    }
  };

  const handleAddTask = async (columnId, values) => {
    try {
      await createTask({
        variables: {
          input: {
            ...values,
            boardId: id,
            columnId,
            status: "TODO",
            position:
              board?.tasks?.filter((t) => t.columnId === columnId).length || 0,
          },
        },
      });
      toast.success("Tâche ajoutée avec succès");
      refetch();
    } catch (error) {
      console.error("Erreur lors de la création de la tâche:", error);
      toast.error("Erreur lors de la création de la tâche");
    }
  };

  const handleMoveTask = useCallback(
    async (taskId, sourceColumnId, targetColumnId, position) => {
      try {
        await moveTask({
          variables: {
            id: taskId,
            columnId: targetColumnId,
            position,
          },
        });
      } catch (error) {
        console.error("Erreur lors du déplacement de la tâche:", error);
        toast.error("Erreur lors du déplacement de la tâche");
        // On recharge le board pour revenir à l'état précédent
        refetch();
      }
    },
    [moveTask, refetch]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500">Erreur: {error.message}</div>
        <Button
          onClick={() => router.push("/dashboard/outils/kanban")}
          className="mt-4"
        >
          Retour aux tableaux
        </Button>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="container mx-auto p-6">
        <div>Tableau non trouvé</div>
        <Button
          onClick={() => router.push("/dashboard/outils/kanban")}
          className="mt-4"
        >
          Retour aux tableaux
        </Button>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-800">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Tableau Kanban
                </h1>
                <p className="text-sm text-gray-500">
                  Gérez vos tâches efficacement
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filtres
              </Button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une tâche..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
                <svg
                  className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Button
                onClick={() => setIsAddingColumn(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une colonne
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden bg-gray-50">
          <ScrollArea className="h-full">
            <div className="flex space-x-6 p-6 min-w-max">
              {[...board.columns]
                .sort((a, b) => a.order - b.order)
                .map((column) => (
                  <Column
                    key={column.id}
                    column={column}
                    tasks={[...board.tasks]
                      .filter((task) => task.columnId === column.id)
                      .sort((a, b) => a.position - b.position)}
                    onAddTask={() => setSelectedColumn(column.id)}
                    onMoveTask={handleMoveTask}
                  />
                ))}
            </div>
          </ScrollArea>
        </main>
      </div>

      <AddColumnDialog
        open={isAddingColumn}
        onOpenChange={setIsAddingColumn}
        boardId={id}
        onColumnAdded={() => refetch()}
      />

      <AddTaskDialog
        open={!!selectedColumn}
        onOpenChange={(open) => !open && setSelectedColumn(null)}
        onSubmit={(values) => {
          handleAddTask(selectedColumn, values);
          setSelectedColumn(null);
        }}
      />
    </DndProvider>
  );
}
