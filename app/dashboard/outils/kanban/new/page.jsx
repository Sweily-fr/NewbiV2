"use client";

<<<<<<< HEAD
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { useCreateBoard } from "@/src/hooks/useKanban";

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
});

export default function NewBoardPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createBoard } = useCreateBoard();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
=======
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { toast } from 'sonner';
import { CREATE_BOARD } from '@/src/graphql/kanbanQueries';

export default function NewKanbanPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: ''
>>>>>>> joaquim/kanbantoolsv2
  });

  const [createBoard, { loading }] = useMutation(CREATE_BOARD, {
    onCompleted: async (data) => {
      try {
        // Créer les colonnes par défaut
        console.log('Creating default columns for board:', data.createBoard.id);
        await createDefaultColumns(data.createBoard.id);
        toast.success('Tableau créé avec succès');
        router.push(`/dashboard/outils/kanban/${data.createBoard.id}`);
      } catch (error) {
        console.error('Error in onCompleted:', error);
        // Même si les colonnes échouent, on redirige vers le tableau
        toast.success('Tableau créé avec succès');
        router.push(`/dashboard/outils/kanban/${data.createBoard.id}`);
      }
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du tableau');
      console.error('Create board error:', error);
    }
  });

  // Les colonnes par défaut sont maintenant créées automatiquement côté backend

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    try {
      await createBoard({
        variables: {
          input: {
            title: formData.title.trim(),
            description: formData.description.trim() || null
          }
        }
      });
<<<<<<< HEAD

      toast.success("Tableau créé avec succès");
      router.push(`/dashboard/outils/kanban/${data.createBoard.id}`);
    } catch (error) {
      console.error("Erreur lors de la création du tableau:", error);
      toast.error("Une erreur est survenue lors de la création du tableau");
    } finally {
      setIsSubmitting(false);
=======
    } catch (error) {
      // L'erreur est déjà gérée dans la mutation onError
>>>>>>> joaquim/kanbantoolsv2
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un nouveau tableau</h1>
          <p className="text-gray-600">Organisez vos projets avec un tableau Kanban</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
<<<<<<< HEAD
          <CardTitle>Nouveau tableau Kanban</CardTitle>
          <CardDescription>
            Créez un nouveau tableau pour organiser vos tâches
=======
          <CardTitle>Informations du tableau</CardTitle>
          <CardDescription>
            Remplissez les informations de base pour votre nouveau tableau Kanban.
>>>>>>> joaquim/kanbantoolsv2
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre du tableau <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Projet Marketing Q1"
                required
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                Donnez un nom descriptif à votre tableau
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Décrivez l'objectif de ce tableau..."
                rows={4}
                className="w-full resize-none"
              />
              <p className="text-sm text-gray-500">
                Ajoutez une description pour expliquer l'objectif de ce tableau
              </p>
            </div>

<<<<<<< HEAD
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/outils/kanban")}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer le tableau"
                  )}
                </Button>
              </div>
            </form>
          </Form>
=======
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le tableau'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Conseils pour bien commencer</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Choisissez un titre clair et descriptif</li>
            <li>• Vous pourrez ajouter des colonnes après la création</li>
            <li>• 4 colonnes seront créées automatiquement : "À faire", "En cours", "En attente", "Terminées"</li>
            <li>• Vous pouvez modifier ces informations à tout moment</li>
          </ul>
>>>>>>> joaquim/kanbantoolsv2
        </CardContent>
      </Card>
    </div>
  );
}
