"use client";

import React, { createContext, useContext, useState, useRef } from "react";

const SettingsFormContext = createContext();

export function SettingsFormProvider({ children }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sectionsDataRef = useRef({});
  const sectionsSubmitRef = useRef({});

  // Enregistrer les données d'une section
  const registerSectionData = (sectionId, data) => {
    sectionsDataRef.current[sectionId] = data;
  };

  // Enregistrer la fonction de soumission d'une section
  const registerSectionSubmit = (sectionId, submitFn) => {
    console.log(`🔧 [CONTEXT] Enregistrement section: ${sectionId}`);
    sectionsSubmitRef.current[sectionId] = submitFn;
    console.log(`🔧 [CONTEXT] Sections enregistrées:`, Object.keys(sectionsSubmitRef.current));
  };

  // Marquer qu'une section a des changements
  const setSectionHasChanges = (sectionId, hasChanges) => {
    // Mettre à jour les données de la section
    sectionsDataRef.current[sectionId] = hasChanges;
    
    // Vérifier si au moins une section a des changements
    const anyChanges = Object.values(sectionsDataRef.current).some(Boolean);
    
    setHasUnsavedChanges(anyChanges);
  };

  // Soumettre toutes les sections qui ont des changements
  const submitAllSections = async () => {
    setIsSubmitting(true);
    try {
      console.log("🚀 [CONTEXT] Début de la sauvegarde globale");
      console.log("🚀 [CONTEXT] Sections à sauvegarder:", sectionsDataRef.current);
      
      const promises = Object.entries(sectionsSubmitRef.current).map(
        async ([sectionId, submitFn]) => {
          if (sectionsDataRef.current[sectionId]) {
            console.log(`🚀 [CONTEXT] Sauvegarde de la section: ${sectionId}`);
            return await submitFn();
          }
        }
      );

      await Promise.all(promises.filter(Boolean));
      
      console.log("✅ [CONTEXT] Toutes les sauvegardes terminées");
      
      // Reset l'état des changements - sera fait par chaque section individuellement
      // sectionsDataRef.current = {};
      // setHasUnsavedChanges(false);
      
      return true;
    } catch (error) {
      console.error("❌ [CONTEXT] Erreur lors de la sauvegarde:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = {
    hasUnsavedChanges,
    isSubmitting,
    registerSectionData,
    registerSectionSubmit,
    setSectionHasChanges,
    submitAllSections,
  };

  return (
    <SettingsFormContext.Provider value={value}>
      {children}
    </SettingsFormContext.Provider>
  );
}

export function useSettingsForm() {
  const context = useContext(SettingsFormContext);
  if (!context) {
    throw new Error("useSettingsForm must be used within a SettingsFormProvider");
  }
  return context;
}
