"use client";

import React, { useState } from "react";
import { emailTemplates } from "@/src/lib/email-templates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { toast } from "@/src/components/ui/sonner";
import { Mail, Loader2 } from "lucide-react";

export default function TestEmailsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("emailVerification");
  const [htmlContent, setHtmlContent] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Données de test pour chaque template
  const mockData = {
    reactivation: {
      params: ["https://newbi.fr/reactivate?token=abc123"],
      label: "Réactivation de compte",
    },
    twoFactor: {
      params: ["123456"],
      label: "Code 2FA",
    },
    resetPassword: {
      params: ["https://newbi.fr/reset-password?token=xyz789"],
      label: "Réinitialisation mot de passe",
    },
    emailVerification: {
      params: ["https://newbi.fr/verify-email?token=verify123"],
      label: "Vérification email",
    },
    organizationInvitation: {
      params: [
        {
          organization: { name: "Acme Corp" },
          inviter: {
            user: {
              name: "Jean Dupont",
              email: "jean.dupont@acme.com",
            },
          },
        },
        "https://newbi.fr/accept-invite?token=invite123",
      ],
      label: "Invitation organisation",
    },
    memberJoinedNotificationOwner: {
      params: [
        {
          organization: { name: "Acme Corp" },
          member: {
            user: {
              name: "Marie Martin",
              email: "marie.martin@example.com",
            },
            role: "member",
          },
        },
      ],
      label: "Notification propriétaire - Nouveau membre",
    },
    memberJoinedConfirmation: {
      params: [
        {
          organization: { name: "Acme Corp" },
          member: {
            user: {
              name: "Marie Martin",
              email: "marie.martin@example.com",
            },
            role: "member",
          },
        },
      ],
      label: "Confirmation membre - Bienvenue",
    },
    memberJoinedNotificationInviter: {
      params: [
        {
          organization: { name: "Acme Corp" },
          member: {
            user: {
              name: "Marie Martin",
              email: "marie.martin@example.com",
            },
            role: "member",
          },
          inviter: {
            user: {
              name: "Jean Dupont",
              email: "jean.dupont@acme.com",
            },
          },
        },
      ],
      label: "Notification inviteur - Membre accepté",
    },
  };

  // Générer le HTML du template sélectionné
  const generateTemplate = () => {
    const template = emailTemplates[selectedTemplate];
    const data = mockData[selectedTemplate];

    if (template && data) {
      const html = template(...data.params);
      setHtmlContent(html);
    }
  };

  // Générer automatiquement au changement de template
  React.useEffect(() => {
    generateTemplate();
  }, [selectedTemplate]);

  // Envoyer l'email de test
  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error("Adresse email invalide");
      return;
    }

    setIsSending(true);

    try {
      const data = mockData[selectedTemplate];
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: selectedTemplate,
          email: testEmail,
          params: data.params,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Email envoyé avec succès à ${testEmail}`);
      } else {
        toast.error(result.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test des Templates Email
          </h1>
          <p className="text-gray-600">
            Visualisez et testez tous les templates d'emails de l'application
          </p>
        </div>

        {/* Controls */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            {/* Ligne 1: Sélection template */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionnez un template
                </label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(mockData).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 items-end">
                <Button
                  onClick={generateTemplate}
                  className="bg-[#5B4FFF] hover:bg-[#4a3fcc]"
                >
                  Régénérer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([htmlContent], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${selectedTemplate}.html`;
                    a.click();
                  }}
                >
                  Télécharger HTML
                </Button>
              </div>
            </div>

            {/* Ligne 2: Envoi email de test */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Envoyer un email de test
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="email"
                  placeholder="votre.email@exemple.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                  disabled={isSending}
                />
                <Button
                  onClick={sendTestEmail}
                  disabled={isSending || !testEmail}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                L'email sera envoyé avec les données de test du template sélectionné
              </p>
            </div>
          </div>
        </Card>

        {/* Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visual Preview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Aperçu visuel</h2>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={htmlContent}
                className="w-full h-[800px]"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </Card>

          {/* HTML Code */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Code HTML</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(htmlContent);
                  alert("Code copié !");
                }}
              >
                Copier
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden bg-gray-900">
              <pre className="p-4 text-xs text-gray-100 overflow-auto h-[800px]">
                <code>{htmlContent}</code>
              </pre>
            </div>
          </Card>
        </div>

        {/* Template Info */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Informations du template</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="font-medium text-gray-700">Template :</span>
              <span className="text-gray-600">{selectedTemplate}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-gray-700">Label :</span>
              <span className="text-gray-600">
                {mockData[selectedTemplate]?.label}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-gray-700">Paramètres :</span>
              <span className="text-gray-600">
                {mockData[selectedTemplate]?.params.length} paramètre(s)
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
