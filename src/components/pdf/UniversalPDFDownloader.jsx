"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { domToJpeg } from "modern-screenshot";
import jsPDF from "jspdf";
import UniversalPreviewPDF from "./UniversalPreviewPDF";

const UniversalPDFDownloader = ({
  data,
  type = "invoice",
  filename,
  children,
  className = "",
  variant = "outline",
  size = "sm",
  disabled = false,
  previousSituationInvoices = [],
  ...props
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const componentRef = useRef(null);

  // Génération PDF avec modern-screenshot + jsPDF
  const handlePDFDownload = async () => {
    setIsGenerating(true);
    try {
      console.log("Début génération PDF");

      if (!componentRef.current) {
        throw new Error("Référence du composant non trouvée");
      }

      console.log("Capture de l'élément...");

      // Debug: vérifier les données du logo
      console.log("🖼️ Debug logo:", {
        hasCompanyInfoLogo: !!data?.companyInfo?.logo,
        companyInfoLogo: data?.companyInfo?.logo,
        dataKeys: data ? Object.keys(data) : [],
      });

      // Attendre que toutes les images soient chargées
      const images = componentRef.current.querySelectorAll("img");
      console.log(`Nombre d'images trouvées: ${images.length}`);

      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) {
            console.log("Image déjà chargée:", img.src);
            return Promise.resolve();
          }
          return new Promise((resolve, reject) => {
            img.onload = () => {
              console.log("Image chargée:", img.src);
              resolve();
            };
            img.onerror = () => {
              console.warn("Erreur chargement image:", img.src);
              resolve(); // On continue même si une image échoue
            };
            // Timeout de sécurité
            setTimeout(() => {
              console.warn("Timeout chargement image:", img.src);
              resolve();
            }, 3000);
          });
        }),
      );

      // Attendre un peu supplémentaire pour s'assurer que le composant est bien rendu
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Capturer avec modern-screenshot en JPEG (supporte oklch et compatible jsPDF)
      const dataUrl = await domToJpeg(componentRef.current, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        width: 794, // Largeur A4 en pixels
        scale: 2,
        // Activer le mode CORS anonyme pour les images externes.
        // `cache: "reload"` : sans lui, la réponse sans en-tête CORS mise en
        // cache par l'<img> du logo (chargée sans `crossOrigin`) resservirait
        // ce fetch et laisserait le logo vide dans le PDF (cf. generatePDF.js).
        fetch: {
          requestInit: {
            mode: "cors",
            credentials: "omit",
            cache: "reload",
          },
        },
      });

      console.log("Capture réussie, JPEG dataURL obtenu");
      console.log("DataURL length:", dataUrl?.length || 0);

      // Créer une image pour obtenir les vraies dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      console.log("Dimensions image:", img.width, "x", img.height);

      // Créer le PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // Dimensions A4 en mm
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Calculer les dimensions de l'image dans le PDF
      const imgWidthMM = pdfWidth;
      const imgHeightMM = (img.height * pdfWidth) / img.width;

      console.log(
        "Dimensions image dans PDF:",
        imgWidthMM,
        "x",
        imgHeightMM,
        "mm",
      );

      // ===== DÉCOUPAGE INTELLIGENT =====
      if (imgHeightMM > pdfHeight) {
        console.log("⚠️ Document multi-pages avec découpage intelligent");

        // Récupérer les positions des éléments à ne pas couper
        const protectedElements = componentRef.current.querySelectorAll(
          'tr[data-no-break], .no-break, .invoice-line, [data-no-break="true"], [data-pdf-item], [data-pdf-section="header"], [data-pdf-section="info"], [data-pdf-section="header-notes"], [data-pdf-section="totals"], [data-pdf-section="terms"], [data-pdf-section="vat-exemption"], [data-pdf-section="footer-notes"], [data-critical]',
        );

        const rowPositions = [];
        const containerRect = componentRef.current.getBoundingClientRect();

        protectedElements.forEach((row) => {
          const rect = row.getBoundingClientRect();
          rowPositions.push({
            top: (rect.top - containerRect.top) * 2, // *2 pour le scale
            bottom: (rect.bottom - containerRect.top) * 2,
            height: rect.height * 2,
          });
        });

        console.log(`🔍 ${rowPositions.length} éléments protégés détectés`);
        rowPositions.forEach((row, i) => {
          console.log(
            `  Élément ${i + 1}: top=${(row.top / 2).toFixed(0)}px, bottom=${(row.bottom / 2).toFixed(0)}px, height=${(row.height / 2).toFixed(0)}px`,
          );
        });

        // Créer un canvas pour découper l'image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const canvasWidth = img.width;
        const pixelsPerMM = img.width / pdfWidth;
        const pageHeightPixels = pdfHeight * pixelsPerMM;

        console.log("📐 Calculs:", {
          pixelsPerMM: pixelsPerMM.toFixed(2),
          pageHeightPixels: pageHeightPixels.toFixed(0) + "px",
          pageHeightMM: pdfHeight + "mm",
        });

        canvas.width = canvasWidth;
        canvas.height = pageHeightPixels;

        let currentY = 0;
        let pageNumber = 0;
        const pages = []; // Stocker les pages pour ajouter la numérotation après

        // Première passe : générer toutes les pages
        while (currentY < img.height) {
          // ⚠️ CORRECTION : Ne pas retirer de marge de la hauteur disponible
          // On veut utiliser TOUTE la hauteur de la page A4
          let targetY = currentY + pageHeightPixels;

          // S'assurer de ne pas dépasser l'image
          if (targetY > img.height) {
            targetY = img.height;
          }

          console.log(`\n📄 Page ${pageNumber + 1}:`);
          console.log(`  Position actuelle: ${currentY.toFixed(0)}px`);
          console.log(`  Cible initiale: ${targetY.toFixed(0)}px`);
          console.log(
            `  Hauteur page: ${(targetY - currentY).toFixed(0)}px (${((targetY - currentY) / pixelsPerMM).toFixed(1)}mm)`,
          );

          // Trouver les éléments dans cette plage
          const elementsInRange = rowPositions.filter(
            (row) =>
              (row.top >= currentY && row.top < targetY) || // Commence dans la plage
              (row.bottom > currentY && row.bottom <= targetY) || // Finit dans la plage
              (row.top < currentY && row.bottom > targetY), // Chevauche la plage
          );

          console.log(`  ${elementsInRange.length} éléments dans cette plage`);

          // Trouver le dernier élément qui serait coupé
          let needsAdjustment = false;
          for (const row of elementsInRange) {
            // Si l'élément commence avant targetY mais finit après
            if (row.top < targetY && row.bottom > targetY) {
              // Cet élément serait coupé, on ajuste targetY avant lui
              targetY = row.top;
              needsAdjustment = true;
              console.log(
                `  ✂️ Élément coupé détecté ! Ajustement à ${targetY.toFixed(0)}px`,
              );
              console.log(
                `     (Élément: top=${row.top.toFixed(0)}px, bottom=${row.bottom.toFixed(0)}px)`,
              );
              break;
            }
          }

          if (!needsAdjustment) {
            console.log(
              `  ✅ Aucune coupure détectée, on utilise toute la page`,
            );
          }

          const sliceHeight = targetY - currentY;
          console.log(
            `  Hauteur finale: ${sliceHeight.toFixed(0)}px (${(sliceHeight / pixelsPerMM).toFixed(1)}mm)`,
          );

          // Remplir le canvas avec du blanc
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Dessiner la portion de l'image
          ctx.drawImage(
            img,
            0,
            currentY, // Position source
            canvasWidth,
            sliceHeight, // Dimensions source
            0,
            0, // Position destination
            canvasWidth,
            sliceHeight, // Dimensions destination
          );

          // Convertir le canvas en image
          const pageImageData = canvas.toDataURL("image/jpeg", 0.95);

          // Stocker les données de la page avec sa hauteur réelle
          pages.push({
            imageData: pageImageData,
            heightMM: sliceHeight / pixelsPerMM,
          });

          console.log(`  ✅ Page ${pageNumber + 1} générée`);

          currentY = targetY;
          pageNumber++;

          // Sécurité pour éviter boucle infinie
          if (pageNumber > 50) {
            console.error("⚠️ Trop de pages, arrêt");
            break;
          }
        }

        // Deuxième passe : ajouter les pages au PDF avec numérotation
        const totalPages = pages.length;
        console.log(`\n📄 Total de ${totalPages} page(s) à ajouter au PDF`);

        pages.forEach((page, index) => {
          if (index > 0) {
            pdf.addPage();
          }

          // Ajouter l'image de la page avec sa hauteur réelle
          pdf.addImage(
            page.imageData,
            "JPEG",
            0,
            0,
            pdfWidth,
            page.heightMM,
            undefined,
            "FAST",
          );

          // Ajouter la numérotation en bas de page à droite
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150); // Gris
          const pageText = `${index + 1}/${totalPages}`;
          const textWidth = pdf.getTextWidth(pageText);
          pdf.text(pageText, pdfWidth - textWidth - 10, pdfHeight - 5); // À droite, 10mm de marge, 5mm du bas

          console.log(
            `✅ Page ${index + 1}/${totalPages} ajoutée au PDF (hauteur: ${page.heightMM.toFixed(1)}mm)`,
          );
        });
      } else {
        // Document sur une seule page
        console.log("✅ Document sur une seule page");
        pdf.addImage(
          dataUrl,
          "JPEG",
          0,
          0,
          imgWidthMM,
          imgHeightMM,
          undefined,
          "FAST",
        );
      }

      console.log("Image(s) ajoutée(s) au PDF");

      // Déterminer le nom du fichier
      const documentType =
        type === "invoice" ? "facture" : type === "quote" ? "devis" : "avoir";
      const fileName =
        filename || `${documentType}_${data.number || "document"}.pdf`;

      // Télécharger le PDF
      console.log("Téléchargement du PDF:", fileName);
      pdf.save(fileName);

      console.log("PDF téléchargé avec succès");
      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      console.log("Fin génération PDF");
      setIsGenerating(false);
    }
  };

  const handleDownload = (e) => {
    e?.preventDefault();
    handlePDFDownload();
  };

  return (
    <>
      {/* Composant hors écran utilisé pour la génération du PDF */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          width: "794px",
          backgroundColor: "#ffffff",
          zIndex: -1,
        }}
      >
        <div ref={componentRef} style={{ position: "relative", width: "100%" }}>
          <UniversalPreviewPDF
            data={data}
            type={type}
            isMobile={false}
            forPDF={true}
            previousSituationInvoices={previousSituationInvoices}
          />
        </div>
      </div>

      <Button
        onClick={handleDownload}
        disabled={isGenerating || disabled}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 font-normal ${className || ""}`}
        {...props}
      >
        {isGenerating ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {children || "Génération..."}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            {children || "Télécharger le PDF"}
          </>
        )}
      </Button>
    </>
  );
};

export default UniversalPDFDownloader;
