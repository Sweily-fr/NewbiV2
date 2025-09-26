"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from '@/src/lib/auth-client';

/**
 * Hook pour gérer la génération et l'upload d'icônes sociales personnalisées
 */
export const useCustomSocialIcons = (signatureData, updateSignatureData) => {
  const { data: session } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const lastGenerationRef = useRef(null);
  const lastUpdateRef = useRef(null);

  /**
   * Génère les icônes personnalisées pour tous les réseaux sociaux actifs
   */
  const generateCustomSocialIcons = useCallback(async () => {
    if (!session?.user?.id) {
      console.warn('⚠️ Session utilisateur manquant');
      return;
    }

    // Utiliser l'ID de signature existant ou générer un temporaire
    let currentSignatureId = signatureData.signatureId;
    
    // Si pas d'ID ou ID temporaire, essayer de récupérer l'ID permanent depuis le contexte
    if (!currentSignatureId || currentSignatureId.startsWith('temp-')) {
      // Vérifier si une signature a été sauvegardée récemment
      const savedSignatureId = sessionStorage.getItem('lastSavedSignatureId');
      if (savedSignatureId && !savedSignatureId.startsWith('temp-')) {
        currentSignatureId = savedSignatureId;
        console.log('🔍 Utilisation ID permanent récupéré:', currentSignatureId);
      } else {
        currentSignatureId = currentSignatureId || `temp-${Date.now()}`;
        console.log('🔍 Utilisation ID temporaire:', currentSignatureId);
      }
    }
    
    console.log('🔍 SignatureId final utilisé:', currentSignatureId);

    // Vérifier qu'il y a au moins un réseau social avec une URL
    const hasActiveSocialNetworks = Object.values(signatureData.socialNetworks || {})
      .some(url => url && url.trim() !== '');
    
    if (!hasActiveSocialNetworks) {
      console.log('📝 Aucun réseau social actif, pas de génération d\'icônes');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      console.log('🎨 Génération des icônes personnalisées...');
      
      const response = await fetch('/api/custom-social-icons/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          signatureId: currentSignatureId,
          socialNetworks: signatureData.socialNetworks || {},
          socialColors: signatureData.socialColors || {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la génération des icônes');
      }

      const result = await response.json();
      
      // Mettre à jour les URLs des icônes personnalisées dans signatureData
      updateSignatureData('customSocialIcons', result.customIcons);
      
      console.log('✅ Icônes personnalisées générées:', result.customIcons);
      
    } catch (error) {
      console.error('❌ Erreur génération icônes personnalisées:', error);
      setGenerationError(error.message);
    } finally {
      setIsGenerating(false);
    }
  }, [session?.user?.id, signatureData.socialColors, signatureData.socialNetworks, signatureData.signatureId, updateSignatureData]);

  /**
   * Supprime toutes les icônes personnalisées
   */
  const deleteCustomSocialIcons = useCallback(async () => {
    if (!session?.user?.id || !signatureData.signatureId) {
      console.warn('⚠️ Session utilisateur ou signatureId manquant pour la suppression');
      return;
    }

    try {
      console.log('🗑️ Suppression des icônes personnalisées...');
      
      const response = await fetch('/api/custom-social-icons/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          signatureId: signatureData.signatureId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression des icônes');
      }

      // Vider les URLs des icônes personnalisées
      updateSignatureData('customSocialIcons', {
        facebook: '',
        instagram: '',
        linkedin: '',
        x: '',
      });
      
      console.log('✅ Icônes personnalisées supprimées');
      
    } catch (error) {
      console.error('❌ Erreur suppression icônes personnalisées:', error);
      setGenerationError(error.message);
    }
  }, [session?.user?.id, signatureData.signatureId, updateSignatureData]);

  /**
   * Génération automatique quand les couleurs changent
   */
  useEffect(() => {
    if (!signatureData.socialColors || isGenerating) return;

    // Éviter les appels multiples avec la même donnée
    const colorsKey = JSON.stringify(signatureData.socialColors);
    if (lastUpdateRef.current === colorsKey) return;
    
    const timer = setTimeout(() => {
      lastUpdateRef.current = colorsKey;
      generateCustomSocialIcons();
    }, 2000); // Délai de 2 secondes après le changement de couleur

    return () => clearTimeout(timer);
  }, [signatureData.socialColors]);

  /**
   * Génération automatique quand les réseaux sociaux changent
   */
  useEffect(() => {
    if (!signatureData.socialNetworks || isGenerating) return;

    // Éviter les appels multiples avec la même donnée
    const networksKey = JSON.stringify(signatureData.socialNetworks);
    if (lastGenerationRef.current === networksKey) return;

    const timer = setTimeout(() => {
      lastGenerationRef.current = networksKey;
      generateCustomSocialIcons();
    }, 1000); // Délai de 1 seconde après le changement d'URL

    return () => clearTimeout(timer);
  }, [signatureData.socialNetworks]);

  /**
   * Retourne l'URL de l'icône personnalisée ou l'URL par défaut
   */
  const getSocialIconUrl = useCallback((platform) => {
    // Priorité aux icônes personnalisées
    if (signatureData.customSocialIcons?.[platform]) {
      return signatureData.customSocialIcons[platform];
    }
    
    // URLs par défaut de Cloudflare
    const defaultUrls = {
      facebook: 'https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev/facebook.svg',
      instagram: 'https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev/instagram.svg',
      linkedin: 'https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev/linkedin.svg',
      x: 'https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev/x.svg',
    };
    
    return defaultUrls[platform] || '';
  }, [signatureData.customSocialIcons]);

  /**
   * Vérifie si des icônes personnalisées existent
   */
  const hasCustomSocialIcons = useCallback(() => {
    return signatureData.customSocialIcons && 
           Object.keys(signatureData.customSocialIcons).length > 0;
  }, [signatureData.customSocialIcons]);

  /**
   * Retourne le statut de génération
   */
  const getGenerationStatus = useCallback(() => {
    if (isGenerating) return 'generating';
    if (generationError) return 'error';
    if (hasCustomSocialIcons()) return 'success';
    return 'idle';
  }, [isGenerating, generationError, hasCustomSocialIcons]);

  /**
   * Régénère les icônes avec un ID permanent après sauvegarde
   */
  const regenerateWithPermanentId = useCallback(async (permanentSignatureId) => {
    if (!permanentSignatureId || permanentSignatureId.startsWith('temp-')) {
      console.warn('⚠️ ID permanent invalide pour la régénération');
      return;
    }

    console.log('🔄 Régénération des icônes avec ID permanent:', permanentSignatureId);
    
    // Stocker l'ID permanent
    sessionStorage.setItem('lastSavedSignatureId', permanentSignatureId);
    
    // Régénérer les icônes avec le nouvel ID
    await generateCustomSocialIcons();
  }, [generateCustomSocialIcons]);

  return {
    // États
    isGenerating,
    generationError,
    
    // Fonctions
    generateCustomSocialIcons,
    deleteCustomSocialIcons,
    getSocialIconUrl,
    hasCustomSocialIcons,
    getGenerationStatus,
    regenerateWithPermanentId,
  };
};
