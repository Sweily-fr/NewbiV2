"use client";

import React, { createContext, useContext } from "react";
import { useDashboardLayoutSimple as useDashboardLayout } from "@/src/hooks/useDashboardLayoutSimple";

const DashboardLayoutContext = createContext();

/**
 * Contexte optimisé pour les données du layout dashboard
 * Remplace les contextes individuels par un système de cache unifié
 */
export function DashboardLayoutProvider({ children }) {
  const layoutData = useDashboardLayout();

  return (
    <DashboardLayoutContext.Provider value={layoutData}>
      {children}
    </DashboardLayoutContext.Provider>
  );
}

/**
 * Hook pour accéder aux données du layout dashboard
 * Remplace useSubscription, useOnboarding, etc.
 */
export function useDashboardLayoutContext() {
  const context = useContext(DashboardLayoutContext);
  
  if (context === undefined) {
    throw new Error(
      'useDashboardLayoutContext must be used within a DashboardLayoutProvider'
    );
  }
  
  return context;
}

/**
 * Hook de compatibilité pour remplacer useSubscription
 */
export function useSubscription() {
  const { subscription, hasFeature, getLimit, isActive, isLoading, refreshLayoutData } = useDashboardLayoutContext();
  
  return {
    subscription,
    loading: isLoading,
    hasInitialized: true,
    hasFeature,
    getLimit,
    isActive,
    refreshSubscription: refreshLayoutData,
  };
}

/**
 * Hook de compatibilité pour remplacer useOnboarding
 */
export function useOnboarding() {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    skipOnboarding,
    onboardingLoading,
    shouldShowOnboarding,
  } = useDashboardLayoutContext();
  
  return {
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    skipOnboarding,
    isLoading: onboardingLoading,
    shouldShowOnboarding,
  };
}
