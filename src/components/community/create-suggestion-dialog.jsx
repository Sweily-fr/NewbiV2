"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";
import { CREATE_COMMUNITY_SUGGESTION } from "../../graphql/mutations/communitySuggestion";
import {
  GET_COMMUNITY_SUGGESTIONS,
  GET_COMMUNITY_SUGGESTION_STATS,
} from "../../graphql/queries/communitySuggestion";
import { validateSuggestionForm } from "../../utils/suggestionValidation";

export function CreateSuggestionDialog({ open, onOpenChange, type = "idea" }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium",
    stepsToReproduce: "",
    isAnonymous: true,
  });

  const [errors, setErrors] = useState({});

  const [createSuggestion, { loading }] = useMutation(
    CREATE_COMMUNITY_SUGGESTION,
    {
      refetchQueries: [
        {
          query: GET_COMMUNITY_SUGGESTIONS,
          variables: { type, status: "pending", sortBy: "recent" },
        },
        { query: GET_COMMUNITY_SUGGESTION_STATS },
      ],
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation avec regex
    const validation = validateSuggestionForm(formData, type);

    if (!validation.valid) {
      setErrors(validation.errors);
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    // Réinitialiser les erreurs
    setErrors({});

    try {
      await createSuggestion({
        variables: {
          input: {
            type,
            title: formData.title.trim(),
            description: formData.description.trim(),
            severity: type === "bug" ? formData.severity : undefined,
            stepsToReproduce:
              type === "bug" && formData.stepsToReproduce.trim()
                ? formData.stepsToReproduce.trim()
                : undefined,
            isAnonymous: formData.isAnonymous,
          },
        },
      });

      toast.success(
        type === "idea"
          ? "Idée proposée avec succès !"
          : "Problème signalé avec succès !"
      );

      // Réinitialiser le formulaire
      setFormData({
        title: "",
        description: "",
        severity: "medium",
        stepsToReproduce: "",
        isAnonymous: true,
      });
      setErrors({});

      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Une erreur est survenue");
      console.error(error);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {type === "idea" ? "Proposer une idée" : "Signaler un problème"}
          </DialogTitle>
          <DialogDescription>
            {type === "idea"
              ? "Partagez votre idée d'amélioration avec la communauté"
              : "Décrivez le problème rencontré pour nous aider à l'identifier"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className={errors.title ? "text-red-500" : ""}
            >
              Titre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={
                type === "idea"
                  ? "Ex: Ajouter un mode sombre"
                  : "Ex: Erreur lors de la sauvegarde"
              }
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              maxLength={100}
              className={
                errors.title ? "border-red-500 focus-visible:ring-red-500" : ""
              }
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/100 caractères
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className={errors.description ? "text-red-500" : ""}
            >
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder={
                type === "idea"
                  ? "Décrivez votre idée en détail..."
                  : "Décrivez le problème rencontré..."
              }
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              maxLength={1000}
              className={
                errors.description
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/1000 caractères
            </p>
          </div>

          {type === "bug" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="severity">
                  Sévérité <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => handleChange("severity", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="steps"
                  className={errors.stepsToReproduce ? "text-red-500" : ""}
                >
                  Étapes pour reproduire <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="steps"
                  placeholder="1. Aller sur la page...&#10;2. Cliquer sur...&#10;3. Observer..."
                  value={formData.stepsToReproduce}
                  onChange={(e) =>
                    handleChange("stepsToReproduce", e.target.value)
                  }
                  rows={3}
                  maxLength={500}
                  className={
                    errors.stepsToReproduce
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.stepsToReproduce && (
                  <p className="text-xs text-red-500">
                    {errors.stepsToReproduce}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.stepsToReproduce.length}/500 caractères
                </p>
              </div>
            </>
          )}

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="anonymous" className="text-sm font-medium">
                Publier anonymement
              </Label>
              <p className="text-xs text-muted-foreground">
                Votre nom ne sera pas affiché publiquement
              </p>
            </div>
            <Switch
              id="anonymous"
              className="scale-75 data-[state=checked]:!bg-[#5b4eff]"
              checked={formData.isAnonymous}
              onCheckedChange={(checked) =>
                handleChange("isAnonymous", checked)
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-[#5b4eff] hover:bg-[#5b4eff]/90 cursor-pointer"
              disabled={loading}
            >
              {loading
                ? "Publication..."
                : type === "idea"
                  ? "Proposer"
                  : "Signaler"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
