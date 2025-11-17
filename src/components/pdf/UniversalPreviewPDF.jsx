"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "@/src/lib/auth-client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { generateDynamicFooter } from "@/src/utils/document-suggestions";

// Fonction utilitaire pour calculer le total d'un article en prenant en compte la remise et l'avancement
const calculateItemTotal = (quantity, unitPrice, discount, discountType, progressPercentage = 100) => {
  let subtotal = (quantity || 1) * (unitPrice || 0);

  // Appliquer le pourcentage d'avancement
  const progress = Math.min(Math.max(progressPercentage || 100, 0), 100);
  subtotal = subtotal * (progress / 100);

  // Appliquer la remise si elle existe
  if (discount && discount > 0) {
    if (discountType === "PERCENTAGE") {
      subtotal = subtotal * (1 - Math.min(discount, 100) / 100);
    } else {
      subtotal = Math.max(0, subtotal - discount);
    }
  }

  return subtotal;
};

// Fonction utilitaire pour appliquer une opacité à une couleur HSL
const applyOpacityToColor = (color, opacity) => {
  if (!color) return `rgba(0, 0, 0, ${opacity})`;
  
  // Si c'est une couleur HSL
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
    if (match) {
      const [, h, s, l] = match;
      return `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
    }
  }
  
  // Si c'est une couleur hex
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Si c'est déjà une couleur rgba/rgb
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      const [, r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  return color;
};

const UniversalPreviewPDF = ({ data, type = "invoice", isMobile = false, forPDF = false }) => {
  const { data: session } = useSession();
  const { organization } = useWorkspace();
  const documentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [containerHeight, setContainerHeight] = useState('auto');

  // Déterminer si c'est un avoir (credit note)
  const isCreditNote = type === "creditNote";
  
  // Debug: Log des données reçues pour les devis
  useEffect(() => {
    if (type === "quote") {
      console.log("📄 UniversalPreviewPDF - Données reçues:", {
        prefix: data.prefix,
        number: data.number,
        prefixType: typeof data.prefix,
        numberType: typeof data.number,
        prefixLength: data.prefix?.length,
        numberLength: data.number?.length,
      });
    }
  }, [data.prefix, data.number, type]);

  // Fonction pour calculer le scale dynamiquement
  useEffect(() => {
    if (!isMobile || !documentRef.current) return;

    const calculateScale = () => {
      const screenWidth = window.innerWidth;
      const docWidth = 210 * 3.7795; // 210mm (format A4) en pixels (environ 794px)
      const padding = 32; // Padding total (16px de chaque côté)
      const calculatedScale = Math.min(1, (screenWidth - padding) / docWidth);
      
      setScale(calculatedScale);
      
      // Calculer la hauteur du conteneur après le scale
      if (documentRef.current) {
        const docHeight = documentRef.current.scrollHeight;
        setContainerHeight(`${docHeight * calculatedScale}px`);
      }
    };

    // Calculer au montage et au redimensionnement
    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    // Recalculer après un court délai pour s'assurer que le contenu est chargé
    const timer = setTimeout(calculateScale, 100);

    return () => {
      window.removeEventListener('resize', calculateScale);
      clearTimeout(timer);
    };
  }, [isMobile, data]);

  // Calcul des totaux basé sur les articles
  const calculateTotals = (items = []) => {
    let subtotal = 0;
    let subtotalAfterItemDiscounts = 0;
    let totalTax = 0;
    const taxesByRate = {}; // Pour stocker les totaux de TVA par taux

    // Calcul du sous-total HT de tous les articles avant remises
    items.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const progressPercentage = parseFloat(item.progressPercentage) || 100;

      // Calcul du montant HT de l'article (quantité * prix unitaire)
      subtotal += quantity * unitPrice;

      // Calcul du montant après remise sur l'article
      const itemDiscount = parseFloat(item.discount) || 0;
      const itemDiscountType = item.discountType || "percentage";

      let itemTotal = quantity * unitPrice;
      
      // Application du pourcentage d'avancement
      itemTotal = itemTotal * (progressPercentage / 100);

      // Application de la remise sur l'article
      if (itemDiscount > 0) {
        if (
          itemDiscountType === "PERCENTAGE" ||
          itemDiscountType === "percentage"
        ) {
          itemTotal = itemTotal * (1 - Math.min(itemDiscount, 100) / 100);
        } else {
          itemTotal = Math.max(0, itemTotal - itemDiscount);
        }
      }

      subtotalAfterItemDiscounts += itemTotal;
    });

    // Application de la remise globale sur le montant HT après remises sur les articles
    let globalDiscountAmount = 0;
    let totalAfterDiscount = subtotalAfterItemDiscounts;

    if (data.discount && data.discount > 0) {
      if (data.discountType?.toUpperCase() === "PERCENTAGE") {
        // La remise en pourcentage s'applique sur le montant après remises sur les articles
        globalDiscountAmount =
          (subtotalAfterItemDiscounts * data.discount) / 100;
      } else {
        // Remise fixe, limitée au montant HT après remises sur les articles
        globalDiscountAmount = Math.min(
          data.discount,
          subtotalAfterItemDiscounts
        );
      }
      totalAfterDiscount = subtotalAfterItemDiscounts - globalDiscountAmount;
    }

    // Calcul de la TVA sur le montant après toutes les remises (articles + globale)
    // Auto-liquidation : TVA = 0 si isReverseCharge = true
    items.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const progressPercentage = parseFloat(item.progressPercentage) || 100;
      const vatRate =
        item.vatRate !== undefined ? parseFloat(item.vatRate) : 20;

      // 1. Calcul du montant HT de l'article avant remises
      let itemSubtotal = quantity * unitPrice;
      
      // 1.5. Application du pourcentage d'avancement
      itemSubtotal = itemSubtotal * (progressPercentage / 100);

      // 2. Application de la remise sur l'article si elle existe
      const itemDiscount = parseFloat(item.discount) || 0;
      const itemDiscountType = item.discountType;

      if (itemDiscount > 0) {
        if (itemDiscountType?.toUpperCase() === "PERCENTAGE") {
          // Application de la remise en pourcentage sur l'article
          itemSubtotal = itemSubtotal * (1 - Math.min(itemDiscount, 100) / 100);
        } else {
          // Application de la remise fixe sur l'article
          itemSubtotal = Math.max(0, itemSubtotal - itemDiscount);
        }
      }

      // 3. Application de la remise globale au prorata pour chaque article
      if (globalDiscountAmount > 0) {
        // Calcul de la part de la remise globale qui s'applique à cet article
        const itemRatio = itemSubtotal / (subtotalAfterItemDiscounts || 1); // Éviter la division par zéro
        itemSubtotal = Math.max(
          0,
          itemSubtotal - globalDiscountAmount * itemRatio
        );
      }

      // 4. Calcul de la TVA sur le montant après toutes les remises
      // Auto-liquidation : TVA = 0 si isReverseCharge = true
      const itemTax = (data.isReverseCharge || vatRate === 0) ? 0 : itemSubtotal * (vatRate / 100);

      totalTax += itemTax;

      // On n'ajoute la TVA au détail que si le taux est supérieur à 0 et pas d'auto-liquidation
      if (vatRate > 0 && !data.isReverseCharge) {
        if (!taxesByRate[vatRate]) {
          taxesByRate[vatRate] = 0;
        }
        taxesByRate[vatRate] += itemTax;
      }
    });

    // Ajouter les frais de livraison aux calculs si la livraison est facturée
    let shippingAmountHT = 0;
    let shippingTax = 0;

    // Pour les avoirs, utiliser les données shipping de la facture originale
    const shippingData = isCreditNote
      ? data.originalInvoice?.shipping
      : data.shipping;

    if (shippingData?.billShipping && shippingData?.shippingAmountHT > 0) {
      shippingAmountHT = parseFloat(shippingData.shippingAmountHT) || 0;
      const shippingVatRate = parseFloat(shippingData.shippingVatRate) || 20;

      // Calcul de la TVA sur la livraison
      // Auto-liquidation : TVA = 0 si isReverseCharge = true
      shippingTax = (data.isReverseCharge || shippingVatRate === 0) 
        ? 0 
        : shippingAmountHT * (shippingVatRate / 100);

      // Ajouter la TVA de livraison au total des taxes
      totalTax += shippingTax;

      // Ajouter la TVA de livraison au détail par taux si le taux est supérieur à 0 et pas d'auto-liquidation
      if (shippingVatRate > 0 && !data.isReverseCharge) {
        if (!taxesByRate[shippingVatRate]) {
          taxesByRate[shippingVatRate] = 0;
        }
        taxesByRate[shippingVatRate] += shippingTax;
      }
    }

    // Le total final inclut le montant après remise + TVA + livraison HT + TVA livraison
    const total = totalAfterDiscount + totalTax + shippingAmountHT;

    const taxDetails = Object.entries(taxesByRate)
      .sort(([rateA], [rateB]) => parseFloat(rateB) - parseFloat(rateA))
      .map(([rate, amount]) => ({
        rate: parseFloat(rate),
        amount: Number(amount.toFixed(2)),
      }));

    return {
      subtotal: Number(
        (isCreditNote ? -Math.abs(subtotal) : subtotal).toFixed(2)
      ),
      subtotalAfterItemDiscounts: Number(
        (isCreditNote
          ? -Math.abs(subtotalAfterItemDiscounts)
          : subtotalAfterItemDiscounts
        ).toFixed(2)
      ),
      discount: Number(
        (isCreditNote
          ? -Math.abs(globalDiscountAmount)
          : globalDiscountAmount
        ).toFixed(2)
      ),
      totalAfterDiscount: Number(
        (isCreditNote
          ? -Math.abs(totalAfterDiscount)
          : totalAfterDiscount
        ).toFixed(2)
      ),
      totalTax: Number(
        (isCreditNote ? -Math.abs(totalTax) : totalTax).toFixed(2)
      ),
      total: Number((isCreditNote ? -Math.abs(total) : total).toFixed(2)),
      taxDetails: taxDetails.map((tax) => ({
        ...tax,
        amount: isCreditNote ? -Math.abs(tax.amount) : tax.amount,
      })),
      discountType: data.discountType || "PERCENTAGE",
      discountValue: data.discount || 0,
    };
  };

  // Utiliser les totaux calculés ou ceux fournis dans les données
  const {
    subtotal,
    subtotalAfterItemDiscounts,
    totalTax,
    total,
    taxDetails = [],
    discount = 0,
    totalAfterDiscount = data.subtotal || 0,
    discountType = "PERCENTAGE",
    discountValue = 0,
  } = data.items?.length > 0
    ? calculateTotals(data.items)
    : {
        subtotal: data.subtotal || 0,
        subtotalAfterItemDiscounts: data.subtotal || 0,
        totalTax: data.totalTax || 0,
        total: data.total || 0,
        taxDetails: [],
      };

  // Utiliser le logo de l'organisation en priorité, puis celui des données comme fallback
  const companyLogo = organization?.logo || data.companyInfo?.logo;

  if (!data) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-sm border">
        <div className="text-center text-gray-500">
          <p>Aucune donnée disponible pour l'aperçu</p>
        </div>
      </div>
    );
  }

  const isInvoice = type === "invoice";

  // Fonction utilitaire pour convertir hex en rgba avec opacité
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Formatage des devises - identique au PDF
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0,00 €";

    const num = parseFloat(amount);
    if (isNaN(num)) return "0,00 €";

    // Formatage manuel pour correspondre exactement au PDF
    const formatted = num.toFixed(2).replace(".", ",");
    const parts = formatted.split(",");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    return parts.join(",") + " €";
  };

  // Formatage des dates - identique au PDF
  const formatDate = (dateInput) => {
    if (!dateInput) return "";

    let date;
    if (typeof dateInput === "number") {
      date = new Date(dateInput);
    } else if (typeof dateInput === "string" && /^\d+$/.test(dateInput)) {
      date = new Date(parseInt(dateInput, 10));
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return "";

    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return date.toLocaleDateString("fr-FR", options);
  };

  // Formatage des adresses - gère à la fois les chaînes et les objets
  const formatAddress = (address) => {
    if (!address) return "";

    // Si c'est une chaîne, on la retourne telle quelle
    if (typeof address === "string") {
      return address;
    }

    // Si c'est un objet, on construit l'adresse à partir des propriétés
    if (typeof address === "object" && address !== null) {
      try {
        const parts = [];
        if (address.fullName) parts.push(String(address.fullName));
        if (address.street) parts.push(String(address.street));
        if (address.postalCode && address.city) {
          parts.push(`${String(address.postalCode)} ${String(address.city)}`);
        } else if (address.city) {
          parts.push(String(address.city));
        }
        if (address.country) parts.push(String(address.country));
        return parts.join("\n") || "";
      } catch (error) {
        console.error("Error formatting address:", error, address);
        return "";
      }
    }

    // Fallback pour tout autre type
    return String(address || "");
  };

  // Formatage de l'IBAN avec espaces
  const formatIban = (iban) => {
    if (!iban) return "";
    
    // Supprimer tous les espaces existants et convertir en majuscules
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    
    // Ajouter un espace tous les 4 caractères
    return cleanIban.replace(/(.{4})/g, '$1 ').trim();
  };

  // Déterminer le titre du document comme dans le PDF
  const getDocumentTitle = () => {
    if (isCreditNote) {
      return "Avoir";
    }
    if (data.isDepositInvoice) {
      return "Facture d'acompte";
    }
    if (data.status === "DRAFT") {
      return isInvoice ? "Facture proforma" : "Devis";
    }
    return isInvoice ? "Facture" : "Devis";
  };

  return (
    <div
      style={isMobile ? { height: containerHeight, overflow: 'hidden' } : {}}
    >
      <div
        ref={documentRef}
        className={`w-full bg-white shadow-lg relative flex flex-col ${isMobile ? 'min-h-0' : (forPDF ? 'min-h-[1123px]' : 'min-h-screen')}`}
        style={{ 
          color: data.appearance?.textColor || "#000000",
          fontSize: isMobile ? '6px' : '10px',
          ...(isMobile && {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${100 / scale}%`,
          }),
          ...(forPDF && {
            minHeight: '1123px', // Hauteur A4 en pixels
            display: 'flex',
            flexDirection: 'column',
          }),
        }}
        data-pdf-document="true"
      >
      {/* CONTENU PRINCIPAL */}
      <div 
        className={isMobile ? "px-6 pt-4 pb-4 relative flex-grow" : "px-14 pt-10 pb-4 relative flex-grow"}
        data-pdf-content="true"
        style={forPDF ? { paddingBottom: '16px' } : {}}
      >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          {/* Logo à gauche */}
          <div className="flex-shrink-0">
            {companyLogo && (
              <img
                src={companyLogo}
                alt="Logo entreprise"
                className="h-20 w-auto object-contain"
                style={{ maxWidth: "150px" }}
                crossOrigin="anonymous"
              />
            )}
          </div>

          {/* Titre et informations de facture à droite */}
          <div className="text-right mb-6">
            <div className="text-3xl font-medium dark:text-[#0A0A0A] mb-2">
              {getDocumentTitle()}
            </div>
            <div className="space-y-1">
              <div className="flex justify-end" style={{ fontSize: "10px" }}>
                <span className="font-medium w-38 dark:text-[#0A0A0A] mr-2">
                  {isCreditNote
                    ? "Numéro d'avoir"
                    : type === "quote"
                      ? "Numéro de devis"
                      : "Numéro de facture"}
                  :
                </span>
                <span className="dark:text-[#0A0A0A]">
                  {(() => {
                    // Pour les devis, construire le numéro avec prefix et number
                    if (type === "quote") {
                      const prefix = data.prefix?.trim();
                      const number = data.number?.trim();
                      
                      if (prefix && number) {
                        return `${prefix}-${number}`;
                      } else if (number) {
                        return number;
                      } else if (prefix) {
                        return prefix;
                      }
                      return "D-202507-001"; // Placeholder pour devis
                    }
                    
                    // Pour les factures et avoirs
                    const prefix = data.prefix?.trim();
                    const number = data.number?.trim();
                    
                    if (prefix && number) {
                      return `${prefix}-${number}`;
                    } else if (number) {
                      return number;
                    }
                    
                    return isCreditNote ? "AV-202507-001" : "F-202507-001";
                  })()}
                </span>
              </div>
              <div className="flex justify-end" style={{ fontSize: "10px" }}>
                <span className="font-medium w-38 dark:text-[#0A0A0A] mr-2">
                  Date d'émission:
                </span>
                <span className="dark:text-[#0A0A0A]">
                  {formatDate(data.issueDate || data.date) ||
                    formatDate(new Date())}
                </span>
              </div>
              {!isCreditNote && (
                <div className="flex justify-end" style={{ fontSize: "10px" }}>
                  <span className="font-medium w-38 dark:text-[#0A0A0A] mr-2">
                    {type === "quote"
                      ? "Date de validité:"
                      : "Date d'échéance:"}
                  </span>
                  <span className="dark:text-[#0A0A0A]">
                    {formatDate(
                      type === "quote" ? data.validUntil : data.dueDate
                    ) ||
                      formatDate(
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      )}
                  </span>
                </div>
              )}
              {isCreditNote && data.originalInvoice && (
                <div className="flex justify-end" style={{ fontSize: "10px" }}>
                  <span className="font-medium w-38 dark:text-[#0A0A0A] mr-2">
                    Facture d'origine:
                  </span>
                  <span className="dark:text-[#0A0A0A]">
                    {data.originalInvoice.prefix && data.originalInvoice.number
                      ? `${data.originalInvoice.prefix}-${data.originalInvoice.number}`
                      : data.originalInvoice.number || data.originalInvoice}
                  </span>
                </div>
              )}
              {data.purchaseOrderNumber && (
                <div className="flex justify-end" style={{ fontSize: "10px" }}>
                  <span className="font-medium w-38 dark:text-[#0A0A0A] mr-2">
                    Référence devis:
                  </span>
                  <span className="dark:text-[#0A0A0A]">
                    {data.purchaseOrderNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INFORMATIONS ENTREPRISE ET CLIENT */}
        <div className="grid grid-cols-3 mb-6">
          {/* Informations entreprise */}
          <div>
            <div
              className="font-medium mb-2 dark:text-[#0A0A0A]"
              style={{ fontSize: "10px" }}
            >
              {data.companyInfo?.name || "Sweily"}
            </div>
            <div className="font-normal" style={{ fontSize: "10px" }}>
              {/* Adresse de l'entreprise */}
              {data.companyInfo?.address ? (
                <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                  {formatAddress(data.companyInfo.address)}
                </div>
              ) : (
                <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                  229 Rue Saint-Honoré\n75001 Paris, FR
                </div>
              )}

              {/* Email */}
              {data.companyInfo?.email && (
                <div className="dark:text-[#0A0A0A]">
                  {data.companyInfo.email}
                </div>
              )}

              {/* Téléphone */}
              {data.companyInfo?.phone && (
                <div className="dark:text-[#0A0A0A]">
                  {data.companyInfo.phone}
                </div>
              )}

              {/* Site web */}
              {data.companyInfo?.website && (
                <div className="dark:text-[#0A0A0A]">
                  {data.companyInfo.website}
                </div>
              )}

              {/* SIRET et numéro de TVA */}
              {data.companyInfo?.siret && (
                <div className="dark:text-[#0A0A0A]">
                  SIRET: {data.companyInfo.siret}
                </div>
              )}
              {data.companyInfo?.vatNumber && (
                <div className="dark:text-[#0A0A0A]">
                  N° TVA: {data.companyInfo.vatNumber}
                </div>
              )}
            </div>
          </div>

          {/* Informations client - Position dynamique selon clientPositionRight */}
          {/* Si clientPositionRight est false (par défaut), le client est au centre (colonne 2) */}
          {/* Si clientPositionRight est true, on ajoute une div vide au centre et le client va à droite (colonne 3) */}
          {!data.clientPositionRight && (data.client?.name ||
            data.client?.firstName ||
            data.client?.lastName ||
            data.client?.address ||
            data.client?.email ||
            data.client?.phone ||
            data.client?.siret ||
            data.client?.vatNumber) && (
            <div>
              <div
                className="font-medium mb-2 dark:text-[#0A0A0A]"
                style={{ fontSize: "10px" }}
              >
                {data.client?.name ||
                  `${data.client?.firstName || ""} ${data.client?.lastName || ""}`.trim() ||
                  "Client"}
              </div>
              <div className="font-normal" style={{ fontSize: "10px" }}>
                {data.client?.address && (
                  <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                    {formatAddress(data.client.address) || ""}
                  </div>
                )}
                {data.client?.email && (
                  <div className="dark:text-[#0A0A0A]">
                    {data.client.email}
                  </div>
                )}
                {data.client?.phone && (
                  <div className="dark:text-[#0A0A0A]">
                    {data.client.phone}
                  </div>
                )}
                {data.client?.siret && (
                  <div className="dark:text-[#0A0A0A]">
                    SIRET: {data.client.siret}
                  </div>
                )}
                {data.client?.vatNumber && (
                  <div className="dark:text-[#0A0A0A]">
                    N° TVA: {data.client.vatNumber}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Div vide pour pousser le client à droite si clientPositionRight est true */}
          {data.clientPositionRight && <div></div>}
          
          {/* Informations client à droite si clientPositionRight est true */}
          {data.clientPositionRight && (data.client?.name ||
            data.client?.firstName ||
            data.client?.lastName ||
            data.client?.address ||
            data.client?.email ||
            data.client?.phone ||
            data.client?.siret ||
            data.client?.vatNumber) && (
            <div className="text-right">
              <div
                className="font-medium mb-2 dark:text-[#0A0A0A]"
                style={{ fontSize: "10px" }}
              >
                {data.client?.name ||
                  `${data.client?.firstName || ""} ${data.client?.lastName || ""}`.trim() ||
                  "Client"}
              </div>
              <div className="font-normal" style={{ fontSize: "10px" }}>
                {data.client?.address && (
                  <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                    {formatAddress(data.client.address) || ""}
                  </div>
                )}
                {data.client?.email && (
                  <div className="dark:text-[#0A0A0A]">
                    {data.client.email}
                  </div>
                )}
                {data.client?.phone && (
                  <div className="dark:text-[#0A0A0A]">
                    {data.client.phone}
                  </div>
                )}
                {data.client?.siret && (
                  <div className="dark:text-[#0A0A0A]">
                    SIRET: {data.client.siret}
                  </div>
                )}
                {data.client?.vatNumber && (
                  <div className="dark:text-[#0A0A0A]">
                    N° TVA: {data.client.vatNumber}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Adresse de livraison - Priorité aux informations de livraison du formulaire si facturée */}
          {(() => {
            // Pour les avoirs, utiliser les données shipping de la facture originale
            // Pour les factures/devis, utiliser les données shipping seulement si billShipping est activé
            const shippingData = isCreditNote
              ? data.originalInvoice?.shipping
              : data.shipping;
            if (
              shippingData?.shippingAddress &&
              (isCreditNote || shippingData?.billShipping)
            ) {
              return (
                <div>
                  <div
                    className="font-medium mb-2 dark:text-[#0A0A0A]"
                    style={{ fontSize: "10px" }}
                  >
                    Adresse de livraison
                  </div>
                  <div className="font-normal" style={{ fontSize: "10px" }}>
                    <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                      {shippingData.shippingAddress.fullName && (
                        <div className="font-medium">
                          {shippingData.shippingAddress.fullName}
                        </div>
                      )}
                      <div>{shippingData.shippingAddress.street}</div>
                      <div>
                        {shippingData.shippingAddress.postalCode}{" "}
                        {shippingData.shippingAddress.city}
                      </div>
                      {shippingData.shippingAddress.country && (
                        <div>{shippingData.shippingAddress.country}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            // Sinon, utiliser l'adresse de livraison du client si elle existe (seulement pour factures/devis)
            else if (
              !isCreditNote &&
              data.client?.hasDifferentShippingAddress &&
              data.client?.shippingAddress
            ) {
              return (
                <div>
                  <div
                    className="font-medium mb-2 dark:text-[#0A0A0A]"
                    style={{ fontSize: "10px" }}
                  >
                    Adresse de livraison
                  </div>
                  <div className="font-normal" style={{ fontSize: "10px" }}>
                    <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                      {data.client.shippingAddress.fullName && (
                        <div className="font-medium">
                          {data.client.shippingAddress.fullName}
                        </div>
                      )}
                      <div>{data.client.shippingAddress.street}</div>
                      <div>
                        {data.client.shippingAddress.postalCode}{" "}
                        {data.client.shippingAddress.city}
                      </div>
                      {data.client.shippingAddress.country && (
                        <div>{data.client.shippingAddress.country}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* NOTES D'EN-TÊTE - masquées pour les avoirs */}
        {data.headerNotes && !isCreditNote && (
          <div className="mb-4" style={{ fontSize: "10px" }}>
            <div className="whitespace-pre-line dark:text-[#0A0A0A]">
              {data.headerNotes}
            </div>
          </div>
        )}

        {/* MONTANT DU MARCHÉ - Affiché si au moins un article a un avancement < 100% */}
        {(() => {
          // Vérifier si au moins un article a un avancement < 100%
          const hasProgressItems = data.items?.some(
            (item) => item.progressPercentage && item.progressPercentage < 100
          );

          if (!hasProgressItems || isCreditNote) return null;

          // Calculer le montant total HT du marché (sans tenir compte de l'avancement)
          const marketTotal = data.items.reduce((total, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            let itemTotal = quantity * unitPrice;

            // Appliquer la remise sur l'article si elle existe
            const itemDiscount = parseFloat(item.discount) || 0;
            if (itemDiscount > 0) {
              if (item.discountType?.toUpperCase() === "PERCENTAGE") {
                itemTotal = itemTotal * (1 - Math.min(itemDiscount, 100) / 100);
              } else {
                itemTotal = Math.max(0, itemTotal - itemDiscount);
              }
            }

            return total + itemTotal;
          }, 0);

          return (
            <div className="mb-3">
              <div className="flex items-center gap-3">
                <span className="font-normal text-[10px] dark:text-[#0A0A0A]">
                  Montant du marché :
                </span>
                <span className="font-medium text-[11px] dark:text-[#0A0A0A]">
                  {formatCurrency(marketTotal)}
                </span>
              </div>
            </div>
          );
        })()}

        {/* TABLEAU DES ARTICLES */}
        <div className="mb-6">
          {(() => {
            // Vérifier si au moins un article a un avancement différent de 0% ou 100%
            const showProgressColumn = data.items && data.items.some(item => {
              const progress = item.progressPercentage || 100;
              return progress > 0 && progress < 100;
            });

            return (
              <table className="w-full border-collapse text-xs border-b border-[#CCCCCC]">
                <thead>
                  <tr
                    style={{
                      backgroundColor: data.appearance?.headerBgColor || "#000000",
                    }}
                  >
                    <th
                      className="py-2 px-2 text-left text-[10px] font-medium"
                      style={{
                        color: data.appearance?.headerTextColor || "#FFFFFF",
                        width: showProgressColumn ? "40%" : "43%",
                      }}
                    >
                      Description
                    </th>
                    <th
                      className="py-1 px-2 text-right text-[10px] font-medium"
                      style={{
                        color: data.appearance?.headerTextColor || "#FFFFFF",
                        width: showProgressColumn ? "10%" : "11%",
                      }}
                    >
                      Qté
                    </th>
                    <th
                      className="py-1 px-2 text-right text-[10px] font-medium"
                      style={{
                        color: data.appearance?.headerTextColor || "#FFFFFF",
                        width: showProgressColumn ? "13%" : "15%",
                      }}
                    >
                      Prix unitaire
                    </th>
                    {showProgressColumn && (
                      <th
                        className="py-1 px-2 text-center text-[10px] font-medium"
                        style={{
                          color: data.appearance?.headerTextColor || "#FFFFFF",
                          width: "7%",
                        }}
                      >
                        %
                      </th>
                    )}
                    <th
                      className="py-1 px-2 text-right text-[10px] font-medium"
                      style={{
                        color: data.appearance?.headerTextColor || "#FFFFFF",
                        width: showProgressColumn ? "10%" : "11%",
                      }}
                    >
                      TVA (%)
                    </th>
                    <th
                      className="py-1 px-2 text-right text-[10px] font-medium"
                      style={{
                        color: data.appearance?.headerTextColor || "#FFFFFF",
                        width: showProgressColumn ? "20%" : "20%",
                      }}
                    >
                      Total HT
                    </th>
                  </tr>
                </thead>
            <tbody className="text-[10px]">
              {data.items && data.items.length > 0 ? (
                data.items.map((item, index) => (
                  <tr key={index} className="border-b border-[#CCCCCC]">
                    <td
                      className="pt-3 pb-3 px-2 dark:text-[#0A0A0A] align-top"
                      style={{ width: showProgressColumn ? "40%" : "43%", maxWidth: "300px", wordWrap: "break-word", overflowWrap: "break-word" }}
                    >
                      <div className="font-normal dark:text-[#0A0A0A] whitespace-pre-line break-words">
                        {item.description || ""}
                      </div>
                      {item.details && (
                        <div className="text-xs text-gray-600 mt-1 dark:text-[#0A0A0A] whitespace-pre-line break-words">
                          {item.details}
                        </div>
                      )}
                      {item.discount > 0 && (
                        <div className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
                          Remise:{" "}
                          {item.discountType?.toUpperCase() === "PERCENTAGE"
                            ? `${parseFloat(item.discount).toFixed(2)}%`
                            : formatCurrency(parseFloat(item.discount))}
                        </div>
                      )}
                    </td>
                    <td
                      className="pt-3 pb-3 px-2 text-right dark:text-[#0A0A0A] align-top"
                      style={{ width: showProgressColumn ? "10%" : "11%", whiteSpace: "nowrap" }}
                    >
                      {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                    </td>
                    <td
                      className="pt-3 pb-3 px-2 text-right dark:text-[#0A0A0A] align-top"
                      style={{ width: showProgressColumn ? "13%" : "15%" }}
                    >
                      {formatCurrency(item.unitPrice)}
                    </td>
                    {showProgressColumn && (
                      <td
                        className="pt-3 pb-3 px-2 text-center dark:text-[#0A0A0A] align-top"
                        style={{ width: "7%" }}
                      >
                        {item.progressPercentage && item.progressPercentage > 0 && item.progressPercentage < 100 ? (
                          <span
                            style={{ color: data.appearance?.headerBgColor || "#5b50FF" }}
                          >
                            {parseFloat(item.progressPercentage).toFixed(0)}%
                          </span>
                        ) : (
                          <span>100%</span>
                        )}
                      </td>
                    )}
                    <td
                      className="pt-3 pb-3 px-2 text-right dark:text-[#0A0A0A] align-top"
                      style={{ width: showProgressColumn ? "10%" : "11%" }}
                    >
                      {item.vatRate} %
                    </td>
                    <td
                      className="pt-3 pb-3 px-2 text-right dark:text-[#0A0A0A] align-top"
                      style={{ width: "20%" }}
                    >
                      {item.discount > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="line-through text-gray-500 text-[9px] mb-[-2px]">
                            {formatCurrency(
                              isCreditNote
                                ? -Math.abs(
                                    (item.quantity || 0) * (item.unitPrice || 0) * ((item.progressPercentage || 100) / 100)
                                  )
                                : (item.quantity || 0) * (item.unitPrice || 0) * ((item.progressPercentage || 100) / 100)
                            )}
                          </span>
                          <span>
                            {formatCurrency(
                              isCreditNote
                                ? -Math.abs(
                                    calculateItemTotal(
                                      item.quantity || 0,
                                      item.unitPrice || 0,
                                      item.discount || 0,
                                      item.discountType || "percentage",
                                      item.progressPercentage || 100
                                    )
                                  )
                                : calculateItemTotal(
                                    item.quantity || 0,
                                    item.unitPrice || 0,
                                    item.discount || 0,
                                    item.discountType || "percentage",
                                    item.progressPercentage || 100
                                  )
                            )}
                          </span>
                        </div>
                      ) : (
                        formatCurrency(
                          isCreditNote
                            ? -Math.abs(
                                (item.quantity || 0) * (item.unitPrice || 0) * ((item.progressPercentage || 100) / 100)
                              )
                            : (item.quantity || 0) * (item.unitPrice || 0) * ((item.progressPercentage || 100) / 100)
                        )
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-[#CCCCCC]">
                  <td
                    className="py-3 px-2 text-center dark:text-[#0A0A0A]"
                    style={{ width: showProgressColumn ? "40%" : "43%", maxWidth: "300px" }}
                  >
                    --
                  </td>
                  <td
                    className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                    style={{ width: showProgressColumn ? "10%" : "11%" }}
                  ></td>
                  <td
                    className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                    style={{ width: showProgressColumn ? "13%" : "15%" }}
                  >
                    --
                  </td>
                  {showProgressColumn && (
                    <td
                      className="py-3 px-2 text-center dark:text-[#0A0A0A]"
                      style={{ width: "7%" }}
                    >
                      100%
                    </td>
                  )}
                  <td
                    className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                    style={{ width: showProgressColumn ? "10%" : "11%", fontSize: "10px" }}
                  >
                    20 %
                  </td>
                  <td
                    className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                    style={{ width: "20%", fontSize: "10px" }}
                  >
                    0,00 €
                  </td>
                </tr>
              )}

              {/* Ligne de livraison si facturée */}
              {(() => {
                const shippingData = isCreditNote
                  ? data.originalInvoice?.shipping
                  : data.shipping;
                if (
                  !shippingData ||
                  !shippingData.billShipping ||
                  !shippingData.shippingAmountHT ||
                  shippingData.shippingAmountHT <= 0
                ) {
                  return null;
                }

                return (
                  <tr className="border-b border-[#CCCCCC]">
                    <td
                      className="py-3 px-2 dark:text-[#0A0A0A]"
                      style={{ width: showProgressColumn ? "40%" : "43%", maxWidth: "300px" }}
                    >
                      <div className="font-normal dark:text-[#0A0A0A]">
                        Frais de livraison
                      </div>
                    </td>
                    <td
                      className="py-3 px-2 text-center dark:text-[#0A0A0A]"
                      style={{ width: showProgressColumn ? "10%" : "11%" }}
                    >
                      {isCreditNote ? -1 : 1}
                    </td>
                    <td
                      className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                      style={{ width: showProgressColumn ? "13%" : "15%" }}
                    >
                      {formatCurrency(
                        isCreditNote
                          ? -Math.abs(shippingData.shippingAmountHT)
                          : shippingData.shippingAmountHT
                      )}
                    </td>
                    {showProgressColumn && (
                      <td
                        className="py-3 px-2 text-center dark:text-[#0A0A0A]"
                        style={{ width: "7%" }}
                      >
                        100%
                      </td>
                    )}
                    <td
                      className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                      style={{ width: showProgressColumn ? "10%" : "11%" }}
                    >
                      {shippingData.shippingVatRate || 20} %
                    </td>
                    <td
                      className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                      style={{ width: "20%" }}
                    >
                      {formatCurrency(
                        isCreditNote
                          ? -Math.abs(shippingData.shippingAmountHT)
                          : shippingData.shippingAmountHT
                      )}
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
            );
          })()}
        </div>

        {/* TOTAUX */}
        <div className="flex justify-end mb-6">
          <div className="w-72 space-y-1 text-xs">
            {/* 1. Total HT - Affiché seulement s'il y a des remises sur articles ou des remises globales */}
            {(subtotalAfterItemDiscounts < subtotal || discount > 0) && (
              <div className="flex justify-between py-1 px-3">
                <span className="font-medium text-[10px] dark:text-[#0A0A0A]">
                  Total HT
                </span>
                <div className="flex flex-col items-end">
                  {subtotalAfterItemDiscounts < subtotal && (
                    <span className="line-through text-gray-400 text-[9px] mb-[-2px]">
                      {formatCurrency(subtotal)}
                    </span>
                  )}
                  <span className="dark:text-[#0A0A0A] text-[10px] font-medium">
                    {formatCurrency(subtotalAfterItemDiscounts)}
                  </span>
                </div>
              </div>
            )}

            {/* 2. Remise */}
            {discount > 0 && (
              <div className="flex justify-between py-1 px-3">
                <div className="flex flex-col">
                  <span className="text-[10px] dark:text-[#0A0A0A]">
                    Remise globale{" "}
                    {discountType === "PERCENTAGE" ? `(${discountValue}%)` : ""}
                  </span>
                  <span className="text-[8px] text-gray-500 -mt-0.5">
                    (appliquée sur {formatCurrency(subtotalAfterItemDiscounts)})
                  </span>
                </div>
                <span className="dark:text-[#FF0000] text-[10px] font-medium">
                  -{formatCurrency(discount)}
                </span>
              </div>
            )}

            {/* 3. Total HT final - Affiché avec le bon libellé selon les remises */}
            {discount > 0 ? (
              <div className="flex justify-between py-1 px-3">
                <span className="font-medium text-[10px] dark:text-[#0A0A0A]">
                  Total HT après remise
                </span>
                <span className="dark:text-[#0A0A0A] text-[10px] font-medium">
                  {formatCurrency(totalAfterDiscount)}
                </span>
              </div>
            ) : (
              // Si pas de remise globale ET pas de remise sur articles, afficher le total HT simple
              subtotalAfterItemDiscounts >= subtotal && (
                <div className="flex justify-between py-1 px-3">
                  <span className="font-medium text-[10px] dark:text-[#0A0A0A]">
                    Total HT
                  </span>
                  <span className="dark:text-[#0A0A0A] text-[10px] font-medium">
                    {formatCurrency(totalAfterDiscount)}
                  </span>
                </div>
              )
            )}

            {/* 3.5. Frais de livraison */}
            {(() => {
              const shippingData = isCreditNote
                ? data.originalInvoice?.shipping
                : data.shipping;
              return (
                shippingData?.billShipping && shippingData?.shippingAmountHT > 0
              );
            })() && (
              <div className="flex justify-between py-1 px-3">
                <span className="text-[10px] dark:text-[#0A0A0A]">
                  Frais de livraison HT
                </span>
                <span className="dark:text-[#0A0A0A] text-[10px]">
                  {(() => {
                    const shippingData = isCreditNote
                      ? data.originalInvoice?.shipping
                      : data.shipping;
                    return formatCurrency(
                      isCreditNote
                        ? -Math.abs(shippingData.shippingAmountHT)
                        : shippingData.shippingAmountHT
                    );
                  })()}
                </span>
              </div>
            )}

            {/* 4. Détail des TVA par taux - Masqué si auto-liquidation */}
            {!data.isReverseCharge && taxDetails.length > 0
              ? taxDetails.map((tax, index) => (
                  <div
                    key={`tax-${index}`}
                    className="flex justify-between py-1 px-3"
                  >
                    <span className="text-[10px] dark:text-[#0A0A0A]">
                      TVA {tax.rate}%
                    </span>
                    <span className="dark:text-[#0A0A0A] text-[10px]">
                      {formatCurrency(tax.amount)}
                    </span>
                  </div>
                ))
              : !data.isReverseCharge && totalTax > 0 && (
                  <div className="flex justify-between py-1 px-3">
                    <span className="text-[10px] dark:text-[#0A0A0A]">TVA</span>
                    <span className="dark:text-[#0A0A0A] text-[10px]">
                      {formatCurrency(totalTax)}
                    </span>
                  </div>
                )}

            {/* 5. Total TVA - Masqué si auto-liquidation */}
            {!data.isReverseCharge && totalTax > 0 && (
              <div className="flex justify-between py-1 px-3 font-medium">
                <span className="text-[10px] dark:text-[#0A0A0A]">
                  Total TVA
                </span>
                <span className="dark:text-[#0A0A0A] text-[10px]">
                  {formatCurrency(totalTax)}
                </span>
              </div>
            )}
            
            {/* Auto-liquidation : Afficher "TVA non applicable" au lieu des montants */}
            {data.isReverseCharge && (
              <div className="flex justify-between py-1 px-3">
                <span className="text-[10px] dark:text-[#0A0A0A]">TVA</span>
                <span className="dark:text-[#0A0A0A] text-[10px] italic">
                  Auto-liquidation
                </span>
              </div>
            )}

            {/* 5.1 Escompte (appliqué sur HT avant TVA) */}
            {(() => {
              const escompteValue = parseFloat(data.escompte) || 0;
              if (escompteValue <= 0) return null;
              
              // Calculer le HT total (total - TVA)
              const totalHT = total - totalTax;
              const escompteAmount = (totalHT * escompteValue) / 100;
              
              return (
                <div className="flex justify-between py-1 px-3">
                  <span className="text-[10px] dark:text-[#0A0A0A]">
                    Escompte sur HT ({escompteValue}%)
                  </span>
                  <span className="dark:text-[#0A0A0A] text-[10px]">
                    -{formatCurrency(escompteAmount)}
                  </span>
                </div>
              );
            })()}

            {/* 5.2 Recalcul TVA après escompte */}
            {(() => {
              const escompteValue = parseFloat(data.escompte) || 0;
              if (escompteValue <= 0 || data.isReverseCharge || totalTax === 0) return null;
              
              const totalHT = total - totalTax;
              const escompteAmount = (totalHT * escompteValue) / 100;
              const htAfterEscompte = totalHT - escompteAmount;
              const tvaAfterEscompte = (htAfterEscompte / totalHT) * totalTax;
              
              return (
                <div className="flex justify-between py-1 px-3">
                  <span className="text-[10px] dark:text-[#0A0A0A]">
                    TVA après escompte
                  </span>
                  <span className="dark:text-[#0A0A0A] text-[10px]">
                    {formatCurrency(tvaAfterEscompte)}
                  </span>
                </div>
              );
            })()}

            {/* 6. Total TTC (ou Total TTC après escompte si escompte appliqué) */}
            {(() => {
              const escompteValue = parseFloat(data.escompte) || 0;
              
              if (escompteValue > 0) {
                // Afficher Total TTC après escompte
                const totalHT = total - totalTax;
                const escompteAmount = (totalHT * escompteValue) / 100;
                const htAfterEscompte = totalHT - escompteAmount;
                const tvaAfterEscompte = data.isReverseCharge ? 0 : (htAfterEscompte / totalHT) * totalTax;
                const ttcAfterEscompte = htAfterEscompte + tvaAfterEscompte;
                
                return (
                  <div 
                    className="flex justify-between py-2 px-6 font-medium text-sm mt-2"
                    style={{
                      backgroundColor: applyOpacityToColor(data.appearance?.headerBgColor || "#1d1d1b", 0.1)
                    }}
                  >
                    <span className="-ml-3 text-[10px] font-medium dark:text-[#0A0A0A]">
                      Total TTC
                    </span>
                    <span className="-mr-3 text-[10px] dark:text-[#0A0A0A] font-medium">
                      {formatCurrency(ttcAfterEscompte)}
                    </span>
                  </div>
                );
              } else {
                // Afficher Total TTC normal
                return (
                  <div 
                    className="flex justify-between py-2 px-6 font-medium text-sm mt-2"
                    style={{
                      backgroundColor: applyOpacityToColor(data.appearance?.headerBgColor || "#1d1d1b", 0.1)
                    }}
                  >
                    <span className="-ml-3 text-[10px] font-medium dark:text-[#0A0A0A]">
                      Total TTC
                    </span>
                    <span className="-mr-3 text-[10px] dark:text-[#0A0A0A] font-medium">
                      {formatCurrency(total)}
                    </span>
                  </div>
                );
              }
            })()}

            {/* 6.4 Retenue de garantie (appliquée sur TTC) */}
            {(() => {
              const retenueValue = parseFloat(data.retenueGarantie) || 0;
              const escompteValue = parseFloat(data.escompte) || 0;
              if (retenueValue <= 0) return null;
              
              // Si escompte, calculer sur le TTC après escompte, sinon sur le TTC normal
              let baseAmount = total;
              if (escompteValue > 0) {
                const totalHT = total - totalTax;
                const escompteAmount = (totalHT * escompteValue) / 100;
                const htAfterEscompte = totalHT - escompteAmount;
                const tvaAfterEscompte = data.isReverseCharge ? 0 : (htAfterEscompte / totalHT) * totalTax;
                baseAmount = htAfterEscompte + tvaAfterEscompte;
              }
              
              const retenueAmount = (baseAmount * retenueValue) / 100;
              
              return (
                <div className="flex justify-between py-1 px-3">
                  <span className="text-[10px] dark:text-[#0A0A0A]">
                    Retenue de garantie ({retenueValue}%)
                  </span>
                  <span className="dark:text-[#0A0A0A] text-[10px]">
                    -{formatCurrency(retenueAmount)}
                  </span>
                </div>
              );
            })()}

            {/* 6.5 Net à payer (si retenue ou escompte) */}
            {(() => {
              const retenueValue = parseFloat(data.retenueGarantie) || 0;
              const escompteValue = parseFloat(data.escompte) || 0;
              if (retenueValue <= 0 && escompteValue <= 0) return null;
              
              // Calculer le montant final
              let finalAmount = total;
              
              // Appliquer l'escompte sur HT
              if (escompteValue > 0) {
                const totalHT = total - totalTax;
                const escompteAmount = (totalHT * escompteValue) / 100;
                const htAfterEscompte = totalHT - escompteAmount;
                const tvaAfterEscompte = data.isReverseCharge ? 0 : (htAfterEscompte / totalHT) * totalTax;
                finalAmount = htAfterEscompte + tvaAfterEscompte;
              }
              
              // Appliquer la retenue sur TTC
              if (retenueValue > 0) {
                const retenueAmount = (finalAmount * retenueValue) / 100;
                finalAmount = finalAmount - retenueAmount;
              }
              
              return (
                <div 
                  className="flex justify-between py-2 px-6 font-bold text-sm mt-1"
                  style={{
                    backgroundColor: applyOpacityToColor(data.appearance?.headerBgColor || "#1d1d1b", 0.15)
                  }}
                >
                  <span className="-ml-3 text-[10px] font-bold dark:text-[#0A0A0A]">
                    Net à payer
                  </span>
                  <span className="-mr-3 text-[10px] dark:text-[#0A0A0A] font-bold">
                    {formatCurrency(finalAmount)}
                  </span>
                </div>
              );
            })()}

            {/* 7. Champs personnalisés */}
            {data.customFields &&
              data.customFields.length > 0 &&
              data.customFields.map((field, index) => (
                <div
                  key={`custom-field-${index}`}
                  className="flex justify-between py-1 px-3 text-[10px]"
                >
                  <span className="dark:text-[#0A0A0A] font-medium">
                    {field.name}
                  </span>
                  <span className="dark:text-[#0A0A0A] font-normal">
                    {field.value}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* MENTION AUTO-LIQUIDATION */}
        {data.isReverseCharge && (
          <div className="mb-4 text-[10px] pt-2">
            <p className="text-gray-700 dark:text-[#0A0A0A] text-[10px]">
              <span className="font-medium">Autoliquidation :</span> TVA non applicable, article 283 du CGI
            </p>
          </div>
        )}

        {/* TEXTE D'EXONÉRATION DE TVA - Masqué en auto-liquidation car déjà affiché au-dessus */}
        {!data.isReverseCharge && data.items &&
          data.items.some(
            (item) =>
              (item.vatRate === 0 || item.vatRate === "0") &&
              item.vatExemptionText
          ) && (
            <div className="mb-4 text-[10px] pt-4">
              <div className="whitespace-pre-line dark:text-[#0A0A0A] text-[10px]">
                {data.items
                  .filter(
                    (item) =>
                      (item.vatRate === 0 || item.vatRate === "0") &&
                      item.vatExemptionText
                  )
                  .map((item, index) => (
                    <div key={`vat-exemption-${index}`} className="mb-2">
                      TVA non applicable, {item.vatExemptionText}
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* CONDITIONS GÉNÉRALES - masquées pour les avoirs */}
        {data.termsAndConditions && !isCreditNote && (
          <div className="mb-4 text-[10px] pt-4">
            <div className="whitespace-pre-line dark:text-[#0A0A0A] text-[10px]">
              {data.termsAndConditions}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER - DÉTAILS BANCAIRES */}
      <div 
        className={isMobile ? "pt-4 pb-4 px-6 w-full" : "pt-8 pb-8 px-14 w-full"}
        style={{
          backgroundColor: applyOpacityToColor(data.appearance?.headerBgColor || "#1d1d1b", 0.1),
          ...(forPDF ? { marginTop: 'auto' } : {})
        }}
        data-pdf-footer="true"
      >
        {/* Afficher les coordonnées bancaires uniquement si showBankDetails est vrai ET que ce n'est pas un devis NI un avoir */}
        {data.showBankDetails === true &&
          type !== "quote" &&
          !isCreditNote && (
            <div className="mb-3">
              <div className="font-medium text-xs mb-2 dark:text-[#0A0A0A]">
                Détails du paiement
              </div>
              <div className="flex flex-col gap-1 mt-2 text-[10px] dark:text-[#0A0A0A]">
                <div className="flex">
                  <span className="font-medium w-32">Nom du bénéficiaire</span>
                  <span className="font-normal">
                    {data.companyInfo?.name || "Sweily"}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-medium w-32">Nom de la banque</span>
                  <span className="font-normal">
                    {data.bankDetails?.bankName || data.userBankDetails?.bankName || data.companyInfo?.bankDetails?.bankName || ""}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-medium w-32">BIC</span>
                  <span className="font-normal">
                    {data.bankDetails?.bic || data.userBankDetails?.bic || data.companyInfo?.bankDetails?.bic || ""}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-medium w-32">IBAN</span>
                  <span className="font-normal">
                    {formatIban(data.bankDetails?.iban || data.userBankDetails?.iban || data.companyInfo?.bankDetails?.iban || "")}
                  </span>
                </div>
              </div>
            </div>
          )}

        {/* NOTES ET CONDITIONS - masquées pour les avoirs */}
        {data.footerNotes && !isCreditNote && (
          <div className="mt-6 py-4 text-[10px]">
            <div className="whitespace-pre-line dark:text-[#0A0A0A] text-[10px]">
              {data.footerNotes}
            </div>
          </div>
        )}

        {/* Afficher le trait de séparation seulement si des coordonnées bancaires ou des notes sont présentes */}
        <div
          className={`text-[10px] dark:text-[#0A0A0A] whitespace-pre-line ${
            (data.showBankDetails === true &&
              type !== "quote" &&
              !isCreditNote) ||
            (data.footerNotes && !isCreditNote)
              ? "border-t pt-2"
              : "pt-2"
          }`}
        >
          {generateDynamicFooter(data.companyInfo)}
        </div>
      </div>
      </div>
    </div>
  );
};

export default UniversalPreviewPDF;
