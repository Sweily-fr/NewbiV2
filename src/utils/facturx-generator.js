/**
 * Générateur Factur-X pour l'intégration XML dans les factures PDF
 * Conforme à la norme EN 16931 (Factur-X / ZUGFeRD)
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
  } = invoiceData;
  
  // Type de document : 380 = Facture, 381 = Avoir
  const typeCode = documentType === 'creditNote' ? '381' : '380';

  // Formater les dates au format YYYYMMDD
  const formatDateXML = (date) => {
    if (!date) return '';
    
    // Gérer les timestamps en string ou number
    let d;
    if (typeof date === 'string' && /^\d+$/.test(date)) {
      // Timestamp en string
      d = new Date(parseInt(date, 10));
    } else if (typeof date === 'number') {
      // Timestamp en number
      d = new Date(date);
    } else {
      // Date ISO ou autre format
      d = new Date(date);
    }
    
    // Vérifier que la date est valide
    if (isNaN(d.getTime())) {
      console.warn('Date invalide pour Factur-X:', date);
      return '';
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // Calculer les totaux par taux de TVA
  const vatBreakdown = {};
  items.forEach(item => {
    const vatRate = item.vatRate || 20;
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    let itemTotal = quantity * unitPrice;

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

  // Générer le XML Factur-X (profil EN16931 - requis pour la réforme B2B)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXML(number || '')}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDateXML(issueDate)}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${items.map((item, index) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      let itemTotal = quantity * unitPrice;

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
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${item.vatRate || 20}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${itemTotal.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    }).join('')}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXML(companyInfo?.name || '')}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXML(companyInfo?.address?.street || '')}</ram:LineOne>
          <ram:CityName>${escapeXML(companyInfo?.address?.city || '')}</ram:CityName>
          <ram:CountryID>${(companyInfo?.address?.country || 'FR').substring(0, 2).toUpperCase()}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXML(companyInfo?.vatNumber || '')}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXML(client?.name || '')}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXML(client?.address?.street || '')}</ram:LineOne>
          <ram:CityName>${escapeXML(client?.address?.city || '')}</ram:CityName>
          <ram:CountryID>${(client?.address?.country || 'FR').substring(0, 2).toUpperCase()}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${client?.vatNumber ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXML(client.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery></ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      ${bankDetails?.iban ? `<ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>30</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${escapeXML(bankDetails.iban)}</ram:IBANID>
          ${bankDetails.bic ? `<ram:ProprietaryID>${escapeXML(bankDetails.bic)}</ram:ProprietaryID>` : ''}
        </ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>` : ''}
      ${Object.keys(vatBreakdown).map(rate => `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${vatBreakdown[rate].amount.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${vatBreakdown[rate].base.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${rate}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`).join('')}
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
  console.log('🔍 Validation Factur-X - Données reçues:', {
    number: invoiceData.number,
    issueDate: invoiceData.issueDate,
    companyName: invoiceData.companyInfo?.name,
    companyVatNumber: invoiceData.companyInfo?.vatNumber,
    companySiret: invoiceData.companyInfo?.siret,
    clientName: invoiceData.client?.name,
    itemsCount: invoiceData.items?.length || 0,
  });

  if (!invoiceData.number) errors.push('Numéro de facture manquant');
  if (!invoiceData.issueDate) errors.push('Date d\'émission manquante');
  if (!invoiceData.companyInfo?.name) errors.push('Nom de l\'entreprise manquant');
  if (!invoiceData.companyInfo?.vatNumber) errors.push('Numéro de TVA manquant');
  if (!invoiceData.client?.name) errors.push('Nom du client manquant');
  if (!invoiceData.items || invoiceData.items.length === 0) errors.push('Aucun article dans la facture');

  // Log des erreurs détectées
  if (errors.length > 0) {
    console.warn('⚠️ Validation Factur-X échouée:');
    errors.forEach((error, index) => {
      console.warn(`  ❌ ${index + 1}. ${error}`);
    });
  } else {
    console.log('✅ Validation Factur-X réussie - Toutes les données sont présentes');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
