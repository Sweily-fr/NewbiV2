'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

const UniversalPDFGenerator = ({ 
  data, 
  type = 'invoice',
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
    if (!amount && amount !== 0) return '0,00 €';
    
    const num = parseFloat(amount);
    if (isNaN(num)) return '0,00 €';
    
    // Formatage manuel pour éviter les problèmes avec jsPDF
    const formatted = num.toFixed(2).replace('.', ',');
    
    // Ajouter les espaces pour les milliers
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    return parts.join(',') + ' €';
  };

  // Formatage des dates
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    
    let date;
    // Gérer les timestamps (nombres et chaînes numériques) et les chaînes de caractères
    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string' && /^\d+$/.test(dateInput)) {
      // Si c'est une chaîne qui contient uniquement des chiffres (timestamp)
      date = new Date(parseInt(dateInput, 10));
    } else {
      date = new Date(dateInput);
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn('Date invalide:', dateInput);
      return '';
    }
    return date.toLocaleDateString('fr-FR');
  };

  // Formatage des adresses
  const formatAddress = (address) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.postalCode && address.city) {
        parts.push(`${address.postalCode} ${address.city}`);
      }
      if (address.country) parts.push(address.country);
      return parts.join(', ');
    }
    return '';
  };

  // Fonction pour ajouter le header
  const addHeader = (pdf, data, yPosition, margin, contentWidth, isInvoice) => {
    let y = yPosition;
    
    // Logo ou nom de l'entreprise
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(data.companyInfo?.name || 'Votre Entreprise', margin, y);
    
    // Titre du document
    const title = data.isDepositInvoice ? 'FACTURE D\'ACOMPTE' :
      data.status === 'DRAFT' ?
        (isInvoice ? 'FACTURE PROFORMA' : 'DEVIS PROFORMA') :
        (isInvoice ? 'FACTURE' : 'DEVIS');
    
    pdf.setFontSize(18);
    pdf.text(title, contentWidth + margin, y, { align: 'right' });
    
    y += 15;
    
    // Informations du document
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const docInfo = [
      `N° ${data.number || 'DRAFT-' + Math.random().toString(36).substr(2, 9)}`,
      `Date d'émission: ${formatDate(data.issueDate || data.date) || formatDate(new Date())}`,
      isInvoice ? 
        `Date d'échéance: ${formatDate(data.dueDate) || formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}` :
        `Valide jusqu'au: ${formatDate(data.validUntil) || formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}`
    ];
    
    if (data.executionDate) {
      const formattedExecutionDate = formatDate(data.executionDate);
      if (formattedExecutionDate) {
        docInfo.push(`Date d'exécution: ${formattedExecutionDate}`);
      }
    }
    
    if (data.purchaseOrderNumber) {
      docInfo.push(`Référence devis: ${data.purchaseOrderNumber}`);
    }
    
    docInfo.forEach(info => {
      pdf.text(info, contentWidth + margin, y, { align: 'right' });
      y += 5;
    });
    
    return y + 10;
  };

  // Fonction pour ajouter les informations entreprise et client
  const addCompanyClientInfo = (pdf, data, yPosition, margin, contentWidth, isInvoice) => {
    let y = yPosition;
    
    // Déterminer le nombre de colonnes
    const hasShippingAddress = data.client?.hasDifferentShippingAddress && data.client?.shippingAddress;
    const numColumns = hasShippingAddress ? 3 : 2;
    const colWidth = contentWidth / numColumns;
    
    // Informations entreprise
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DE:', margin, y);
    
    pdf.setFont('helvetica', 'normal');
    let companyY = y + 6;
    
    if (data.companyInfo?.name) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.companyInfo.name, margin, companyY);
      pdf.setFont('helvetica', 'normal');
      companyY += 5;
    }
    
    // Appliquer la couleur grise pour les informations entreprise
    pdf.setTextColor(102, 102, 102);
    
    if (data.companyInfo?.address) {
      const addressLines = pdf.splitTextToSize(formatAddress(data.companyInfo.address), colWidth - 10);
      addressLines.forEach(line => {
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
    
    // SIRET de l'entreprise
    if (data.companyInfo?.siret) {
      pdf.text(`SIRET: ${data.companyInfo.siret}`, margin, companyY);
      companyY += 4;
    }
    
    // Numéro de TVA de l'entreprise
    if (data.companyInfo?.vatNumber) {
      pdf.text(`TVA: ${data.companyInfo.vatNumber}`, margin, companyY);
      companyY += 4;
    }
    
    // Remettre la couleur noire
    pdf.setTextColor(0, 0, 0);
    
    // Informations client
    let clientY = y;
    const clientX = margin + colWidth;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('À:', clientX, clientY);
    
    pdf.setFont('helvetica', 'normal');
    clientY += 6;
    
    const clientName = data.clientInfo?.name || data.client?.name || 'Client';
    pdf.setFont('helvetica', 'bold');
    pdf.text(clientName, clientX, clientY);
    pdf.setFont('helvetica', 'normal');
    clientY += 5;
    
    // Appliquer la couleur grise pour toutes les informations client
    pdf.setTextColor(102, 102, 102);
    
    const clientAddress = data.clientInfo?.address || data.client?.address;
    if (clientAddress) {
      const addressLines = pdf.splitTextToSize(formatAddress(clientAddress), colWidth - 10);
      addressLines.forEach(line => {
        pdf.text(line, clientX, clientY);
        clientY += 4;
      });
    }
    
    const clientEmail = data.clientInfo?.email || data.client?.email;
    if (clientEmail) {
      pdf.text(clientEmail, clientX, clientY);
      clientY += 4;
    }
    
    // SIRET du client
    const clientSiret = data.clientInfo?.siret || data.client?.siret;
    if (clientSiret) {
      pdf.text(`SIRET: ${clientSiret}`, clientX, clientY);
      clientY += 4;
    }
    
    // Numéro de TVA du client
    const clientVat = data.clientInfo?.vatNumber || data.client?.vatNumber;
    if (clientVat) {
      pdf.text(`TVA: ${clientVat}`, clientX, clientY);
      clientY += 4;
    }
    
    // Adresse de livraison si différente
    let shippingY = y;
    if (hasShippingAddress) {
      const shippingX = margin + (colWidth * 2);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0); // Noir pour le titre
      pdf.text('LIVRER À:', shippingX, shippingY);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(102, 102, 102); // Gris pour les informations
      shippingY += 6;
      
      if (data.client.shippingAddress.name) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(data.client.shippingAddress.name, shippingX, shippingY);
        pdf.setFont('helvetica', 'normal');
        shippingY += 5;
      }
      
      const shippingAddressLines = pdf.splitTextToSize(formatAddress(data.client.shippingAddress), colWidth - 10);
      shippingAddressLines.forEach(line => {
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
      toast.error('Aucune donnée disponible pour générer le PDF');
      return;
    }

    setIsGenerating(true);

    try {
      // Créer le document PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Dimensions de la page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      let yPosition = margin;
      const isInvoice = type === 'invoice';

      // HEADER
      yPosition = addHeader(pdf, data, yPosition, margin, contentWidth, isInvoice);
      
      // INFORMATIONS ENTREPRISE ET CLIENT
      yPosition = addCompanyClientInfo(pdf, data, yPosition, margin, contentWidth, isInvoice);
      
      // NOTES D'EN-TÊTE
      yPosition = addHeaderNotes(pdf, data, yPosition, margin, contentWidth);
      
      // TABLEAU DES ARTICLES
      yPosition = addItemsTable(pdf, data, yPosition, margin, contentWidth, pageHeight);
      
      // TOTAUX
      yPosition = addTotals(pdf, data, yPosition, margin, contentWidth);
      
      // CONDITIONS GÉNÉRALES
      yPosition = addTermsAndConditions(pdf, data, yPosition, margin, contentWidth, pageHeight);
      
      // FOOTER (en tenant compte de la position des conditions générales)
      addFooter(pdf, data, pageHeight, margin, contentWidth, yPosition);

      // Générer le nom de fichier
      const defaultFilename = type === 'invoice' 
        ? `facture_${data.number || 'DRAFT'}_${new Date().toISOString().split('T')[0]}.pdf`
        : `devis_${data.number || 'DRAFT'}_${new Date().toISOString().split('T')[0]}.pdf`;

      const finalFilename = filename || defaultFilename;
      pdf.save(finalFilename);

      toast.success(`${type === 'invoice' ? 'Facture' : 'Devis'} téléchargé avec succès`);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour ajouter les notes d'en-tête
  const addHeaderNotes = (pdf, data, yPosition, margin, contentWidth) => {
    let y = yPosition;
    
    if (data.headerNotes) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      const noteLines = pdf.splitTextToSize(data.headerNotes, contentWidth);
      
      noteLines.forEach(line => {
        pdf.text(line, margin, y);
        y += 4;
      });
      
      y += 5; // Espacement après les notes (réduit)
    }
    
    return y;
  };

  // Fonction pour ajouter le tableau des articles
  const addItemsTable = (pdf, data, yPosition, margin, contentWidth, pageHeight) => {
    let y = yPosition;
    const tableStartY = y;
    
    // Header du tableau
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(51, 51, 51);
    pdf.setTextColor(255, 255, 255);
    
    const colWidths = {
      description: contentWidth * 0.4,
      quantity: contentWidth * 0.15,
      unitPrice: contentWidth * 0.15,
      vat: contentWidth * 0.15,
      total: contentWidth * 0.15
    };
    
    let x = margin;
    pdf.rect(x, y - 5, contentWidth, 8, 'F');
    
    pdf.text('Description', x + 2, y);
    x += colWidths.description;
    pdf.text('Quantité', x + 2, y);
    x += colWidths.quantity;
    pdf.text('Prix unitaire', x + colWidths.unitPrice - 2, y, { align: 'right' });
    x += colWidths.unitPrice;
    pdf.text('TVA', x + colWidths.vat - 2, y, { align: 'right' });
    x += colWidths.vat;
    pdf.text('Total HT', x + colWidths.total - 2, y, { align: 'right' });
    
    y += 10;
    
    // Lignes du tableau
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    
    if (data.items && data.items.length > 0) {
      data.items.forEach((item, index) => {
        if (y > pageHeight - 50) {
          pdf.addPage();
          y = margin;
        }
        
        let x = margin;
        
        // Description
        const descLines = pdf.splitTextToSize(item.description || '', colWidths.description - 4);
        pdf.text(descLines, x + 2, y);
        
        // Calculer la hauteur nécessaire pour cette ligne
        let lineHeight = Math.max(descLines.length * 4, 12); // Minimum 12px
        let currentDescY = y + (descLines.length * 4) + 1; // +1 pour un petit espacement
        
        // Détails si présents (affichés en premier comme dans InvoicePreview)
        if (item.details) {
          pdf.setFontSize(8);
          pdf.setTextColor(102, 102, 102);
          const detailLines = pdf.splitTextToSize(item.details, colWidths.description - 4);
          pdf.text(detailLines, x + 2, currentDescY);
          currentDescY += detailLines.length * 4;
          lineHeight += detailLines.length * 4;
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
        }
        
        // Remise si présente (après les détails, comme dans InvoicePreview)
        const itemDiscount = parseFloat(item.discount) || 0;
        const discountType = item.discountType || 'percentage';
        if (itemDiscount > 0) {
          pdf.setFontSize(8);
          pdf.setTextColor(0, 102, 204); // Bleu comme dans InvoicePreview (#0066cc)
          const discountText = discountType === 'percentage' ? 
            `Remise: ${itemDiscount}%` : 
            `Remise: ${formatCurrency(itemDiscount)}`;
          pdf.text(discountText, x + 2, currentDescY);
          currentDescY += 4;
          lineHeight += 4;
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
        }
        
        x += colWidths.description;
        
        // Quantité
        pdf.text(`${item.quantity} ${item.unit || ''}`, x + 2, y);
        x += colWidths.quantity;
        
        // Prix unitaire
        pdf.text(formatCurrency(item.unitPrice), x + colWidths.unitPrice - 2, y, { align: 'right' });
        x += colWidths.unitPrice;
        
        // TVA
        pdf.text(`${item.vatRate}%`, x + colWidths.vat - 2, y, { align: 'right' });
        x += colWidths.vat;
        
        // Total (avec remise appliquée)
        let itemTotal = item.quantity * item.unitPrice;
        if (itemDiscount > 0) {
          if (discountType === 'percentage') {
            itemTotal = itemTotal * (1 - itemDiscount / 100);
          } else {
            itemTotal = Math.max(0, itemTotal - itemDiscount);
          }
        }
        pdf.text(formatCurrency(itemTotal), x + colWidths.total - 2, y, { align: 'right' });
        
        // Ligne de séparation
        pdf.setDrawColor(229, 229, 229);
        pdf.line(margin, y + lineHeight - 5, margin + contentWidth, y + lineHeight - 5);
        
        y += lineHeight + 3; // Utiliser la hauteur calculée + petit espacement
      });
    } else {
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(102, 102, 102);
      pdf.text('Aucun article', margin + contentWidth / 2, y, { align: 'center' });
      y += 10;
    }
    
    return y + 5; // Réduit pour optimiser l'espace
  };

  // Fonction pour ajouter les totaux
  const addTotals = (pdf, data, yPosition, margin, contentWidth) => {
    let y = yPosition;
    const totalsWidth = 60;
    const totalsX = margin + contentWidth - totalsWidth;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Total HT
    pdf.text('Total HT', totalsX, y);
    pdf.text(formatCurrency(data.subtotal), totalsX + totalsWidth, y, { align: 'right' });
    y += 6;
    
    // Remise si présente
    if (data.discount > 0) {
      pdf.text('Remise', totalsX, y);
      pdf.text(`-${formatCurrency(data.discount)}`, totalsX + totalsWidth, y, { align: 'right' });
      y += 6;
    }
    
    // TVA
    pdf.text('TVA', totalsX, y);
    pdf.text(formatCurrency(data.totalTax), totalsX + totalsWidth, y, { align: 'right' });
    y += 6;
    
    // Ligne de séparation
    pdf.setDrawColor(229, 229, 229);
    pdf.line(totalsX, y, totalsX + totalsWidth, y);
    y += 6; // Réduit pour optimiser l'espace
    
    // Total TTC
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total TTC', totalsX, y);
    pdf.text(formatCurrency(data.total), totalsX + totalsWidth, y, { align: 'right' });
    y += 7; // Réduit pour optimiser l'espace
    
    // Champs personnalisés
    if (data.customFields && data.customFields.length > 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      data.customFields.forEach(field => {
        pdf.text(`${field.key || field.name}:`, totalsX, y);
        pdf.text(field.value, totalsX + totalsWidth, y, { align: 'right' });
        y += 5;
      });
    }
    
    return y + 5; // Réduit pour optimiser l'espace
  };

  // Fonction pour ajouter les conditions générales
  const addTermsAndConditions = (pdf, data, yPosition, margin, contentWidth, pageHeight) => {
    if (!data.termsAndConditions) return yPosition;
    
    // Vérifier s'il y a assez d'espace pour les conditions générales SEULEMENT
    const termsLines = pdf.splitTextToSize(data.termsAndConditions, contentWidth);
    
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
    
    pdf.setFontSize(8); // Taille de police légèrement augmentée
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
    
    termsLines.forEach(line => {
      pdf.text(line, margin, yPosition);
      yPosition += 3.5; // Interligne augmenté pour meilleure lisibilité
    });
    
    return yPosition + 2; // Espace minimal après
  };

  // Fonction pour ajouter le footer
  const addFooter = (pdf, data, pageHeight, margin, contentWidth, termsEndY) => {
    // Calculer la hauteur totale du footer d'abord
    let footerHeight = 0;
    const bankDetails = data.bankDetails || data.companyInfo?.bankDetails;
    
    // Calculer la hauteur des coordonnées bancaires
    if (data.showBankDetails && (bankDetails?.iban || bankDetails?.bic || bankDetails?.bankName)) {
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
      pdf.rect(0, footerStartY - 5, pdf.internal.pageSize.width, footerHeight + 10, 'F');
    }
    
    // Coordonnées bancaires si activées
    if (data.showBankDetails && (bankDetails?.iban || bankDetails?.bic || bankDetails?.bankName)) {
      currentY += 8; // Padding en haut des coordonnées bancaires
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0); // Noir pour le titre
      pdf.text('Coordonnées bancaires', margin, currentY);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
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
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(102, 102, 102);
      
      const noteLines = pdf.splitTextToSize(data.footerNotes, contentWidth);
      
      noteLines.forEach(line => {
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
    pdf.text('Page 1/1', margin + contentWidth, currentY, { align: 'right' });
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
