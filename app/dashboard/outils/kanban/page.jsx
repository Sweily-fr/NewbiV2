"use client";

import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  Loader2,
  Search,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from "@/src/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import {
  GET_BOARDS,
  CREATE_BOARD,
  UPDATE_BOARD,
  DELETE_BOARD,
} from "@/src/graphql/kanbanQueries";
import { useKanbanBoards } from "./hooks/useKanbanBoards";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { KanbanBoardIllustration } from "@/src/components/kanban-board-illustration";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function KanbanContent() {
  const {
    // State
    searchTerm,
    setSearchTerm,
    boardToDelete,
    setBoardToDelete,
    boardToEdit,
    setBoardToEdit,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    formData,
    setFormData,

    // Data & Loading States
    boards,
    loading,
    creating,
    updating,
    deleting,

    // Handlers
    handleCreateBoard,
    handleUpdateBoard,
    handleDeleteClick,
    handleEditClick,
    handleConfirmDelete,
    formatDate,
  } = useKanbanBoards();

  return (
    <div className="w-full max-w-[100vw] mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-medium mb-2">Tableaux Kanban</h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos projets avec des tableaux Kanban
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un tableau..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="default" className="font-normal">
                Nouveau tableau
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-6">
              <form onSubmit={handleCreateBoard}>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau tableau</DialogTitle>
                  <DialogDescription>
                    Créez un nouveau tableau Kanban pour organiser vos tâches.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-foreground">
                      Titre *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Nom du tableau"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-foreground">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Description du tableau (optionnel)"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Boards Grid */}
      {boards?.length === 0 ? (
        <div className="text-center py-12">
          {!searchTerm ? (
            <>
              {/* Kanban Board Illustration */}
              {/* <div className="mb-8 flex justify-center">
                <KanbanBoardIllustration className="w-[240px] h-[180px]" />
              </div> */}

              <div className="w-full flex flex-col items-center justify-center pt-20">
                <div className="text-foreground mb-6 text-center">
                  <h3 className="text-xl font-medium mb-2">
                    Commencez votre organisation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Créez votre premier tableau Kanban pour organiser vos tâches
                    et projets
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setIsCreateDialogOpen(true);
                  }}
                  variant="default"
                  className="flex items-center gap-2 font-normal"
                >
                  Créer votre premier tableau
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Illustration SVG moderne pour recherche vide */}
              <div className="mb-8 flex justify-center">
                <EmptySearchIllustration className="w-[220px] h-[160px]" />
              </div>

              <div className="text-foreground mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-sm text-muted-foreground">
                  Essayez avec des mots-clés différents ou créez un nouveau
                  tableau
                </p>
              </div>

              <Button
                onClick={() => {
                  setSearchTerm("");
                  setIsCreateDialogOpen(true);
                }}
                variant="default"
                className="flex items-center gap-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un nouveau tableau
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Link key={board.id} href={`/dashboard/outils/kanban/${board.id}`}>
              <Card className="min-h-42 hover:shadow-lg transition-all duration-200 cursor-pointer group relative">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-medium text-foreground">
                      {board.title}
                    </CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground rounded-full"
                        onClick={(e) => handleEditClick(board, e)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBoardToDelete(board);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
                    {board.description || "Aucune description"}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Créé le {formatDate(board.createdAt)}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Tableau
                    </Badge>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateBoard}>
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-foreground">
                Modifier le tableau
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifiez les informations de votre tableau Kanban.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title" className="text-foreground">
                  Titre *
                </Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Nom du tableau"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description" className="text-foreground">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description du tableau (optionnel)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Modification...
                  </>
                ) : (
                  "Modifier"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!boardToDelete}
        onOpenChange={(open) => !open && setBoardToDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader className="border-b pb-4">
            <AlertDialogTitle className="text-foreground">
              Supprimer le tableau
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer ce tableau ? Cette action est
              irréversible et supprimera également toutes les colonnes et tâches
              associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function KanbanPage() {
  return (
    <ProRouteGuard pageName="Tableaux Kanban">
      <KanbanContent />
    </ProRouteGuard>
  );
}
