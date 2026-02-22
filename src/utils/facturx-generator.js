/**
 * Générateur Factur-X pour l'intégration XML dans les factures PDF
 * Conforme à la norme EN 16931 (Factur-X / ZUGFeRD) — profil EN16931
 * Compatible SuperPDP / PPF (réforme facturation électronique 2026)
 */

import { PDFDocument, PDFName, PDFString } from 'pdf-lib';

/**
 * Génère le XML Factur-X à partir des données de facture ou avoir
 * @param {Object} invoiceData - Données de la facture ou avoir
 * @param {string} documentType - Type de document ('invoice' ou 'creditNote')
 * @returns {string} - XML Factur-X formaté
 */
export function generateFacturXXML(invoiceData, documentType = 'invoice') {
  const {
    number,
    issueDate,
    dueDate,
    companyInfo,
    client,
    items = [],
    finalTotalHT,
    totalVAT,
    finalTotalTTC,
    bankDetails,
    shipping,
    headerNotes,
    footerNotes,
    purchaseOrderNumber,
    operationType,
  } = invoiceData;

  // Type de document : 380 = Facture, 381 = Avoir
  const typeCode = documentType === 'creditNote' ? '381' : '380';

  // Formater les dates au format YYYYMMDD
  const formatDateXML = (date) => {
    if (!date) return '';

    // Gérer les timestamps en string ou number
    let d;
    if (typeof date === 'string' && /^\d+$/.test(date)) {
      d = new Date(parseInt(date, 10));
    } else if (typeof date === 'number') {
      d = new Date(date);
    } else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) {
      console.warn('Date invalide pour Factur-X:', date);
      return '';
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // Extraire SIREN (9 premiers caractères du SIRET)
  const sellerSiret = companyInfo?.siret || '';
  const sellerSiren = sellerSiret ? sellerSiret.substring(0, 9) : '';
  const buyerSiret = client?.siret || '';
  const buyerSiren = buyerSiret ? buyerSiret.substring(0, 9) : '';

  // Code pays (2 lettres)
  const getCountryCode = (country) => {
    if (!country) return 'FR';
    if (country.length === 2) return country.toUpperCase();
    const map = {
      'france': 'FR', 'allemagne': 'DE', 'belgique': 'BE',
      'espagne': 'ES', 'italie': 'IT', 'luxembourg': 'LU',
      'pays-bas': 'NL', 'portugal': 'PT', 'royaume-uni': 'GB', 'suisse': 'CH',
    };
    return map[country.toLowerCase().trim()] || 'FR';
  };

  const sellerCountry = getCountryCode(companyInfo?.address?.country);
  const buyerCountry = getCountryCode(client?.address?.country);

  // Calculer les totaux par taux de TVA (avec progressPercentage)
  const vatBreakdown = {};
  items.forEach(item => {
    const vatRate = item.vatRate ?? 20;
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    let itemTotal = quantity * unitPrice;

    // Application progressPercentage
    const progressPercentage = item.progressPercentage != null ? item.progressPercentage : 100;
    itemTotal = itemTotal * (progressPercentage / 100);

    // Application remise article
    if (item.discount && item.discount > 0) {
      if (item.discountType === 'PERCENTAGE') {
        itemTotal = itemTotal * (1 - Math.min(item.discount, 100) / 100);
      } else {
        itemTotal = Math.max(0, itemTotal - item.discount);
      }
    }

    if (!vatBreakdown[vatRate]) {
      vatBreakdown[vatRate] = { base: 0, amount: 0 };
    }
    vatBreakdown[vatRate].base += itemTotal;
  });

  // Calculer les montants de TVA
  Object.keys(vatBreakdown).forEach(rate => {
    const base = vatBreakdown[rate].base;
    vatBreakdown[rate].amount = (base * parseFloat(rate)) / 100;
  });

  // --- Build IncludedNote sections (BR-FR-05/06/07) ---
  let includedNotes = '';
  // Note obligatoire : pénalités de retard (BR-FR-05)
  includedNotes += `
    <ram:IncludedNote>
      <ram:Content>En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.</ram:Content>
      <ram:SubjectCode>PMD</ram:SubjectCode>
    </ram:IncludedNote>`;
  // Note obligatoire : indemnité forfaitaire recouvrement (BR-FR-06)
  includedNotes += `
    <ram:IncludedNote>
      <ram:Content>Indemnité forfaitaire pour frais de recouvrement : 40 €</ram:Content>
      <ram:SubjectCode>PMT</ram:SubjectCode>
    </ram:IncludedNote>`;
  // Note obligatoire : escompte (BR-FR-07)
  includedNotes += `
    <ram:IncludedNote>
      <ram:Content>Pas d'escompte pour paiement anticipé.</ram:Content>
      <ram:SubjectCode>AAB</ram:SubjectCode>
    </ram:IncludedNote>`;
  // Note conditionnelle : TVA sur les débits
  if (companyInfo?.vatPaymentCondition === 'DEBITS') {
    includedNotes += `
    <ram:IncludedNote>
      <ram:Content>TVA acquittée sur les débits</ram:Content>
      <ram:SubjectCode>REG</ram:SubjectCode>
    </ram:IncludedNote>`;
  }
  // Header/footer notes utilisateur
  if (headerNotes) {
    includedNotes += `
    <ram:IncludedNote>
      <ram:Content>${escapeXML(headerNotes)}</ram:Content>
    </ram:IncludedNote>`;
  }
  if (footerNotes) {
    includedNotes += `
    <ram:IncludedNote>
      <ram:Content>${escapeXML(footerNotes)}</ram:Content>
    </ram:IncludedNote>`;
  }
  // Note conditionnelle : nature de l'opération (LB/PS/LBPS)
  if (operationType) {
    const operationLabels = {
      'LB': 'Livraison de biens',
      'PS': 'Prestation de services',
      'LBPS': 'Mixte - Livraison de biens et prestation de services',
    };
    includedNotes += `
    <ram:IncludedNote>
      <ram:Content>Nature de l'opération : ${escapeXML(operationLabels[operationType] || operationType)}</ram:Content>
      <ram:SubjectCode>AAI</ram:SubjectCode>
    </ram:IncludedNote>`;
  }

  // --- Build line items ---
  const lineItemsXML = items.map((item, index) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    let itemTotal = quantity * unitPrice;
    const vatRate = item.vatRate ?? 20;
    const categoryCode = parseFloat(vatRate) === 0 ? 'Z' : 'S';

    // Application progressPercentage
    const progressPercentage = item.progressPercentage != null ? item.progressPercentage : 100;
    itemTotal = itemTotal * (progressPercentage / 100);

    if (item.discount && item.discount > 0) {
      if (item.discountType === 'PERCENTAGE') {
        itemTotal = itemTotal * (1 - Math.min(item.discount, 100) / 100);
      } else {
        itemTotal = Math.max(0, itemTotal - item.discount);
      }
    }

    return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXML(item.description || '')}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${unitPrice.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${quantity.toFixed(2)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${categoryCode}</ram:CategoryCode>
          <ram:RateApplicablePercent>${vatRate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${itemTotal.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }).join('');

  // --- Build seller SpecifiedLegalOrganization (BT-30 SIREN) ---
  let sellerLegalOrg = '';
  if (sellerSiren) {
    sellerLegalOrg = `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXML(sellerSiren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>`;
  }

  // --- Build seller URIUniversalCommunication (BT-34) ---
  let sellerURI = '';
  if (sellerSiren) {
    sellerURI = `
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="0009">${escapeXML(sellerSiren)}</ram:URIID>
        </ram:URIUniversalCommunication>`;
  }

  // --- Build buyer SpecifiedLegalOrganization (BT-47 SIREN) ---
  let buyerLegalOrg = '';
  if (buyerSiren) {
    buyerLegalOrg = `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXML(buyerSiren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>`;
  }

  // --- Build buyer URIUniversalCommunication (BT-49) ---
  let buyerURI = '';
  if (buyerSiren) {
    buyerURI = `
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="0009">${escapeXML(buyerSiren)}</ram:URIID>
        </ram:URIUniversalCommunication>`;
  }

  // --- Build BuyerReference (BT-10) ---
  let buyerReference = '';
  if (purchaseOrderNumber) {
    buyerReference = `
      <ram:BuyerReference>${escapeXML(purchaseOrderNumber)}</ram:BuyerReference>`;
  }

  // --- Build shipping address (BT-72) ---
  let deliveryContent = '';
  if (shipping?.billShipping && shipping?.shippingAddress) {
    const sa = shipping.shippingAddress;
    deliveryContent = `
      <ram:ShipToTradeParty>
        <ram:PostalTradeAddress>
          ${sa.postalCode ? `<ram:PostcodeCode>${escapeXML(sa.postalCode)}</ram:PostcodeCode>` : ''}
          ${sa.street ? `<ram:LineOne>${escapeXML(sa.street)}</ram:LineOne>` : ''}
          ${sa.city ? `<ram:CityName>${escapeXML(sa.city)}</ram:CityName>` : ''}
          <ram:CountryID>${getCountryCode(sa.country)}</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:ShipToTradeParty>`;
  }

  // --- Build payment means (always include, BIC correction) ---
  let paymentMeansXML = '';
  if (bankDetails?.iban) {
    let bicSection = '';
    if (bankDetails.bic) {
      bicSection = `
        <ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>${escapeXML(bankDetails.bic)}</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>`;
    }
    paymentMeansXML = `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>30</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${escapeXML(bankDetails.iban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>${bicSection}
      </ram:SpecifiedTradeSettlementPaymentMeans>`;
  } else {
    // PaymentMeansCode systématique même sans IBAN (30 = virement par défaut)
    paymentMeansXML = `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>30</ram:TypeCode>
      </ram:SpecifiedTradeSettlementPaymentMeans>`;
  }

  // --- Build VAT breakdown with CategoryCode Z for 0% ---
  const vatBreakdownXML = Object.keys(vatBreakdown).map(rate => {
    const categoryCode = parseFloat(rate) === 0 ? 'Z' : 'S';
    let exemptionReason = '';
    if (parseFloat(rate) === 0) {
      // Check if any item with 0% has vatExemptionText
      const exemptItem = items.find(i => (i.vatRate ?? 20) === 0 && i.vatExemptionText);
      if (exemptItem) {
        exemptionReason = `
        <ram:ExemptionReason>${escapeXML(exemptItem.vatExemptionText)}</ram:ExemptionReason>`;
      }
    }
    return `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${vatBreakdown[rate].amount.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${vatBreakdown[rate].base.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>${categoryCode}</ram:CategoryCode>
        <ram:RateApplicablePercent>${rate}</ram:RateApplicablePercent>${exemptionReason}
      </ram:ApplicableTradeTax>`;
  }).join('');

  // Générer le XML Factur-X (profil EN16931 - requis pour la réforme B2B)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXML(number || '')}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDateXML(issueDate)}</udt:DateTimeString>
    </ram:IssueDateTime>${includedNotes}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${lineItemsXML}
    <ram:ApplicableHeaderTradeAgreement>${buyerReference}
      <ram:SellerTradeParty>
        <ram:Name>${escapeXML(companyInfo?.name || '')}</ram:Name>${sellerLegalOrg}
        <ram:PostalTradeAddress>
          ${companyInfo?.address?.postalCode ? `<ram:PostcodeCode>${escapeXML(companyInfo.address.postalCode)}</ram:PostcodeCode>` : ''}
          <ram:LineOne>${escapeXML(companyInfo?.address?.street || '')}</ram:LineOne>
          <ram:CityName>${escapeXML(companyInfo?.address?.city || '')}</ram:CityName>
          <ram:CountryID>${sellerCountry}</ram:CountryID>
        </ram:PostalTradeAddress>${sellerURI}
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXML(companyInfo?.vatNumber || '')}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXML(client?.name || '')}</ram:Name>${buyerLegalOrg}
        <ram:PostalTradeAddress>
          ${client?.address?.postalCode ? `<ram:PostcodeCode>${escapeXML(client.address.postalCode)}</ram:PostcodeCode>` : ''}
          <ram:LineOne>${escapeXML(client?.address?.street || '')}</ram:LineOne>
          <ram:CityName>${escapeXML(client?.address?.city || '')}</ram:CityName>
          <ram:CountryID>${buyerCountry}</ram:CountryID>
        </ram:PostalTradeAddress>${buyerURI}
        ${client?.vatNumber ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXML(client.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>${deliveryContent}
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>${paymentMeansXML}${vatBreakdownXML}
      ${dueDate ? `<ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${formatDateXML(dueDate)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>` : ''}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${(finalTotalHT || 0).toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${(finalTotalHT || 0).toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${(totalVAT || 0).toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${(finalTotalTTC || 0).toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${(finalTotalTTC || 0).toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  return xml;
}

/**
 * Échappe les caractères spéciaux XML
 */
function escapeXML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Embarque le XML Factur-X dans un PDF existant
 * @param {ArrayBuffer} pdfBytes - Bytes du PDF original
 * @param {Object} invoiceData - Données de la facture ou avoir
 * @param {string} documentType - Type de document ('invoice' ou 'creditNote')
 * @returns {Promise<Uint8Array>} - PDF avec XML embarqué
 */
export async function embedFacturXInPDF(pdfBytes, invoiceData, documentType = 'invoice') {
  try {
    // Charger le PDF existant
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Générer le XML Factur-X
    const xml = generateFacturXXML(invoiceData, documentType);
    const xmlBytes = new TextEncoder().encode(xml);

    // Créer l'attachement XML
    const attachmentName = 'factur-x.xml';

    // Note: Cette fonction n'est plus utilisée directement
    // Le PDF/A-3 et les métadonnées XMP sont maintenant gérés par l'API /api/generate-facturx
    // Cette fonction est conservée pour référence et fallback

    // Embarquer le fichier XML comme pièce jointe (fallback simple)
    await pdfDoc.attach(xmlBytes, attachmentName, {
      mimeType: 'text/xml',
      description: 'Factur-X XML Invoice',
      creationDate: new Date(),
      modificationDate: new Date(),
    });

    // Ajouter les métadonnées PDF basiques
    const docTitle = documentType === 'creditNote' ? 'Avoir' : 'Facture';
    pdfDoc.getInfoDict().set(PDFName.of('Title'), PDFString.of(`${docTitle} ${invoiceData.number || ''}`));
    pdfDoc.getInfoDict().set(PDFName.of('Subject'), PDFString.of('Factur-X Invoice'));

    // Sauvegarder le PDF modifié
    const modifiedPdfBytes = await pdfDoc.save();

    return modifiedPdfBytes;
  } catch (error) {
    console.error('Erreur lors de l\'embarquement Factur-X:', error);
    throw error;
  }
}

/**
 * Vérifie si les données de facture sont complètes pour Factur-X
 */
export function validateFacturXData(invoiceData) {
  const errors = [];

  // Log des données reçues pour debug
  console.log('Validation Factur-X - Données reçues:', {
    number: invoiceData.number,
    issueDate: invoiceData.issueDate,
    companyName: invoiceData.companyInfo?.name,
    companyVatNumber: invoiceData.companyInfo?.vatNumber,
    companySiret: invoiceData.companyInfo?.siret,
    companyPostalCode: invoiceData.companyInfo?.address?.postalCode,
    clientName: invoiceData.client?.name,
    clientPostalCode: invoiceData.client?.address?.postalCode,
    itemsCount: invoiceData.items?.length || 0,
  });

  if (!invoiceData.number) errors.push('Numéro de facture manquant');
  if (!invoiceData.issueDate) errors.push('Date d\'émission manquante');
  if (!invoiceData.companyInfo?.name) errors.push('Nom de l\'entreprise manquant');
  if (!invoiceData.companyInfo?.vatNumber) errors.push('Numéro de TVA manquant');
  if (!invoiceData.companyInfo?.siret) errors.push('SIRET vendeur manquant');
  if (!invoiceData.companyInfo?.address?.postalCode) errors.push('Code postal vendeur manquant');
  if (!invoiceData.client?.name) errors.push('Nom du client manquant');
  if (!invoiceData.client?.address?.postalCode) errors.push('Code postal acheteur manquant');
  if (!invoiceData.items || invoiceData.items.length === 0) errors.push('Aucun article dans la facture');

  if (errors.length > 0) {
    console.warn('Validation Factur-X échouée:');
    errors.forEach((error, index) => {
      console.warn(`  ${index + 1}. ${error}`);
    });
  } else {
    console.log('Validation Factur-X réussie - Toutes les données sont présentes');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
