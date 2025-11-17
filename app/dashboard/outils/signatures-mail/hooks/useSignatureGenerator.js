"use client";

import { useCallback } from "react";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { generateSignatureHTML } from "../utils/standalone-signature-generator";

// Hook simplifié : génération + copie du HTML de la signature
export function useSignatureGenerator() {
  const { signatureData } = useSignatureData();

  const generateHTML = useCallback(() => {
    const primaryColor = signatureData.primaryColor || "#171717";
    const facebookImageUrl = signatureData.facebookImageUrl || null;
    const photoSrc = signatureData.photo || null;
    const logoSrc = signatureData.logo || null;

    return generateSignatureHTML(
      signatureData,
      primaryColor,
      facebookImageUrl,
      photoSrc,
      logoSrc
    );
  }, [signatureData]);

  const copyToClipboard = useCallback(async () => {
    const html = generateHTML();

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html.replace(/<[^>]*>/g, "")], {
            type: "text/plain",
          }),
        }),
      ]);

      return { success: true, message: "Signature copiée avec formatage HTML" };
    } catch (error) {
      try {
        await navigator.clipboard.writeText(html);
        return { success: true, message: "Signature copiée (texte brut)" };
      } catch {
        return { success: false, message: "Erreur lors de la copie" };
      }
    }
  }, [generateHTML]);

  return {
    generateHTML,
    copyToClipboard,
  };
}