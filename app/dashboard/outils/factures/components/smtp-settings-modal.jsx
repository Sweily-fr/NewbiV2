"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, LoaderCircle, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { toast } from "@/src/components/ui/sonner";
import {
  useSmtpSettings,
  useUpdateSmtpSettings,
  useTestSmtpConnection,
} from "@/src/graphql/smtpQueries";

export function SmtpSettingsModal({ open, onOpenChange }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const { data: settingsData, loading: loadingSettings } = useSmtpSettings();
  const [updateSettings] = useUpdateSmtpSettings();
  const [testConnection] = useTestSmtpConnection();

  const { register, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: {
      enabled: false,
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "",
      smtpPassword: "",
      fromEmail: "",
      fromName: "",
    },
  });

  const enabled = watch("enabled");
  const smtpSecure = watch("smtpSecure");

  // Charger les paramètres existants
  useEffect(() => {
    if (open && settingsData?.getSmtpSettings) {
      const settings = settingsData.getSmtpSettings;
      reset({
        enabled: settings.enabled,
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || 587,
        smtpSecure: settings.smtpSecure || false,
        smtpUser: settings.smtpUser || "",
        smtpPassword: "", // Ne pas pré-remplir le mot de passe
        fromEmail: settings.fromEmail || "",
        fromName: settings.fromName || "",
      });
    }
  }, [open, settingsData, reset]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      // Ne pas envoyer le mot de passe s'il est vide
      const input = { ...data };
      if (!input.smtpPassword) {
        delete input.smtpPassword;
      }

      await updateSettings({
        variables: { input },
      });

      toast.success("Paramètres SMTP sauvegardés");
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testConnection();
      const testResult = result.data?.testSmtpConnection;

      if (testResult?.success) {
        toast.success(testResult.message);
      } else {
        toast.error(testResult?.message || "Échec du test de connexion", {
          description: testResult?.error,
        });
      }
    } catch (error) {
      console.error("Erreur lors du test:", error);
      toast.error("Erreur lors du test de connexion");
    } finally {
      setIsTesting(false);
    }
  };

  if (!open) return null;

  const lastTestStatus = settingsData?.getSmtpSettings?.lastTestStatus;
  const lastTestError = settingsData?.getSmtpSettings?.lastTestError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Configuration SMTP</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configurez votre serveur SMTP pour envoyer des emails
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

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Activation */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="enabled" className="text-base font-medium">
                  Activer le SMTP personnalisé
                </Label>
                <p className="text-sm text-muted-foreground">
                  Utilisez votre propre serveur SMTP pour envoyer des emails
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={(checked) => setValue("enabled", checked)}
              />
            </div>

            {/* Statut du dernier test */}
            {lastTestStatus && lastTestStatus !== "PENDING" && (
              <div
                className={`p-4 rounded-lg border ${
                  lastTestStatus === "SUCCESS"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {lastTestStatus === "SUCCESS" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      lastTestStatus === "SUCCESS" ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {lastTestStatus === "SUCCESS"
                      ? "Connexion SMTP vérifiée"
                      : "Échec de la connexion SMTP"}
                  </span>
                </div>
                {lastTestError && (
                  <p className="text-xs text-red-700 mt-2">{lastTestError}</p>
                )}
              </div>
            )}

            {/* Configuration SMTP */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">
                    Host SMTP <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.example.com"
                    {...register("smtpHost", { required: enabled })}
                    disabled={!enabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">
                    Port <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    placeholder="587"
                    {...register("smtpPort", { valueAsNumber: true, required: enabled })}
                    disabled={!enabled}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smtpSecure"
                  checked={smtpSecure}
                  onCheckedChange={(checked) => setValue("smtpSecure", checked)}
                  disabled={!enabled}
                />
                <Label htmlFor="smtpSecure" className="text-sm">
                  Connexion sécurisée (SSL/TLS) - Port 465
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUser">
                  Utilisateur SMTP <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="smtpUser"
                  placeholder="user@example.com"
                  {...register("smtpUser", { required: enabled })}
                  disabled={!enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">
                  Mot de passe SMTP {!settingsData?.getSmtpSettings?.id && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  placeholder={settingsData?.getSmtpSettings?.id ? "••••••••" : "Mot de passe"}
                  {...register("smtpPassword")}
                  disabled={!enabled}
                />
                <p className="text-xs text-muted-foreground">
                  {settingsData?.getSmtpSettings?.id
                    ? "Laissez vide pour conserver le mot de passe actuel"
                    : "Requis pour la première configuration"}
                </p>
              </div>

              <div className="border-t pt-4" />

              <div className="space-y-2">
                <Label htmlFor="fromEmail">
                  Email expéditeur <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@example.com"
                  {...register("fromEmail", { required: enabled })}
                  disabled={!enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">Nom de l'expéditeur (optionnel)</Label>
                <Input
                  id="fromName"
                  placeholder="Mon Entreprise"
                  {...register("fromName")}
                  disabled={!enabled}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={!enabled || isTesting || loadingSettings}
            className="gap-2"
          >
            {isTesting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Tester la connexion
          </Button>

          <div className="flex gap-3">
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
    </div>
  );
}
