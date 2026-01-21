"use client";

import { useCallback } from "react";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import {
  generateSignatureHTMLFromContainer,
  generatePlainTextFromContainer
} from "../utils/container-html-generator";

// Hook simplifié : génération + copie du HTML de la signature
// Utilise le nouveau système container pour une compatibilité email maximale
export function useSignatureGenerator() {
  const { signatureData, rootContainer } = useSignatureData();

  const generateHTML = useCallback(() => {
    if (!rootContainer) {
      console.warn('[useSignatureGenerator] No rootContainer available');
      return '';
    }

    return generateSignatureHTMLFromContainer(rootContainer, signatureData);
  }, [rootContainer, signatureData]);

  const generatePlainText = useCallback(() => {
    return generatePlainTextFromContainer(rootContainer, signatureData);
  }, [rootContainer, signatureData]);

  // Méthode de copie avec execCommand - meilleure compatibilité avec Gmail/Outlook
  const copyWithExecCommand = useCallback((html) => {
    // Créer un conteneur temporaire visible (nécessaire pour certains navigateurs)
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.overflow = 'hidden';
    container.style.opacity = '0.01';
    container.setAttribute('contenteditable', 'true');
    container.innerHTML = html;
    document.body.appendChild(container);

    // Sélectionner le contenu
    const range = document.createRange();
    range.selectNodeContents(container);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Focus sur le conteneur
    container.focus();

    let success = false;
    try {
      // Copier avec execCommand
      success = document.execCommand('copy');
      console.log('[copyWithExecCommand] execCommand result:', success);
    } catch (error) {
      console.error('[copyWithExecCommand] execCommand error:', error);
    }

    // Cleanup
    selection.removeAllRanges();
    document.body.removeChild(container);

    return success;
  }, []);

  const copyToClipboard = useCallback(async () => {
    const html = generateHTML();

    if (!html) {
      return { success: false, message: "Aucune signature à copier" };
    }

    console.log('[copyToClipboard] HTML length:', html.length);

    // Essayer d'abord avec execCommand (meilleure compatibilité email)
    const execSuccess = copyWithExecCommand(html);

    if (execSuccess) {
      return { success: true, message: "Signature copiée !" };
    }

    console.log('[copyToClipboard] execCommand failed, trying Clipboard API');

    // Fallback vers l'API Clipboard moderne
    try {
      const plainText = generatePlainText();

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
      return { success: true, message: "Signature copiée !" };
    } catch (clipboardError) {
      console.error('[copyToClipboard] Clipboard API error:', clipboardError);

      // Dernier fallback - copier juste le texte
      try {
        const plainText = generatePlainText();
        await navigator.clipboard.writeText(plainText);
        return { success: true, message: "Signature copiée (texte uniquement)" };
      } catch (textError) {
        console.error('[copyToClipboard] Text copy also failed:', textError);
        return { success: false, message: "Erreur lors de la copie" };
      }
    }
  }, [generateHTML, generatePlainText, copyWithExecCommand]);

  return {
    generateHTML,
    generatePlainText,
    copyToClipboard,
  };
}