"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { X, LoaderCircle, Settings, Users, Eye } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import AutoReminderForm from "./auto-reminder-form";
import AutoReminderPreview from "./auto-reminder-preview";
import AutoReminderClients from "./auto-reminder-clients";
import {
  useInvoiceReminderSettings,
  useUpdateInvoiceReminderSettings,
} from "@/src/graphql/invoiceReminderQueries";
import {
  useEmailSettings,
  useUpdateEmailSettings,
} from "@/src/graphql/emailQueries";

export function AutoReminderModal({ open, onOpenChange }) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Récupérer les paramètres existants
  const { data: settingsData, loading: loadingSettings } =
    useInvoiceReminderSettings();
  const [updateSettings] = useUpdateInvoiceReminderSettings();

  // Récupérer les paramètres Email
  const { data: emailData, loading: loadingEmail } = useEmailSettings();
  const [updateEmailSettings] = useUpdateEmailSettings();

  const methods = useForm({
    defaultValues: {
      enabled: false,
      firstReminderDays: 7,
      secondReminderDays: 14,
      reminderHour: 9,
      fromEmail: "",
      fromName: "",
      replyTo: "",
      excludedClientIds: [],
      emailSubject: "Rappel de paiement - Facture {invoiceNumber}",
      emailBody: `Bonjour {clientName},

Nous vous rappelons que la facture {invoiceNumber} d'un montant de {totalAmount} est arrivée à échéance le {dueDate}.

Nous vous remercions de bien vouloir procéder au règlement dans les plus brefs délais.

Cordialement,
{companyName}`,
    },
  });

  const { handleSubmit, watch, reset } = methods;

  // Charger les paramètres existants quand la modal s'ouvre
  useEffect(() => {
    if (
      open &&
      settingsData?.getInvoiceReminderSettings &&
      emailData?.getEmailSettings
    ) {
      const settings = settingsData.getInvoiceReminderSettings;
      const emailSettings = emailData.getEmailSettings;

      reset({
        enabled: settings.enabled,
        firstReminderDays: settings.firstReminderDays,
        secondReminderDays: settings.secondReminderDays,
        reminderHour: settings.reminderHour ?? 9,
        fromEmail: emailSettings.fromEmail || "",
        fromName: emailSettings.fromName || "",
        replyTo: emailSettings.replyTo || "",
        excludedClientIds: settings.excludedClientIds || [],
        emailSubject: settings.emailSubject,
        emailBody: settings.emailBody,
      });
    }
  }, [open, settingsData, emailData, reset]);

  // Reset tab et preview mobile quand la modal s'ouvre
  useEffect(() => {
    if (open) {
      setActiveTab("settings");
      setShowMobilePreview(false);
    }
  }, [open]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      // Séparer les données email des données de relance
      const { fromEmail, fromName, replyTo, ...reminderData } = data;

      console.log("📤 Données de relance à sauvegarder:", reminderData);
      console.log("📤 excludedClientIds:", reminderData.excludedClientIds);

      // Sauvegarder les paramètres email
      await updateEmailSettings({
        variables: {
          input: {
            fromEmail,
            fromName,
            replyTo,
          },
        },
      });

      // Sauvegarder les paramètres de relance
      await updateSettings({
        variables: {
          input: reminderData,
        },
      });

      toast.success("Paramètres de relance automatique sauvegardés");
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(
        error.message || "Erreur lors de la sauvegarde des paramètres"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full h-full md:max-w-7xl md:h-[90vh] bg-white dark:bg-[#1a1a1a] md:rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white">
              Relances automatiques
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden sm:block">
              Configurez les relances automatiques pour vos factures impayées
            </p>
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
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 flex overflow-hidden"
          >
            {/* Left Panel - Tabs (full width on mobile) */}
            <div className="w-full lg:w-1/2 overflow-y-auto lg:border-r border-gray-200 dark:border-gray-700 flex flex-col">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col"
              >
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="settings"
                      className="gap-2 text-xs md:text-sm"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Paramètres</span>
                      <span className="sm:hidden">Config</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="clients"
                      className="gap-2 text-xs md:text-sm"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        Clients concernés
                      </span>
                      <span className="sm:hidden">Clients</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="settings"
                  className="flex-1 overflow-y-auto p-4 md:p-6 mt-0"
                >
                  <AutoReminderForm isSmtpConfigured={true} />
                </TabsContent>

                <TabsContent
                  value="clients"
                  className="flex-1 overflow-y-auto p-4 md:p-6 mt-0"
                >
                  <AutoReminderClients />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Panel - Preview (hidden on mobile, shown via floating button) */}
            <div className="hidden lg:block w-1/2 overflow-y-auto p-6 bg-gray-50 dark:bg-[#252525]">
              <AutoReminderPreview formData={watch()} />
            </div>
          </form>
        </FormProvider>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-sm"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="gap-2 text-sm"
          >
            {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>

        {/* Floating Preview Button (mobile/tablet only) */}
        <Button
          type="button"
          onClick={() => setShowMobilePreview(true)}
          className="lg:hidden fixed bottom-24 right-4 h-12 w-12 rounded-full shadow-lg bg-[#5b50ff] hover:bg-[#4a41e0] z-50"
          size="icon"
        >
          <Eye className="h-5 w-5 text-white" />
        </Button>

        {/* Mobile Preview Overlay */}
        {showMobilePreview && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-white dark:bg-[#1a1a1a] flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Aperçu de l'email
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobilePreview(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#252525]">
              <AutoReminderPreview formData={watch()} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
