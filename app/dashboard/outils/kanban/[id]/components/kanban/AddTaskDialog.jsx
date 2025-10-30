"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { useMutation } from "@apollo/client";
import { Dialog, DialogContent } from "@/src/components/ui/dialog";
import { TaskForm } from "./TaskForm";
import { CREATE_TASK } from "@/src/graphql/kanbanQueries";

const AddTaskDialog = ({
  open,
  onOpenChange,
  columnId,
  onTaskAdded,
  columns = [],
}) => {
  const { id: boardId } = useParams();
  const [isLoading, setIsLoading] = useState(false);

  const [createTask] = useMutation(CREATE_TASK, {
    // Pas de refetchQueries - la subscription temps réel s'en charge
    onCompleted: () => {
      // Plus de toast ici - la subscription affiche déjà une notification
      onTaskAdded?.();
      onOpenChange?.(false);
    },
    onError: (error) => {
      console.error("Erreur GraphQL:", error);
      toast.error(`Erreur lors de la création de la tâche: ${error.message}`);
    },
  });

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      await createTask({
        variables: {
          input: {
            ...formData,
            columnId: formData.columnId || columnId,
            boardId: boardId,
          },
        },
      });
    } catch (error) {
      // L'erreur est déjà gérée par onError
      console.error("Erreur lors de la création:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 h-[90vh] flex flex-col">
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange?.(false)}
          isLoading={isLoading}
          initialColumnId={columnId}
          columns={columns}
          submitButtonText="Créer la tâche"
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
