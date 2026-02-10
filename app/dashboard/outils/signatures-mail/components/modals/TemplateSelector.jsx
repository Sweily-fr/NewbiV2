"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Check, Facebook, Twitter, Linkedin } from "lucide-react";

// Couleur principale
const PRIMARY_COLOR = "#5A50FF";
const SOCIAL_BG_COLOR = "#202020";

// Composant réutilisable pour les icônes sociales
const SocialIcons = ({ size = 3, className = "" }) => (
  <div className={`flex gap-1 ${className}`}>
    <div
      className={`w-${size} h-${size} rounded-sm flex items-center justify-center`}
      style={{
        backgroundColor: SOCIAL_BG_COLOR,
        width: `${size * 4}px`,
        height: `${size * 4}px`,
        borderRadius: "2px",
      }}
    >
      <Facebook
        className="text-white"
        style={{ width: `${size * 2.5}px`, height: `${size * 2.5}px` }}
      />
    </div>
    <div
      className={`w-${size} h-${size} rounded-sm flex items-center justify-center`}
      style={{
        backgroundColor: SOCIAL_BG_COLOR,
        width: `${size * 4}px`,
        height: `${size * 4}px`,
        borderRadius: "2px",
      }}
    >
      <Twitter
        className="text-white"
        style={{ width: `${size * 2.5}px`, height: `${size * 2.5}px` }}
      />
    </div>
    <div
      className={`w-${size} h-${size} rounded-sm flex items-center justify-center`}
      style={{
        backgroundColor: SOCIAL_BG_COLOR,
        width: `${size * 4}px`,
        height: `${size * 4}px`,
        borderRadius: "2px",
      }}
    >
      <Linkedin
        className="text-white"
        style={{ width: `${size * 2.5}px`, height: `${size * 2.5}px` }}
      />
    </div>
  </div>
);

// Composants de prévisualisation des templates

// Template 1: Logo à gauche, séparateur vertical, nom + poste (couleur) + téléphone + site web, icônes sociales à droite
const TemplatePreview1 = () => (
  <div className="flex items-center gap-2 p-3">
    {/* Colonne gauche : Logo + icônes sociales */}
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <img src="/newbiLetter.png" alt="Logo" className="h-6 object-contain" />
      <SocialIcons size={2.5} />
    </div>

    {/* Barre verticale */}
    <div className="w-px h-14 bg-gray-300 dark:bg-gray-600 flex-shrink-0" />

    {/* Colonne droite : Informations alignées à gauche */}
    <div className="flex-1 min-w-0 text-left">
      {/* Groupe haut : Nom, titre, téléphone */}
      <p className="text-[10px] font-semibold text-gray-900 dark:text-white truncate">
        Paige Jenkins
      </p>
      <p className="text-[8px] text-gray-500 truncate">
        Customer Service Representative
      </p>
      <p className="text-[8px] text-gray-500 truncate">8006427676</p>

      {/* Espace + site web isolé */}
      <p className="text-[8px] text-gray-500 truncate mt-2">
        www.letsignit.com
      </p>
    </div>
  </div>
);
// Template 2: Logo à gauche avec séparateur vertical rouge, nom + poste + téléphone, icônes sociales en bas à gauche, site web en bas
const TemplatePreview2 = () => (
  <div className="p-3 text-left">
    {/* Logo en haut */}
    <img
      src="/newbiLetter.png"
      alt="Logo"
      className="h-5 object-contain mb-2"
    />

    {/* Nom + Titre sur la même ligne */}
    <p className="text-[10px] text-gray-900 dark:text-white truncate">
      <span className="font-semibold">Paige Jenkins</span>{" "}
      <span className="text-gray-500">Customer Service Representative</span>
    </p>

    {/* Téléphone + Site web sur la même ligne */}
    <p className="text-[8px] text-gray-500 truncate">
      T. 8006427676{" "}
      <span style={{ color: PRIMARY_COLOR }}>www.letsignit.com</span>
    </p>

    {/* Icônes sociales en bas */}
    <div className="mt-2">
      <SocialIcons size={2.5} />
    </div>
  </div>
);

// Template 3: Logo en haut centré, séparateur horizontal, nom + poste + téléphone + site web, icônes sociales en bas à gauche
const TemplatePreview3 = () => (
  <div className="p-3">
    <div className="flex items-start justify-between gap-3">
      {/* Colonne gauche : Logo + Informations */}
      <div className="flex-1 min-w-0 text-left">
        {/* Logo */}
        <img
          src="/newbiLetter.png"
          alt="Logo"
          className="h-5 object-contain mb-1"
        />

        {/* Nom + début du titre */}
        <p className="text-[10px] text-gray-900 dark:text-white truncate">
          <span className="font-semibold">Paige Jenkins</span>{" "}
          <span style={{ color: PRIMARY_COLOR }}>Customer Service</span>
        </p>

        {/* Suite du titre */}
        <p className="text-[8px]" style={{ color: PRIMARY_COLOR }}>
          Representative
        </p>

        {/* Téléphone */}
        <p className="text-[8px] text-gray-500 truncate">T. 8006427676</p>

        {/* Site web */}
        <p className="text-[8px] text-gray-500 truncate">www.letsignit.com</p>
      </div>

      {/* Colonne droite : Avatar + icônes sociales */}
      <div className="flex flex-col items-center flex-shrink-0">
        <img
          src="/uifaces-popular-avatar.jpg"
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="mt-1">
          <SocialIcons size={2.5} />
        </div>
      </div>
    </div>
  </div>
);

