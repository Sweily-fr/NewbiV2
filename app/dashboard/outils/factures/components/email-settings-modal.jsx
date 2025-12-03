"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, LoaderCircle, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";
import {
  useEmailSettings,
  useUpdateEmailSettings,
} from "@/src/graphql/emailQueries";

export function EmailSettingsModal({ open, onOpenChange }) {
  const [isSaving, setIsSaving] = useState(false);

  const { data: settingsData, loading: loadingSettings } = useEmailSettings();
  const [updateSettings] = useUpdateEmailSettings();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      fromEmail: "",
      fromName: "",
      replyTo: "",
    },
  });

  // Charger les paramètres existants
  useEffect(() => {
    if (open && settingsData?.getEmailSettings) {
      const settings = settingsData.getEmailSettings;
      reset({
        fromEmail: settings.fromEmail || "",
        fromName: settings.fromName || "",
        replyTo: settings.replyTo || "",
      });
    }
  }, [open, settingsData, reset]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await updateSettings({
        variables: { input: data },
      });

      toast.success("Paramètres email sauvegardés");
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const isConfigured = settingsData?.getEmailSettings?.fromEmail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Configuration Email</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configurez l'email pour vos relances
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Info Box */}
        <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Envoi simplifié</p>
              <p>
                Nous utilisons notre serveur d'envoi pour garantir la délivrabilité. 
                Vos emails seront envoyés avec votre adresse email.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Email expéditeur */}
            <div className="space-y-2">
              <Label htmlFor="fromEmail">
                Email expéditeur <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="facturation@mon-entreprise.fr"
                {...register("fromEmail", { 
                  required: "L'email est requis",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Format d'email invalide"
                  }
                })}
              />
              {errors.fromEmail && (
                <p className="text-sm text-red-600">{errors.fromEmail.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Cet email apparaîtra comme expéditeur des relances
              </p>
            </div>

            {/* Nom de l'expéditeur */}
            <div className="space-y-2">
              <Label htmlFor="fromName">
                Nom de l'expéditeur (optionnel)
              </Label>
              <Input
                id="fromName"
                placeholder="Mon Entreprise"
                {...register("fromName")}
              />
              <p className="text-xs text-muted-foreground">
                Le nom qui apparaîtra à côté de l'email
              </p>
            </div>

            {/* Email de réponse */}
            <div className="space-y-2">
              <Label htmlFor="replyTo">
                Email de réponse (optionnel)
              </Label>
              <Input
                id="replyTo"
                type="email"
                placeholder="contact@mon-entreprise.fr"
                {...register("replyTo", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Format d'email invalide"
                  }
                })}
              />
              {errors.replyTo && (
                <p className="text-sm text-red-600">{errors.replyTo.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Les réponses seront envoyées à cet email
              </p>
            </div>
          </div>

          {/* Exemple */}
          {isConfigured && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-xs font-medium text-gray-700 mb-2">Aperçu :</p>
              <p className="text-sm text-gray-900">
                De : {settingsData.getEmailSettings.fromName || "Votre Entreprise"} &lt;{settingsData.getEmailSettings.fromEmail}&gt;
              </p>
              {settingsData.getEmailSettings.replyTo && (
                <p className="text-sm text-gray-600 mt-1">
                  Répondre à : {settingsData.getEmailSettings.replyTo}
                </p>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important</p>
                <p>
                  Assurez-vous que cet email existe et que vous y avez accès. 
                  Les clients pourront répondre à cet email.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || loadingSettings}
            className="gap-2"
          >
            {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
