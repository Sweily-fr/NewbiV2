"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

const UniversalPDFGenerator = ({
  data,
  type = "invoice",
  filename,
  children,
  className = "",
  variant = "outline",
  size = "sm",
  disabled = false,
  ...props
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Formatage des devises
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0,00 €";

    const num = parseFloat(amount);
    if (isNaN(num)) return "0,00 €";

    // Formatage manuel pour éviter les problèmes avec jsPDF
    const formatted = num.toFixed(2).replace(".", ",");

    // Ajouter les espaces pour les milliers
    const parts = formatted.split(",");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    return parts.join(",") + " €";
  };

  // Formatage des dates
  const formatDate = (dateInput) => {
    if (!dateInput) return "";

    let date;
    // Gérer les timestamps (nombres et chaînes numériques) et les chaînes de caractères
    if (typeof dateInput === "number") {
      date = new Date(dateInput);
    } else if (typeof dateInput === "string" && /^\d+$/.test(dateInput)) {
      // Si c'est une chaîne qui contient uniquement des chiffres (timestamp)
      date = new Date(parseInt(dateInput, 10));
    } else {
      date = new Date(dateInput);
    }

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn("Date invalide:", dateInput);
      return "";
    }
    return date.toLocaleDateString("fr-FR");
  };

  // Formatage des adresses
  const formatAddress = (address) => {
    if (!address) return "";
    if (typeof address === "string") {
      // Si c'est une chaîne, essayer de la formater sur deux lignes
      // Exemple: "39 rue des vallées, 92290 Chatenay-malabry, France"
      const parts = address.split(", ");
      if (parts.length >= 2) {
        // Première ligne: rue
        const street = parts[0];
        // Deuxième ligne: code postal + ville + pays
        const cityCountry = parts.slice(1).join(", ");
        return `${street}\n${cityCountry}`;
      }
      return address;
    }
    if (typeof address === "object") {
      const lines = [];
      // Première ligne: rue
      if (address.street) {
        lines.push(address.street);
      }
      // Deuxième ligne: code postal + ville + pays
      const secondLine = [];
      if (address.postalCode && address.city) {
        secondLine.push(`${address.postalCode} ${address.city}`);
      }
      if (address.country) {
        secondLine.push(address.country);
      }
      if (secondLine.length > 0) {
        lines.push(secondLine.join(", "));
      }
      return lines.join("\n");
    }
    return "";
  };

  // Fonction pour ajouter le header
  const addHeader = (pdf, data, yPosition, margin, contentWidth, isInvoice) => {
    let y = yPosition;

    // HEADER - Titre à gauche, logo à droite (comme dans le preview)
    // Titre du document (équivalent à text-3xl font-medium du preview)
    const title = data.isDepositInvoice
      ? "FACTURE D'ACOMPTE"
      : data.status === "DRAFT"
        ? isInvoice
          ? "FACTURE PROFORMA"
          : "DEVIS PROFORMA"
        : isInvoice
          ? "FACTURE"
          : "DEVIS";

    pdf.setFontSize(18); // Équivalent à text-3xl (30px -> 18pt en PDF)
    pdf.setFont("helvetica", "bold"); // font-medium du preview (bold est le plus proche en PDF)
    pdf.setTextColor(10, 10, 10); // dark:text-[#0A0A0A]
    pdf.text(title, margin, y);

    // Logo à droite (si présent)
    // Note: Le logo sera géré séparément car jsPDF nécessite une gestion spéciale des images

    y += 12; // mb-2 du preview (équivalent à 8pt)

    // INFORMATIONS DOCUMENT (équivalent à la grille du preview)
    pdf.setFontSize(7); // Équivalent à fontSize: "10px" du preview
    pdf.setTextColor(10, 10, 10); // dark:text-[#0A0A0A]

    // Numéro de facture
    pdf.setFont("helvetica", "bold"); // font-medium pour les labels
    pdf.text("Numéro de facture", margin, y);
    pdf.setFont("helvetica", "normal"); // font-normal pour les valeurs
    const invoiceNumber =
      data.prefix && data.number
        ? `${data.prefix}-${data.number}`
        : data.number || "F-202507-001";
    pdf.text(invoiceNumber, margin + 38, y); // w-38 du preview
    y += 4; // space-y-1

    // Date d'émission
    pdf.setFont("helvetica", "bold"); // font-medium pour les labels
    pdf.text("Date d'émission", margin, y);
    pdf.setFont("helvetica", "normal"); // font-normal pour les valeurs
    const issueDate =
      formatDate(data.issueDate || data.date) || formatDate(new Date());
    pdf.text(issueDate, margin + 38, y);
    y += 4;

    // Date d'échéance ou Valide jusqu'au
    pdf.setFont("helvetica", "bold"); // font-medium pour les labels
    const dateLabel = isInvoice ? "Date d'échéance" : "Valide jusqu'au";
    pdf.text(dateLabel, margin, y);
    pdf.setFont("helvetica", "normal"); // font-normal pour les valeurs
    const endDate = isInvoice
      ? formatDate(data.dueDate) ||
        formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      : formatDate(data.validUntil) ||
        formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    pdf.text(endDate, margin + 38, y);
    y += 4;

    return y + 20; // mb-14 du preview (espace avant la section suivante)
  };

  // Fonction pour ajouter les informations entreprise et client
  const addCompanyClientInfo = (
    pdf,
    data,
    yPosition,
    margin,
    contentWidth,
    isInvoice
  ) => {
    let y = yPosition;

    // Déterminer le nombre de colonnes
    const hasShippingAddress =
      data.client?.hasDifferentShippingAddress && data.client?.shippingAddress;
    const numColumns = hasShippingAddress ? 3 : 2;
    const colWidth = contentWidth / numColumns;

    // Informations entreprise
    pdf.setFontSize(7); // Équivalent à fontSize: "10px" du preview
    pdf.setTextColor(10, 10, 10); // dark:text-[#0A0A0A]
    let companyY = y;

    // Nom de l'entreprise avec font-medium
    if (data.companyInfo?.name) {
      pdf.setFont("helvetica", "bold"); // font-medium du preview
      pdf.text(data.companyInfo.name, margin, companyY);
      companyY += 6; // mb-2 du preview
    }

    // Détails avec font-normal
    pdf.setFont("helvetica", "normal");

    if (data.companyInfo?.address) {
      const addressLines = pdf.splitTextToSize(
        formatAddress(data.companyInfo.address),
        colWidth - 10
      );
      addressLines.forEach((line) => {
        pdf.text(line, margin, companyY);
        companyY += 4;
      });
    }

    if (data.companyInfo?.email) {
      pdf.text(data.companyInfo.email, margin, companyY);
      companyY += 4;
    }

    if (data.companyInfo?.phone) {
      pdf.text(data.companyInfo.phone, margin, companyY);
      companyY += 4;
    }

    // Informations client
    let clientY = y;
    const clientX = margin + colWidth;

    pdf.setFontSize(7); // Équivalent à fontSize: "10px" du preview
    pdf.setTextColor(10, 10, 10); // dark:text-[#0A0A0A]

    // Nom du client avec font-medium
    const clientName =
      data.clientInfo?.name ||
      data.client?.name ||
      `${data.client?.firstName || ""} ${data.client?.lastName || ""}`.trim() ||
      "Client";
    pdf.setFont("helvetica", "bold"); // font-medium du preview
    pdf.text(clientName, clientX, clientY);
    clientY += 6; // mb-2 du preview

    // Détails avec font-normal
    pdf.setFont("helvetica", "normal");

    const clientAddress = data.clientInfo?.address || data.client?.address;
    if (clientAddress) {
      const addressLines = pdf.splitTextToSize(
        formatAddress(clientAddress),
        colWidth - 10
      );
      addressLines.forEach((line) => {
        pdf.text(line, clientX, clientY);
        clientY += 4;
      });
    }

    const clientEmail = data.clientInfo?.email || data.client?.email;
    if (clientEmail) {
      pdf.text(clientEmail, clientX, clientY);
      clientY += 4;
    }

    // Adresse de livraison si différente
    let shippingY = y;
    if (hasShippingAddress) {
      const shippingX = margin + colWidth * 2;

      pdf.setFontSize(7); // Équivalent à fontSize: "10px" du preview
      pdf.setTextColor(10, 10, 10); // dark:text-[#0A0A0A]

      // Nom de l'adresse de livraison avec font-medium
      if (data.client.shippingAddress.name) {
        pdf.setFont("helvetica", "bold"); // font-medium du preview
        pdf.text(data.client.shippingAddress.name, shippingX, shippingY);
        shippingY += 6; // mb-2 du preview
      }

      // Détails avec font-normal
      pdf.setFont("helvetica", "normal");

      const shippingAddressLines = pdf.splitTextToSize(
        formatAddress(data.client.shippingAddress),
        colWidth - 10
      );
      shippingAddressLines.forEach((line) => {
        pdf.text(line, shippingX, shippingY);
        shippingY += 4;
      });

      if (data.client.shippingAddress.phone) {
        pdf.text(data.client.shippingAddress.phone, shippingX, shippingY);
        shippingY += 4;
      }
    }

    return Math.max(companyY, clientY, shippingY) + 8; // Réduit pour optimiser l'espace
  };

  const generatePDF = async () => {
    if (!data) {
      toast.error("Aucune donnée disponible pour générer le PDF");
      return;
    }

    setIsGenerating(true);

    try {
      // Créer le document PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // Dimensions de la page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      let yPosition = margin;
      const isInvoice = type === "invoice";

      // HEADER
      yPosition = addHeader(
        pdf,
        data,
        yPosition,
        margin,
        contentWidth,
        isInvoice
      );

      // INFORMATIONS ENTREPRISE ET CLIENT
      yPosition = addCompanyClientInfo(
        pdf,
        data,
        yPosition,
        margin,
        contentWidth,
        isInvoice
      );

      // NOTES D'EN-TÊTE
      yPosition = addHeaderNotes(pdf, data, yPosition, margin, contentWidth);

      // TABLEAU DES ARTICLES
      yPosition = addItemsTable(
        pdf,
        data,
        yPosition,
        margin,
        contentWidth,
        pageHeight
      );

      // TOTAUX
      yPosition = addTotals(pdf, data, yPosition, margin, contentWidth);

      // CONDITIONS GÉNÉRALES
      yPosition = addTermsAndConditions(
        pdf,
        data,
        yPosition,
        margin,
        contentWidth,
        pageHeight
      );

      // FOOTER (en tenant compte de la position des conditions générales)
      addFooter(pdf, data, pageHeight, margin, contentWidth, yPosition);

      // Générer le nom de fichier
      const defaultFilename =
        type === "invoice"
          ? `facture_${data.number || "DRAFT"}_${new Date().toISOString().split("T")[0]}.pdf`
          : `devis_${data.number || "DRAFT"}_${new Date().toISOString().split("T")[0]}.pdf`;

      // Ouvrir le PDF dans un nouvel onglet au lieu de le télécharger
      window.open(pdf.output("bloburl"), "_blank");

      toast.success(
        `${type === "invoice" ? "Facture" : "Devis"} ouvert dans un nouvel onglet`
      );
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour ajouter les notes d'en-tête
  const addHeaderNotes = (pdf, data, yPosition, margin, contentWidth) => {
    let y = yPosition;

    if (data.headerNotes) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      const noteLines = pdf.splitTextToSize(data.headerNotes, contentWidth);

      noteLines.forEach((line) => {
        pdf.text(line, margin, y);
        y += 4;
      });

      y += 5; // Espacement après les notes (réduit)
    }

    return y;
  };

  // Fonction pour ajouter le tableau des articles
  const addItemsTable = (
    pdf,
    data,
    yPosition,
    margin,
    contentWidth,
    pageHeight
  ) => {
    let y = yPosition;
    const tableStartY = y;

    // Header du tableau - utiliser les nouvelles valeurs par défaut
    pdf.setFontSize(7); // Taille 10px du preview
    pdf.setFont("helvetica", "normal"); // font-medium du preview

    // Couleurs d'apparence - utiliser les valeurs par défaut ou celles du document
    const headerBgColor = data.appearance?.headerBgColor || "#1d1d1b";
    const headerTextColor = data.appearance?.headerTextColor || "#ffffff";

    // Convertir les couleurs hex en RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 29, g: 29, b: 27 }; // Fallback
    };

    const bgColor = hexToRgb(headerBgColor);
    const textColor = hexToRgb(headerTextColor);

    pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    pdf.setTextColor(textColor.r, textColor.g, textColor.b);

    // Largeurs des colonnes pour correspondre au preview (46%, 12%, 15%, 10%, 17%)
    const colWidths = {
      description: contentWidth * 0.46,
      quantity: contentWidth * 0.12,
      unitPrice: contentWidth * 0.15,
      vat: contentWidth * 0.1,
      total: contentWidth * 0.17,
    };

    let x = margin;
    // Header plus compact (py-1 du preview)
    pdf.rect(x, y - 3, contentWidth, 6, "F");

    // Centrer verticalement le texte dans le rectangle (y + 1 pour centrer dans la hauteur de 6)
    const textY = y + 1;

    pdf.text("Description", x + 2, textY);
    x += colWidths.description;
    pdf.text("Qté", x + colWidths.quantity - 2, textY, { align: "right" });
    x += colWidths.quantity;
    pdf.text("Prix unitaire", x + colWidths.unitPrice - 2, textY, {
      align: "right",
    });
    x += colWidths.unitPrice;
    pdf.text("TVA (%)", x + colWidths.vat - 2, textY, { align: "right" });
    x += colWidths.vat;
    pdf.text("Total HT", x + colWidths.total - 2, textY, { align: "right" });

    y += 8; // Espacement plus compact

    // Lignes du tableau
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7); // text-[10px] du preview

    if (data.items && data.items.length > 0) {
      data.items.forEach((item, index) => {
        if (y > pageHeight - 50) {
          pdf.addPage();
          y = margin;
        }

        let x = margin;

        // Ajouter padding top (py-3 du preview)
        const paddingTop = 2;
        y += paddingTop;

        // Description
        pdf.setFont("helvetica", "normal"); // font-normal du preview
        const descLines = pdf.splitTextToSize(
          item.description || "",
          colWidths.description - 4
        );
        pdf.text(descLines, x + 2, y);

        // Calculer la hauteur nécessaire pour cette ligne
        let lineHeight = Math.max(descLines.length * 4, 12); // Hauteur de base réduite
        let currentDescY = y + descLines.length * 4 + 2;

        // Détails si présents
        if (item.details) {
          pdf.setFontSize(6); // text-xs du preview
          pdf.setTextColor(102, 102, 102); // text-gray-600
          const detailLines = pdf.splitTextToSize(
            item.details,
            colWidths.description - 4
          );
          pdf.text(detailLines, x + 2, currentDescY);
          currentDescY += detailLines.length * 3;
          lineHeight += detailLines.length * 3;
          pdf.setFontSize(7);
          pdf.setTextColor(0, 0, 0);
        }

        x += colWidths.description;

        // Quantité - avec whiteSpace: nowrap (même position Y que la description)
        pdf.text(
          `${item.quantity} ${item.unit || ""}`,
          x + colWidths.quantity - 2,
          y,
          { align: "right" }
        );
        x += colWidths.quantity;

        // Prix unitaire (même position Y)
        pdf.text(
          formatCurrency(item.unitPrice),
          x + colWidths.unitPrice - 2,
          y,
          { align: "right" }
        );
        x += colWidths.unitPrice;

        // TVA (même position Y)
        pdf.text(`${item.vatRate} %`, x + colWidths.vat - 2, y, {
          align: "right",
        });
        x += colWidths.vat;

        // Total (même position Y)
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        pdf.text(formatCurrency(itemTotal), x + colWidths.total - 2, y, {
          align: "right",
        });

        // Ajouter padding bottom (py-3 du preview)
        const paddingBottom = 2;

        // Ligne de séparation avec couleur #CCCCCC
        pdf.setDrawColor(204, 204, 204); // #CCCCCC
        pdf.line(
          margin,
          y + lineHeight + paddingBottom - 1,
          margin + contentWidth,
          y + lineHeight + paddingBottom - 1
        );

        y += lineHeight + paddingBottom + 1; // Espacement équilibré (padding top + contenu + padding bottom)
      });
    } else {
      // Ligne par défaut comme dans le preview
      let x = margin;
      pdf.text("--", x + colWidths.description / 2, y, { align: "center" });
      x += colWidths.description;
      // Colonne quantité vide
      x += colWidths.quantity;
      pdf.text("--", x + colWidths.unitPrice - 2, y, { align: "right" });
      x += colWidths.unitPrice;
      pdf.text("20 %", x + colWidths.vat - 2, y, { align: "right" });
      x += colWidths.vat;
      pdf.text("0,00 €", x + colWidths.total - 2, y, { align: "right" });

      // Ligne de séparation
      pdf.setDrawColor(204, 204, 204);
      pdf.line(margin, y + 12, margin + contentWidth, y + 12);
      y += 16;
    }

    return y + 5;
  };

  // Fonction pour ajouter les totaux
  const addTotals = (pdf, data, yPosition, margin, contentWidth) => {
    let y = yPosition;
    // Largeur correspondant à w-72 du preview (18rem = 72 * 0.25rem = 18rem)
    const totalsWidth = 72;
    const totalsX = margin + contentWidth - totalsWidth;

    pdf.setFontSize(7); // text-[10px] du preview
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);

    // Total HT
    pdf.setFont("helvetica", "normal"); // font-medium du preview
    pdf.text("Total HT", totalsX + 3, y); // py-1 px-3
    pdf.text(formatCurrency(data.subtotal || 0), totalsX + totalsWidth - 3, y, {
      align: "right",
    });
    y += 5; // space-y-1

    // Montant total de TVA
    pdf.text("Montant total de TVA", totalsX + 3, y);
    pdf.text(formatCurrency(data.totalTax || 0), totalsX + totalsWidth - 3, y, {
      align: "right",
    });
    y += 5;

    // Total TTC avec background #F3F3F3
    y += 1; // py-2 spacing réduit
    pdf.setFillColor(243, 243, 243); // bg-[#F3F3F3]
    pdf.rect(totalsX, y - 2, totalsWidth, 6, "F"); // py-2 plus compact (hauteur réduite de 10 à 6)

    pdf.setFont("helvetica", "normal"); // font-medium
    // Centrer parfaitement dans le rectangle (y-2 à y+4, centre réel à y+1)
    const textCenterY = y + 1.8;
    pdf.text("Total TTC", totalsX + 3, textCenterY); // px-3 comme les autres lignes (px-6 -ml-3 = px-3)
    pdf.text(
      formatCurrency(data.total || 0),
      totalsX + totalsWidth - 3,
      textCenterY,
      {
        align: "right",
      }
    ); // px-3 comme les autres lignes (px-6 -ml-3 = px-3)
    y += 6;

    return y + 5;
  };

  // Fonction pour ajouter les conditions générales
  const addTermsAndConditions = (
    pdf,
    data,
    yPosition,
    margin,
    contentWidth,
    pageHeight
  ) => {
    if (!data.termsAndConditions) return yPosition;

    // Vérifier s'il y a assez d'espace pour les conditions générales SEULEMENT
    const termsLines = pdf.splitTextToSize(
      data.termsAndConditions,
      contentWidth
    );

    // Pour une seule ligne, on garde toujours sur la même page
    // Pour plusieurs lignes, on calcule l'espace nécessaire SANS tenir compte du footer
    let minSpaceNeeded;
    if (termsLines.length === 1) {
      minSpaceNeeded = 10; // Espace minimal pour une seule ligne
    } else {
      minSpaceNeeded = termsLines.length * 3.5 + 5; // Calcul pour plusieurs lignes avec nouvel interligne
    }

    // Créer une nouvelle page seulement si les conditions ne tiennent pas (sans footer)
    if (termsLines.length > 1 && yPosition + minSpaceNeeded > pageHeight - 20) {
      pdf.addPage();
      yPosition = 30;
    }

    // Espace minimal avant les conditions
    yPosition += 2;

    pdf.setFontSize(6); // text-[8px] du preview
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100); // text-gray-500 du preview

    termsLines.forEach((line) => {
      pdf.text(line, margin, yPosition);
      yPosition += 3.5; // Interligne augmenté pour meilleure lisibilité
    });

    return yPosition + 2; // Espace minimal après
  };

  // Fonction pour ajouter le footer
  const addFooter = (
    pdf,
    data,
    pageHeight,
    margin,
    contentWidth,
    termsEndY
  ) => {
    // Calculer la hauteur totale du footer d'abord
    let footerHeight = 0;
    const bankDetails = data.bankDetails || data.companyInfo?.bankDetails;

    // Calculer la hauteur des coordonnées bancaires
    if (
      data.showBankDetails &&
      (bankDetails?.iban || bankDetails?.bic || bankDetails?.bankName)
    ) {
      footerHeight += 10; // Titre
      if (bankDetails?.iban) footerHeight += 4;
      if (bankDetails?.bic) footerHeight += 4;
      if (bankDetails?.bankName) footerHeight += 4;
      footerHeight += 5; // Espace avant les notes
    }

    // Calculer la hauteur des notes
    if (data.footerNotes) {
      const noteLines = pdf.splitTextToSize(data.footerNotes, contentWidth);
      footerHeight += noteLines.length * 3;
      footerHeight += 5; // Espace avant la pagination
    }

    // Ajouter la hauteur de la pagination (ligne de séparation + texte)
    footerHeight += 3 + 8 + 8; // Espace + ligne + texte pagination

    // Ajouter un padding
    footerHeight += 15;

    // FOOTER TOUJOURS EN BAS DE PAGE
    // Le footer doit toujours être positionné en bas de page, peu importe le contenu
    let footerStartY = pageHeight - footerHeight - 5; // Position fixe en bas de page

    // Si les conditions générales sont trop près du footer, créer une nouvelle page
    if (termsEndY && termsEndY + 20 > footerStartY) {
      pdf.addPage();
      footerStartY = pageHeight - footerHeight - 5; // Position en bas de la nouvelle page
    }

    let currentY = footerStartY;

    // Dessiner le background du footer
    if (footerHeight > 0) {
      pdf.setFillColor(248, 249, 250); // #f8f9fa
      // Rectangle avec la hauteur exacte du contenu du footer
      pdf.rect(
        0,
        footerStartY - 5,
        pdf.internal.pageSize.width,
        footerHeight + 10,
        "F"
      );
    }

    // Coordonnées bancaires si activées
    if (
      data.showBankDetails &&
      (bankDetails?.iban || bankDetails?.bic || bankDetails?.bankName)
    ) {
      currentY += 8; // Padding en haut des coordonnées bancaires
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0); // Noir pour le titre
      pdf.text("Coordonnées bancaires", margin, currentY);

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      currentY += 7; // Espace après le titre

      if (bankDetails?.iban) {
        pdf.text(`IBAN: ${bankDetails.iban}`, margin, currentY);
        currentY += 4;
      }
      if (bankDetails?.bic) {
        pdf.text(`BIC/SWIFT: ${bankDetails.bic}`, margin, currentY);
        currentY += 4;
      }
      if (bankDetails?.bankName) {
        pdf.text(`Banque: ${bankDetails.bankName}`, margin, currentY);
        currentY += 4;
      }

      currentY += 5; // Espace avant les notes
    }

    // Notes de bas de page
    if (data.footerNotes) {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(102, 102, 102);

      const noteLines = pdf.splitTextToSize(data.footerNotes, contentWidth);

      noteLines.forEach((line) => {
        pdf.text(line, margin, currentY);
        currentY += 3;
      });

      currentY += 5; // Espace avant la pagination
    }

    // Ligne de séparation avant la pagination
    currentY += 3;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, margin + contentWidth, currentY);
    currentY += 8;

    // Pagination intégrée dans le footer
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    pdf.text("Page 1/1", margin + contentWidth, currentY, { align: "right" });
  };

  return (
    <>
      {/* Bouton ou wrapper personnalisé */}
      {children ? (
        <div onClick={generatePDF} className={className} {...props}>
          {children}
        </div>
      ) : (
        <Button
          onClick={generatePDF}
          disabled={disabled || isGenerating}
          variant={variant}
          size={size}
          className={className}
          {...props}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </>
          )}
        </Button>
      )}
    </>
  );
};

export default UniversalPDFGenerator;
