'use client';

import React from 'react';

const UniversalPreviewPDF = ({ data, type = 'invoice' }) => {
  if (!data) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-sm border">
        <div className="text-center text-gray-500">
          <p>Aucune donnée disponible pour l'aperçu</p>
        </div>
      </div>
    );
  }

  const isInvoice = type === 'invoice';

  // Formatage des devises - identique au PDF
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0,00 €';
    
    const num = parseFloat(amount);
    if (isNaN(num)) return '0,00 €';
    
    // Formatage manuel pour correspondre exactement au PDF
    const formatted = num.toFixed(2).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    return parts.join(',') + ' €';
  };

  // Formatage des dates - identique au PDF
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    
    let date;
    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string' && /^\d+$/.test(dateInput)) {
      date = new Date(parseInt(dateInput, 10));
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) return '';
    
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Formatage des adresses - identique au PDF
  const formatAddress = (address) => {
    if (address && typeof address === 'object') {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.postalCode && address.city) {
        parts.push(`${address.postalCode} ${address.city}`);
      }
      if (address.country) parts.push(address.country);
      return parts.join('\n');
    }
    return '';
  };

  // Déterminer le titre du document comme dans le PDF
  const getDocumentTitle = () => {
    if (data.isDepositInvoice) {
      return 'FACTURE D\'ACOMPTE';
    }
    if (data.status === 'DRAFT') {
      return isInvoice ? 'FACTURE PROFORMA' : 'DEVIS PROFORMA';
    }
    return isInvoice ? 'FACTURE' : 'DEVIS';
  };

  return (
    <div className="w-full bg-white shadow-lg border relative" style={{ minHeight: '1123px', height: 'auto' }}>
      {/* CONTENU PRINCIPAL */}
      <div className="p-4 text-xs space-y-4 transform scale-90 origin-top-left" style={{ fontSize: '10px', lineHeight: '1.2', width: '111%', paddingBottom: '120px' }}>
          
          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div className="font-bold text-base">
              {data.companyInfo?.name || 'Votre Entreprise'}
            </div>
            <div className="text-right">
              <div className="font-bold text-lg mb-2">
                {getDocumentTitle()}
              </div>
              <div className="text-xs space-y-1">
                <div>N° {data.number || 'DRAFT-' + Math.random().toString(36).substr(2, 9)}</div>
                <div>Date d'émission: {formatDate(data.issueDate || data.date) || formatDate(new Date())}</div>
                {isInvoice ? (
                  <div>Date d'échéance: {formatDate(data.dueDate) || formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</div>
                ) : (
                  <div>Valide jusqu'au: {formatDate(data.validUntil) || formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</div>
                )}
                {data.executionDate && (
                  <div>Date d'exécution: {formatDate(data.executionDate)}</div>
                )}
                {data.purchaseOrderNumber && (
                  <div>Référence devis: {data.purchaseOrderNumber}</div>
                )}
              </div>
            </div>
          </div>
          
          {/* INFORMATIONS ENTREPRISE ET CLIENT */}
          {/* Déterminer le nombre de colonnes selon la présence d'adresse de livraison différente */}
          {(() => {
            const hasShippingAddress = data.client?.hasDifferentShippingAddress && data.client?.shippingAddress;
            const gridCols = hasShippingAddress ? 'grid-cols-3' : 'grid-cols-2';
            
            return (
              <div className={`grid ${gridCols} gap-6`}>
                {/* Informations entreprise */}
                <div>
                  <div className="font-bold text-xs mb-2">DE:</div>
                  <div className="space-y-1">
                    <div className="font-bold">{data.companyInfo?.name || 'Votre Entreprise'}</div>
                    {data.companyInfo?.address && (
                      <div className="whitespace-pre-line text-xs text-gray-600">{formatAddress(data.companyInfo.address)}</div>
                    )}
                    {data.companyInfo?.email && <div className="text-xs text-gray-600">{data.companyInfo.email}</div>}
                    {data.companyInfo?.phone && <div className="text-xs text-gray-600">{data.companyInfo.phone}</div>}
                    {data.companyInfo?.siret && <div className="text-xs text-gray-600">SIRET: {data.companyInfo.siret}</div>}
                    {data.companyInfo?.vatNumber && <div className="text-xs text-gray-600">TVA: {data.companyInfo.vatNumber}</div>}
                  </div>
                </div>

                {/* Informations client */}
                <div>
                  <div className="font-bold text-xs mb-2">À:</div>
                  <div className="space-y-1">
                    <div className="font-bold">{data.client?.name || `${data.client?.firstName || ''} ${data.client?.lastName || ''}`.trim() || 'Client'}</div>
                    {data.client?.address && (
                      <div className="whitespace-pre-line text-xs text-gray-600">{formatAddress(data.client.address)}</div>
                    )}
                    {data.client?.email && <div className="text-xs text-gray-600">{data.client.email}</div>}
                    {data.client?.phone && <div className="text-xs text-gray-600">{data.client.phone}</div>}
                    {data.client?.siret && <div className="text-xs text-gray-600">SIRET: {data.client.siret}</div>}
                    {data.client?.vatNumber && <div className="text-xs text-gray-600">TVA: {data.client.vatNumber}</div>}
                  </div>
                </div>

                {/* Adresse de livraison - seulement si différente */}
                {hasShippingAddress && (
                  <div>
                    <div className="font-bold text-xs mb-2">LIVRER À:</div>
                    <div className="space-y-1">
                      {data.client.shippingAddress.name && (
                        <div className="font-bold">{data.client.shippingAddress.name}</div>
                      )}
                      <div className="whitespace-pre-line text-xs text-gray-600">{formatAddress(data.client.shippingAddress)}</div>
                      {data.client.shippingAddress.phone && <div className="text-xs text-gray-600">{data.client.shippingAddress.phone}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* NOTES D'EN-TÊTE */}
          {data.headerNotes && (
            <div className="text-xs">
              <div className="whitespace-pre-line">{data.headerNotes}</div>
            </div>
          )}

          {/* TABLEAU DES ARTICLES */}
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                  <th style={{ padding: '8px', textAlign: 'left', width: '40%' }}>Description</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '15%' }}>Quantité</th>
                  <th style={{ padding: '8px', textAlign: 'right', width: '15%' }}>Prix unitaire</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '10%' }}>TVA</th>
                  <th style={{ padding: '8px', textAlign: 'right', width: '20%' }}>Total HT</th>
                </tr>
              </thead>
              <tbody>
                {data.items && data.items.length > 0 ? (
                  data.items.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ fontWeight: '500' }}>{item.description || ''}</div>
                        {item.details && (
                          <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>{item.details}</div>
                        )}
                        {(() => {
                          const itemDiscount = parseFloat(item.discount) || 0;
                          const discountType = item.discountType || 'percentage';
                          if (itemDiscount > 0) {
                            const discountText = discountType === 'percentage' ? 
                              `Remise: ${itemDiscount}%` : 
                              `Remise: ${formatCurrency(itemDiscount)}`;
                            return (
                              <div style={{ fontSize: '8px', color: '#0066cc', marginTop: '2px' }}>
                                {discountText}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                        {item.quantity} {item.unit || ''}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                        {item.vatRate}%
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                        {(() => {
                          const itemDiscount = parseFloat(item.discount) || 0;
                          const discountType = item.discountType || 'percentage';
                          let itemTotal = item.quantity * item.unitPrice;
                          
                          if (itemDiscount > 0) {
                            if (discountType === 'percentage') {
                              itemTotal = itemTotal * (1 - itemDiscount / 100);
                            } else {
                              itemTotal = Math.max(0, itemTotal - itemDiscount);
                            }
                          }
                          
                          return formatCurrency(itemTotal);
                        })()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#666', fontStyle: 'italic', border: '1px solid #000' }}>
                      Aucun article
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTAUX */}
          <div className="flex justify-end mt-4">
            <div className="w-64 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Total HT:</span>
                  <span>{formatCurrency(data.subtotal)}</span>
                </div>
                
                {data.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Remise:</span>
                    <span>-{formatCurrency(data.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>TVA:</span>
                  <span>{formatCurrency(data.totalTax)}</span>
                </div>
                
                <div className="flex justify-between pt-1 border-t border-gray-300 font-bold">
                  <span>Total TTC:</span>
                  <span>{formatCurrency(data.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CONDITIONS GÉNÉRALES */}
          {data.termsAndConditions && (
            <div className="mt-4 text-xs">
              <div className="whitespace-pre-line text-gray-600">{data.termsAndConditions}</div>
            </div>
          )}

      </div>
      
      {/* FOOTER FIXE EN BAS DE PAGE */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-100 p-4 transform scale-90 origin-bottom-left" style={{ width: '111%' }}>
          {/* Coordonnées bancaires */}
          {data.showBankDetails && (
            (data.bankDetails?.iban || data.bankDetails?.bic || data.bankDetails?.bankName ||
             data.companyInfo?.bankDetails?.iban || data.companyInfo?.bankDetails?.bic || data.companyInfo?.bankDetails?.bankName)
          ) && (
            <div className="mb-4">
              <div className="font-bold text-xs mb-2">Coordonnées bancaires</div>
              <div className="text-xs text-gray-600 space-y-1">
                {(data.bankDetails?.iban || data.companyInfo?.bankDetails?.iban) && (
                  <div>IBAN: {data.bankDetails?.iban || data.companyInfo?.bankDetails?.iban}</div>
                )}
                {(data.bankDetails?.bic || data.companyInfo?.bankDetails?.bic) && (
                  <div>BIC: {data.bankDetails?.bic || data.companyInfo?.bankDetails?.bic}</div>
                )}
                {(data.bankDetails?.bankName || data.companyInfo?.bankDetails?.bankName) && (
                  <div>Banque: {data.bankDetails?.bankName || data.companyInfo?.bankDetails?.bankName}</div>
                )}
              </div>
            </div>
          )}

          {/* Notes de bas de page */}
          {data.footerNotes && (
            <div className="text-xs text-gray-600 mb-4">
              <div className="whitespace-pre-line">{data.footerNotes}</div>
            </div>
          )}
          
          {/* PAGINATION - Toujours en bas */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-300">
            <div className="text-xs text-gray-500">
              Merci de votre confiance
            </div>
            <div className="text-xs text-gray-500">
              Page 1/1
            </div>
          </div>
      </div>
    </div>
  );
};

export default UniversalPreviewPDF;
