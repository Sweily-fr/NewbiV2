"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
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
import { toast } from "sonner";
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
import { Skeleton } from "@/src/components/ui/skeleton";
import { Badge } from "@/src/components/ui/badge";
import {
  GET_BOARDS,
  CREATE_BOARD,
  UPDATE_BOARD,
  DELETE_BOARD,
} from "@/src/graphql/kanbanQueries";

export default function KanbanPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [boardToEdit, setBoardToEdit] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });

  // GraphQL queries and mutations
  const { data, loading, error, refetch } = useQuery(GET_BOARDS, {
    errorPolicy: "all",
  });

  const [createBoard, { loading: creating }] = useMutation(CREATE_BOARD, {
    onCompleted: () => {
      toast.success("Tableau créé avec succès");
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "" });
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du tableau");
      console.error("Create board error:", error);
    },
  });

  const [updateBoard, { loading: updating }] = useMutation(UPDATE_BOARD, {
    onCompleted: () => {
      toast.success("Tableau modifié avec succès");
      setIsEditDialogOpen(false);
      setBoardToEdit(null);
      setFormData({ title: "", description: "" });
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification du tableau");
      console.error("Update board error:", error);
    },
  });

  const [deleteBoard, { loading: deleting }] = useMutation(DELETE_BOARD, {
    onCompleted: (data) => {
      toast.success("Tableau supprimé avec succès");
      setBoardToDelete(null);
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
      console.error("Delete board error:", error);
      setBoardToDelete(null);
    },
    refetchQueries: [{ query: GET_BOARDS }],
    awaitRefetchQueries: true,
    update: (cache, { data }) => {
      if (data?.deleteBoard && boardToDelete) {
        try {
          // Mettre à jour le cache Apollo pour supprimer le tableau
          const existingBoards = cache.readQuery({ query: GET_BOARDS });
          if (existingBoards) {
            cache.writeQuery({
              query: GET_BOARDS,
              data: {
                boards: existingBoards.boards.filter(
                  (board) => board.id !== boardToDelete.id
                ),
              },
            });
          }
        } catch (error) {
          console.warn("Erreur lors de la mise à jour du cache:", error);
          // refetchQueries s'occupera de la mise à jour
        }
      }
    },
  });

  const boards = data?.boards || [];

  // Filter boards based on search term
  const filteredBoards = boards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (board.description &&
        board.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    await createBoard({
      variables: {
        input: {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
        },
      },
    });
  };

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    await updateBoard({
      variables: {
        input: {
          id: boardToEdit.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
        },
      },
    });
  };

  const handleDeleteClick = (board, e) => {
    e.stopPropagation();
    e.preventDefault();
    setBoardToDelete(board);
  };

  const handleEditClick = (board, e) => {
    e.stopPropagation();
    e.preventDefault();
    setBoardToEdit(board);
    setFormData({
      title: board.title,
      description: board.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!boardToDelete) return;

    try {
      await deleteBoard({
        variables: { id: boardToDelete.id },
      });
    } catch (error) {
      console.error("Error in handleConfirmDelete:", error);
      // L'erreur est déjà gérée par onError de la mutation
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6 dark:bg-gray-900">
        <div className="text-center py-12">
          <div className="text-destructive mb-4 dark:text-gray-200">
            Erreur lors du chargement des tableaux
          </div>
          <Button variant="default" onClick={() => refetch()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Tableaux Kanban</h1>
          <p className="text-muted-foreground text-sm mt-1">
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
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" />
                <span>Nouveau tableau</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
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
                  <Button type="submit" disabled={creating}>
                    {creating ? (
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
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="text-center py-12">
          {!searchTerm ? (
            <>
              {/* Illustration SVG moderne */}
              <div className="mb-8 flex justify-center">
                <svg
                  width="240"
                  height="180"
                  viewBox="0 0 240 180"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Gradients modernes */}
                    <linearGradient
                      id="boardGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#f8fafc" />
                    </linearGradient>
                    <linearGradient
                      id="purpleGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#5b50ff" />
                    </linearGradient>
                    <linearGradient
                      id="darkGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#4b5563" />
                      <stop offset="100%" stopColor="#374151" />
                    </linearGradient>
                    <filter
                      id="shadow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="4"
                        stdDeviation="8"
                        floodColor="#5b50ff"
                        floodOpacity="0.1"
                      />
                    </filter>
                    <filter
                      id="cardShadow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="2"
                        stdDeviation="4"
                        floodColor="#000000"
                        floodOpacity="0.1"
                      />
                    </filter>
                  </defs>

                  {/* Floating elements background */}
                  <circle
                    cx="60"
                    cy="30"
                    r="4"
                    fill="url(#purpleGradient)"
                    opacity="0.2"
                  />
                  <circle
                    cx="180"
                    cy="25"
                    r="3"
                    fill="url(#darkGradient)"
                    opacity="0.15"
                  />
                  <circle
                    cx="200"
                    cy="45"
                    r="2"
                    fill="url(#purpleGradient)"
                    opacity="0.3"
                  />

                  {/* Main board with modern shadow */}
                  <rect
                    x="20"
                    y="40"
                    width="200"
                    height="120"
                    rx="16"
                    fill="url(#boardGradient)"
                    filter="url(#shadow)"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />

                  {/* Column 1 - Modern purple */}
                  <rect
                    x="35"
                    y="55"
                    width="50"
                    height="90"
                    rx="12"
                    fill="url(#purpleGradient)"
                    fillOpacity="0.08"
                    stroke="url(#purpleGradient)"
                    strokeWidth="1"
                  />
                  <rect
                    x="40"
                    y="62"
                    width="40"
                    height="8"
                    rx="4"
                    fill="url(#purpleGradient)"
                  />
                  <rect
                    x="40"
                    y="76"
                    width="40"
                    height="24"
                    rx="6"
                    fill="white"
                    filter="url(#cardShadow)"
                  />
                  <rect
                    x="40"
                    y="106"
                    width="40"
                    height="24"
                    rx="6"
                    fill="white"
                    filter="url(#cardShadow)"
                  />

                  {/* Column 2 - Modern dark */}
                  <rect
                    x="95"
                    y="55"
                    width="50"
                    height="90"
                    rx="12"
                    fill="#000000"
                    fillOpacity="0.04"
                    stroke="url(#darkGradient)"
                    strokeWidth="1"
                  />
                  <rect
                    x="100"
                    y="62"
                    width="40"
                    height="8"
                    rx="4"
                    fill="url(#darkGradient)"
                  />
                  <rect
                    x="100"
                    y="76"
                    width="40"
                    height="24"
                    rx="6"
                    fill="white"
                    filter="url(#cardShadow)"
                  />

                  {/* Column 3 - Modern purple */}
                  <rect
                    x="155"
                    y="55"
                    width="50"
                    height="90"
                    rx="12"
                    fill="url(#purpleGradient)"
                    fillOpacity="0.08"
                    stroke="url(#purpleGradient)"
                    strokeWidth="1"
                  />
                  <rect
                    x="160"
                    y="62"
                    width="40"
                    height="8"
                    rx="4"
                    fill="url(#purpleGradient)"
                  />

                  {/* Central floating plus icon */}
                  <circle
                    cx="120"
                    cy="100"
                    r="20"
                    fill="url(#purpleGradient)"
                    fillOpacity="0.1"
                    filter="url(#shadow)"
                  />
                  <circle
                    cx="120"
                    cy="100"
                    r="18"
                    fill="none"
                    stroke="url(#purpleGradient)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0 120 100;360 120 100"
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <path
                    d="M112 100h16M120 92v16"
                    stroke="url(#purpleGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Floating geometric shapes */}
                  <path
                    d="M45 35 L55 30 L50 40 Z"
                    fill="url(#purpleGradient)"
                    opacity="0.2"
                  />
                  <rect
                    x="185"
                    y="35"
                    width="8"
                    height="8"
                    rx="2"
                    fill="url(#darkGradient)"
                    opacity="0.2"
                    transform="rotate(45 189 39)"
                  />
                </svg>
              </div>

              <div className="text-foreground mb-6">
                <h3 className="text-lg font-semibold mb-2">
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
                className="flex items-center gap-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer votre premier tableau
              </Button>
            </>
          ) : (
            <>
              {/* Illustration SVG moderne pour recherche vide */}
              <div className="mb-8 flex justify-center">
                <svg
                  width="220"
                  height="160"
                  viewBox="0 0 220 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Gradients modernes pour recherche */}
                    <linearGradient
                      id="searchGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#5b50ff" />
                    </linearGradient>
                    <linearGradient
                      id="emptyGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#f8fafc" />
                      <stop offset="100%" stopColor="#e2e8f0" />
                    </linearGradient>
                    <filter
                      id="searchGlow"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter
                      id="floatShadow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="2"
                        stdDeviation="6"
                        floodColor="#5b50ff"
                        floodOpacity="0.15"
                      />
                    </filter>
                  </defs>

                  {/* Floating background elements */}
                  <circle
                    cx="40"
                    cy="30"
                    r="3"
                    fill="url(#searchGradient)"
                    opacity="0.2"
                  >
                    <animate
                      attributeName="cy"
                      values="30;25;30"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx="180"
                    cy="35"
                    r="2"
                    fill="url(#searchGradient)"
                    opacity="0.3"
                  >
                    <animate
                      attributeName="cy"
                      values="35;30;35"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <path
                    d="M200 25 L205 20 L210 25 L205 30 Z"
                    fill="url(#searchGradient)"
                    opacity="0.15"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0 205 25;360 205 25"
                      dur="6s"
                      repeatCount="indefinite"
                    />
                  </path>

                  {/* Modern magnifying glass */}
                  <circle
                    cx="80"
                    cy="65"
                    r="28"
                    fill="none"
                    stroke="url(#searchGradient)"
                    strokeWidth="4"
                    filter="url(#searchGlow)"
                  />
                  <circle
                    cx="80"
                    cy="65"
                    r="22"
                    fill="url(#searchGradient)"
                    fillOpacity="0.05"
                  />
                  <path
                    d="m102 87 18 18"
                    stroke="url(#searchGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#searchGlow)"
                  />

                  {/* Animated search waves */}
                  <g opacity="0.6">
                    <circle
                      cx="80"
                      cy="65"
                      r="35"
                      fill="none"
                      stroke="url(#searchGradient)"
                      strokeWidth="1"
                      opacity="0.4"
                    >
                      <animate
                        attributeName="r"
                        values="35;45;35"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0;0.4"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx="80"
                      cy="65"
                      r="40"
                      fill="none"
                      stroke="url(#searchGradient)"
                      strokeWidth="1"
                      opacity="0.2"
                    >
                      <animate
                        attributeName="r"
                        values="40;50;40"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.2;0;0.2"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>

                  {/* Question mark with glow */}
                  <text
                    x="80"
                    y="72"
                    fill="url(#searchGradient)"
                    fontSize="18"
                    fontWeight="bold"
                    textAnchor="middle"
                    filter="url(#searchGlow)"
                  >
                    ?
                  </text>

                  {/* Modern empty results */}
                  <g opacity="0.25">
                    <rect
                      x="30"
                      y="115"
                      width="45"
                      height="32"
                      rx="8"
                      fill="url(#emptyGradient)"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <rect
                      x="85"
                      y="115"
                      width="45"
                      height="32"
                      rx="8"
                      fill="url(#emptyGradient)"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <rect
                      x="140"
                      y="115"
                      width="45"
                      height="32"
                      rx="8"
                      fill="url(#emptyGradient)"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />

                    {/* Modern cross lines with gradient */}
                    <path
                      d="M25 110 L80 152"
                      stroke="url(#searchGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                    <path
                      d="M80 110 L135 152"
                      stroke="url(#searchGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                    <path
                      d="M135 110 L190 152"
                      stroke="url(#searchGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                  </g>

                  {/* Floating geometric elements */}
                  <rect
                    x="150"
                    y="45"
                    width="6"
                    height="6"
                    rx="1"
                    fill="url(#searchGradient)"
                    opacity="0.3"
                    transform="rotate(45 153 48)"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="45 153 48;405 153 48"
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </rect>
                  <circle
                    cx="160"
                    cy="75"
                    r="2"
                    fill="url(#searchGradient)"
                    opacity="0.4"
                  >
                    <animate
                      attributeName="r"
                      values="2;3;2"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Search beam effect */}
                  <path
                    d="M108 65 Q140 50 170 65"
                    stroke="url(#searchGradient)"
                    strokeWidth="1"
                    fill="none"
                    opacity="0.3"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.3;0.6;0.3"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </path>
                  <path
                    d="M108 70 Q140 85 170 70"
                    stroke="url(#searchGradient)"
                    strokeWidth="1"
                    fill="none"
                    opacity="0.2"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.2;0.5;0.2"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
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
          {filteredBoards.map((board) => (
            <Link key={board.id} href={`/dashboard/outils/kanban/${board.id}`}>
              <Card className="min-h-42 hover:shadow-lg transition-all duration-200 cursor-pointer group relative">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {board.title}
                    </CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground rounded-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBoardToEdit(board);
                          setIsEditDialogOpen(true);
                        }}
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
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 mt-3 text-sm text-muted-foreground">
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