// Presets de données pour chaque template
const TEMPLATE_PRESETS = {
  template1: {
    orientation: "horizontal",
    photoVisible: false,
    imageShape: "round",
    separators: {
      vertical: { enabled: true, width: 1, color: "#e0e0e0", radius: 0 },
      horizontal: { enabled: false, width: 1, color: "#e0e0e0", radius: 0 },
    },
    horizontalLayout: {
      leftColumn: ["logo"],
      rightColumn: ["fullName", "position", "contact"],
      bottomRow: ["social"],
    },
    typography: {
      fullName: { fontSize: 14, color: "#171717", fontWeight: "bold" },
      position: { fontSize: 12, color: PRIMARY_COLOR, fontWeight: "normal" },
      phone: { fontSize: 11, color: "#666666" },
      website: { fontSize: 11, color: "#666666" },
    },
    socialNetworks: {
      facebook: { url: "#" },
      twitter: { url: "#" },
      linkedin: { url: "#" },
    },
    socialGlobalColor: SOCIAL_BG_COLOR,
  },
  template2: {
    orientation: "horizontal",
    photoVisible: false,
    separators: {
      vertical: { enabled: true, width: 2, color: PRIMARY_COLOR, radius: 0 },
      horizontal: { enabled: false, width: 1, color: "#e0e0e0", radius: 0 },
    },
    horizontalLayout: {
      leftColumn: ["logo"],
      rightColumn: ["fullName", "position", "contact"],
      bottomRow: ["social", "website"],
    },
    typography: {
      fullName: { fontSize: 14, color: "#171717", fontWeight: "bold" },
      position: { fontSize: 12, color: "#666666", fontWeight: "normal" },
      phone: { fontSize: 11, color: "#666666" },
      website: { fontSize: 11, color: "#666666" },
    },
    socialNetworks: {
      facebook: { url: "#" },
      twitter: { url: "#" },
      linkedin: { url: "#" },
    },
    socialGlobalColor: SOCIAL_BG_COLOR,
  },
  template3: {
    orientation: "vertical",
    photoVisible: false,
    separators: {
      vertical: { enabled: false, width: 1, color: "#e0e0e0", radius: 0 },
      horizontal: { enabled: true, width: 1, color: "#e0e0e0", radius: 0 },
    },
    elementsOrder: [
      "logo",
      "separator",
      "fullName",
      "position",
      "contact",
      "social",
    ],
    typography: {
      fullName: { fontSize: 14, color: "#171717", fontWeight: "bold" },
      position: { fontSize: 12, color: "#666666", fontWeight: "normal" },
      phone: { fontSize: 11, color: "#666666" },
      website: { fontSize: 11, color: PRIMARY_COLOR },
    },
    socialNetworks: {
      facebook: { url: "#" },
      twitter: { url: "#" },
      linkedin: { url: "#" },
    },
    socialGlobalColor: SOCIAL_BG_COLOR,
    nameAlignment: "left",
  },
};

// Configuration des templates
const TEMPLATES = [
  {
    id: "template1",
    name: "Classique",
    preview: TemplatePreview1,
  },
  {
    id: "template2",
    name: "Corporate",
    preview: TemplatePreview2,
  },
  {
    id: "template3",
    name: "Moderne",
    preview: TemplatePreview3,
  },
];

export function TemplateSelector({ open, onOpenChange }) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState("template1");

  const handleConfirm = () => {
    // Stocker le templateId dans sessionStorage pour que use-signature-data.js l'applique
    sessionStorage.setItem("newSignatureTemplate", selectedTemplate);
    // Fermer le modal
    onOpenChange(false);
    // Rediriger vers la page de création
    router.push("/dashboard/outils/signatures-mail/new");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[96vh] p-0 gap-0 overflow-hidden"
        style={{
          maxWidth: "80rem",
          width: "95vw",
          height: "auto",
          maxHeight: "96vh",
        }}
      >
        <DialogHeader className="px-6 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <DialogTitle className="text-md font-medium">
            Choisir un template de signature
          </DialogTitle>
          <DialogDescription className="sr-only">
            Sélectionnez un modèle pour votre signature email.
          </DialogDescription>
        </DialogHeader>

        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(92vh - 180px)" }}
        >
          <div className="grid grid-cols-3 gap-4">
            {TEMPLATES.map((template) => {
              const PreviewComponent = template.preview;
              const isSelected = selectedTemplate === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`relative flex flex-col rounded-lg border transition-all duration-200 overflow-hidden bg-white dark:bg-gray-900 hover:shadow-md ${
                    isSelected
                      ? "border-[#5A50FF] shadow-sm ring-1 ring-[#5A50FF]/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {/* Aperçu du template */}
                  <div className="h-[120px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
                    <div className="transform scale-90 w-full">
                      <PreviewComponent />
                    </div>
                  </div>

                  {/* Titre du template */}
                  <div className="py-2 px-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-[#5A50FF] text-white hover:bg-[#5A50FF]/90"
          >
            Personaliser ce modèle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateSelector;
