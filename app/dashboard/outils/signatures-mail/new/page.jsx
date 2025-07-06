/**
 * Page de création de nouvelle signature email
 * Affiche l'aperçu de la signature avec édition inline et upload d'images
 */

"use client";

import React from "react";
import { Copy, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";

// Aperçu de l'email avec édition inline
const EmailPreview = ({ signatureData }) => {
  const { updateSignatureData } = useSignatureData();

  const handleCopySignature = () => {
    // Logique de copie de la signature
    toast.success("Signature copiée !");
  };

  // Fonctions de validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "L'email est requis";
    if (!emailRegex.test(email)) return "Format d'email invalide";
    return true;
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Optionnel
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(phone)) return "Format de téléphone invalide";
    return true;
  };

  const validateUrl = (url) => {
    if (!url) return true; // Optionnel
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return "Format d'URL invalide";
    }
  };

  // Gestionnaires de changement
  const handleFieldChange = (field, value) => {
    updateSignatureData({ [field]: value });
  };

  const handleImageChange = (field, imageUrl) => {
    updateSignatureData({ [field]: imageUrl });
  };

  return (
    <div className="rounded-lg border w-full">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm">Nouveau message</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCopySignature}
          className="text-xs"
        >
          <Copy className="w-3 h-3 mr-1" />
          Copier la signature
        </Button>
      </div>

      <div className="p-4 space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs">De :</span>
          <span className="text-xs">
            {signatureData.email || "newbi@contact.fr"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">À :</span>
          <span className="text-xs">sweily@contact.fr</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">Obj :</span>
          <span className="text-xs">Votre demande de renseignements</span>
        </div>

        <div className="border-t pt-4 mt-4">
          {/* Signature générée avec édition inline */}
          <div className="flex items-start gap-4">
            {/* Photo de profil avec upload */}
            <div className="flex-shrink-0">
              <ImageDropZone
                currentImage={signatureData.photo}
                onImageChange={(imageUrl) =>
                  handleImageChange("photo", imageUrl)
                }
                placeholder="Photo de profil"
                size="md"
                type="profile"
                className="mb-2"
              />
            </div>

            <div className="space-y-1 flex-1">
              {/* Nom et prénom */}
              <div
                className="flex items-center gap-2 font-semibold"
                style={{ color: signatureData.primaryColor || "#2563eb" }}
              >
                <InlineEdit
                  value={signatureData.firstName}
                  onChange={(value) => handleFieldChange("firstName", value)}
                  placeholder="Prénom"
                  displayClassName="font-semibold"
                  inputClassName="font-semibold border-0 shadow-none p-1 h-auto"
                />
                <InlineEdit
                  value={signatureData.lastName}
                  onChange={(value) => handleFieldChange("lastName", value)}
                  placeholder="Nom"
                  displayClassName="font-semibold"
                  inputClassName="font-semibold border-0 shadow-none p-1 h-auto"
                />
              </div>

              {/* Poste */}
              <div className="text-gray-600 text-sm">
                <InlineEdit
                  value={signatureData.position}
                  onChange={(value) => handleFieldChange("position", value)}
                  placeholder="Votre poste"
                  displayClassName="text-gray-600 text-sm"
                  inputClassName="text-gray-600 text-sm border-0 shadow-none p-1 h-auto"
                />
              </div>

              {/* Entreprise */}
              <div className="text-gray-600 text-sm">
                <InlineEdit
                  value={signatureData.companyName}
                  onChange={(value) => handleFieldChange("companyName", value)}
                  placeholder="Nom de l'entreprise"
                  displayClassName="text-gray-600 text-sm"
                  inputClassName="text-gray-600 text-sm border-0 shadow-none p-1 h-auto"
                />
              </div>

              {/* Informations de contact */}
              <div className="space-y-1 text-xs text-gray-600 mt-2">
                {signatureData.showPhoneIcon && (
                  <div className="flex items-center gap-1">
                    <span>📞</span>
                    <InlineEdit
                      value={signatureData.phone}
                      onChange={(value) => handleFieldChange("phone", value)}
                      placeholder="Numéro de téléphone"
                      validation={validatePhone}
                      displayClassName="text-xs text-gray-600"
                      inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
                    />
                  </div>
                )}
                {signatureData.showMobileIcon && (
                  <div className="flex items-center gap-1">
                    <span>📱</span>
                    <InlineEdit
                      value={signatureData.mobile}
                      onChange={(value) => handleFieldChange("mobile", value)}
                      placeholder="Numéro de mobile"
                      validation={validatePhone}
                      displayClassName="text-xs text-gray-600"
                      inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
                    />
                  </div>
                )}
                {signatureData.showEmailIcon && (
                  <div className="flex items-center gap-1">
                    <span>✉️</span>
                    <InlineEdit
                      value={signatureData.email}
                      onChange={(value) => handleFieldChange("email", value)}
                      placeholder="adresse@email.com"
                      validation={validateEmail}
                      displayClassName="text-xs text-gray-600"
                      inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
                    />
                  </div>
                )}
                {signatureData.showWebsiteIcon && (
                  <div className="flex items-center gap-1">
                    <span>🌐</span>
                    <InlineEdit
                      value={signatureData.website}
                      onChange={(value) => handleFieldChange("website", value)}
                      placeholder="www.monsite.com"
                      validation={validateUrl}
                      displayClassName="text-xs text-gray-600"
                      inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
                    />
                  </div>
                )}
                {signatureData.showAddressIcon && (
                  <div className="flex items-start gap-1">
                    <span className="mt-0.5">📍</span>
                    <InlineEdit
                      value={signatureData.address}
                      onChange={(value) => handleFieldChange("address", value)}
                      placeholder="Adresse complète"
                      multiline={true}
                      displayClassName="text-xs text-gray-600"
                      inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 min-h-[2rem] resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Logo entreprise */}
              <div className="mt-3 flex items-center gap-3">
                <ImageDropZone
                  currentImage={signatureData.companyLogo}
                  onImageChange={(imageUrl) =>
                    handleImageChange("companyLogo", imageUrl)
                  }
                  placeholder="Logo entreprise"
                  size="sm"
                  type="logo"
                />
                {signatureData.companyLogo && (
                  <div className="text-blue-600 font-semibold text-sm">
                    <InlineEdit
                      value={signatureData.companyName}
                      onChange={(value) =>
                        handleFieldChange("companyName", value)
                      }
                      placeholder="Nom entreprise"
                      displayClassName="text-blue-600 font-semibold text-sm"
                      inputClassName="text-blue-600 font-semibold text-sm border-0 shadow-none p-1 h-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de preview mobile (placeholder)
const MobilePreview = ({ signatureData }) => {
  return (
    <div className="rounded-lg border w-[320px] h-[600px] bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm">Mobile - À venir</span>
        </div>
      </div>
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Preview Mobile</p>
          <p className="text-sm">À venir prochainement...</p>
        </div>
      </div>
    </div>
  );
};

// Composant principal de la page
export default function NewSignaturePage() {
  const { signatureData } = useSignatureData();

  return (
    <div className="p-12 h-[calc(100vh-64px)] flex items-center justify-center">
      {/* Onglets Desktop/Mobile - Verticaux à gauche */}
      <Tabs
        defaultValue="desktop"
        orientation="vertical"
        className="w-full flex-row flex gap-6"
      >
        <TabsList className="flex-col h-fit w-fit p-1">
          <TabsTrigger
            value="desktop"
            className="flex flex-col items-center gap-2 p-3 w-10 h-15"
          >
            <Monitor className="w-6 h-6" />
          </TabsTrigger>
          <TabsTrigger
            value="mobile"
            className="flex flex-col items-center gap-2 p-3 w-10 h-15"
          >
            <Smartphone className="w-6 h-6" />
          </TabsTrigger>
        </TabsList>

        <div className="grow min-w-0 h-[600px]">
          <TabsContent value="desktop" className="mt-0 w-full h-full">
            <div className="flex justify-center items-start h-full">
              <EmailPreview signatureData={signatureData} />
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="mt-0 w-full h-full">
            <div className="flex justify-center items-center h-full">
              <MobilePreview signatureData={signatureData} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
