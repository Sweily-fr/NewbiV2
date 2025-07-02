"use client";

import { useState, useCallback } from "react";
import { LegalForm, LegalFormData } from "./components/legal-form";
import { LegalPreview } from "./components/legal-preview";

export default function MentionsLegales() {
  // Utiliser un état initial vide mais défini
  const [formData, setFormData] = useState<Partial<LegalFormData>>({});

  // Utiliser useCallback pour éviter les recréations inutiles de cette fonction
  const handleFormChange = useCallback((data: Partial<LegalFormData>) => {
    // Utiliser une fonction de mise à jour pour éviter les problèmes de stale state
    setFormData(prevData => {
      // Vérifier si les données sont réellement différentes pour éviter les mises à jour inutiles
      if (JSON.stringify(prevData) === JSON.stringify(data)) {
        return prevData; // Retourner l'état précédent si aucun changement
      }
      return data; // Sinon mettre à jour avec les nouvelles données
    });
  }, []);

  return (
    <div className="flex flex-col p-6 md:py-6">
      <h1 className="text-2xl font-semibold mb-6">Mentions légales</h1>
      
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Formulaire à gauche */}
        <div className="lg:w-1/2 space-y-6">
          <LegalForm onFormChange={handleFormChange} />
        </div>
        
        {/* Preview à droite */}
        <div className="lg:w-1/2 space-y-6">
          <div className="lg:sticky lg:top-6">
            <LegalPreview formData={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}
