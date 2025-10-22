"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { toast } from "@/src/components/ui/sonner";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PrioritySelect } from "@/src/components/PrioritySelect";
import { TagsInput } from "@/src/components/TagsInput";
import { Checklist } from "@/src/components/Checklist";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  columnId: z.string().min(1, "La colonne est requise"),
  priority: z.string().optional(),
  tags: z.array(z.any()).optional(),
  dueDate: z.date().nullable().optional(),
  checklist: z.array(z.any()).optional(),
});

export function TaskForm({
  task = null,
  isLoading = false,
  onSubmit,
  onCancel,
  isEditing = false,
  columns = [],
  submitButtonText = "Créer la tâche",
  cancelButtonText = "Annuler",
}) {
  const [selectedTime, setSelectedTime] = useState(
    task?.dueDate
      ? `${String(new Date(task.dueDate).getHours()).padStart(2, "0")}:${String(new Date(task.dueDate).getMinutes()).padStart(2, "0")}`
      : "12:00"
  );
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: task?.id || "",
      title: task?.title || "",
      description: task?.description || "",
      columnId: task?.columnId || task?.status || "",
      priority: task?.priority || "medium",
      tags: task?.tags || [],
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      checklist: task?.checklist || [],
    },
  });

  const handleFormSubmit = (data) => {
    // Formater la date d'échéance avec l'heure sélectionnée
    let dueDateTime = null;
    if (data.dueDate) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const date = new Date(data.dueDate);
      date.setHours(hours, minutes, 0, 0);

      // Ajuster pour le fuseau horaire
      const timezoneOffset = date.getTimezoneOffset() * 60000;
      dueDateTime = new Date(date.getTime() - timezoneOffset).toISOString();
    }

    onSubmit({
      ...data,
      dueDate: dueDateTime,
      status: data.columnId,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col h-full overflow-hidden"
      >
        <DialogHeader className="px-6 pt-6 pb-6">
          <DialogTitle>
            {isEditing ? "Modifier la tâche" : "Ajouter une tâche"}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 overflow-y-auto flex-1">
          <div className="space-y-4 pb-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Titre <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tâche à faire..."
                      {...field}
                      autoFocus
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Détails de la tâche..."
                      className="min-h-[120px]"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <FormControl>
                      <PrioritySelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="columnId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colonne</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner une colonne">
                            {field.value ? (
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const column = columns.find(
                                    (c) => c.id === field.value
                                  );
                                  if (!column)
                                    return <span>Colonne inconnue</span>;

                                  const color = column.color || "bg-gray-500";
                                  const isTailwindColor =
                                    color.startsWith("bg-");

                                  return (
                                    <>
                                      <span
                                        className={`w-3 h-3 rounded-full flex-shrink-0 ${isTailwindColor ? color : ""}`}
                                        style={
                                          !isTailwindColor
                                            ? { backgroundColor: color }
                                            : {}
                                        }
                                      />
                                      <span className="truncate">
                                        {column.title ||
                                          column.name ||
                                          column.id}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Sélectionner une colonne
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((column) => {
                            const color = column.color || "bg-gray-500";
                            const isTailwindColor = color.startsWith("bg-");

                            return (
                              <SelectItem key={column.id} value={column.id}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-3 h-3 rounded-full flex-shrink-0 ${isTailwindColor ? color : ""}`}
                                    style={
                                      !isTailwindColor
                                        ? { backgroundColor: color }
                                        : {}
                                    }
                                  />
                                  <span className="truncate">
                                    {column.title || column.name || column.id}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date d'échéance</FormLabel>
                  <Popover modal={false} open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${!field.value && 'text-muted-foreground'}`}
                        disabled={isLoading}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCalendarOpen(!calendarOpen);
                        }}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        {field.value ? (
                          <span className="whitespace-nowrap">
                            {format(field.value, "PPP", { locale: fr })}
                            <span className="ml-2 text-muted-foreground">
                              à {selectedTime}
                            </span>
                          </span>
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="flex flex-col">
                        <div className="border-b p-4">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date) => {
                              field.onChange(date);
                            }}
                            initialFocus
                            locale={fr}
                            disabled={isLoading}
                            className="border-0"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <Label>Heure</Label>
                          <Input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="mt-1"
                          />
                          <Button
                            type="button"
                            className="w-full"
                            onClick={() => setCalendarOpen(false)}
                          >
                            Valider
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagsInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Ajouter des tags..."
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
            </div>
            <FormField
              control={form.control}
              name="checklist"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="pb-4">
                      <Checklist
                        items={field.value || []}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <DialogFooter className="p-4 border-t bg-background/95 backdrop-blur">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelButtonText}
          </Button>
          <Button type="submit" disabled={!form.formState.isValid || isLoading}>
            {isLoading ? "Enregistrement..." : submitButtonText}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
