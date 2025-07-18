"use client";



import { INVOICE_STATUS } from "@/src/graphql/invoiceQueries";

export default function InvoicePreview({ data = {}, className = '', status }) {

  // Utilise les données du formulaire ou des valeurs par défaut pour la démo
  const items = data.items && data.items.length > 0 ? data.items : [
    { 
      description: 'Site web\nTest du détail', 
      quantity: 1, 
      unitPrice: 254.00, 
      taxRate: 10,
      total: 254.00 
    }
  ];
  
  // Calcul des totaux basé sur les données réelles du formulaire
  const calculateItemTotal = (item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const itemDiscount = parseFloat(item.discount) || 0;
    const itemDiscountType = item.discountType || 'percentage';
    
    let itemTotal = quantity * unitPrice;
    
    // Application de la remise sur l'article
    if (itemDiscount > 0) {
      if (itemDiscountType === 'percentage') {
        itemTotal = itemTotal * (1 - itemDiscount / 100);
      } else {
        itemTotal = Math.max(0, itemTotal - itemDiscount);
      }
    }
    
    return itemTotal;
  };
  
  // Calcul du sous-total HT
  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  
  // Application de la remise globale
  const globalDiscount = parseFloat(data.discount) || 0;
  const globalDiscountType = data.discountType || 'percentage';
  let discountAmount = 0;
  
  if (globalDiscount > 0) {
    if (globalDiscountType === 'percentage') {
      discountAmount = subtotal * (globalDiscount / 100);
    } else {
      discountAmount = Math.min(globalDiscount, subtotal);
    }
  }
  
  const subtotalAfterDiscount = subtotal - discountAmount;
  
  // Calcul de la TVA
  const taxAmount = items.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item);
    const itemTaxRate = parseFloat(item.taxRate) || 20;
    return sum + (itemTotal * (itemTaxRate / 100));
  }, 0) - (discountAmount * 0.2); // Approximation de la TVA sur la remise
  
  const totalAmount = subtotalAfterDiscount + taxAmount;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className={className}>
      <article 
        className="w-full max-w-4xl mx-auto bg-white text-black"
        style={{ 
          padding: '20px', 
          fontSize: '11px', 
          lineHeight: '1.4',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {/* Header avec logo newbi. et titre FACTURE */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {data.companyInfo?.logo ? (
              <img 
                src={data.companyInfo.logo} 
                alt={data.companyInfo?.name || "Logo entreprise"}
                style={{ 
                  maxHeight: '60px',
                  maxWidth: '200px',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#000',
                margin: 0
              }}>
                {data.companyInfo?.name || "Entreprise"}
              </h1>
            )}
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#000',
              margin: '0 0 16px 0'
            }}>
              {data.status === 'DRAFT' ? 'FACTURE PROFORMA' : 'FACTURE'}
            </h2>
            <div style={{ fontSize: '10px', color: '#666' }}>
              <p style={{ margin: '2px 0' }}>N° {data.number || 'DRAFT-' + Math.random().toString(36).substr(2, 9)}</p>
              <p style={{ margin: '2px 0' }}>Date d'émission: {formatDate(data.issueDate) || formatDate(new Date())}</p>
              <p style={{ margin: '2px 0' }}>Date d'échéance: {formatDate(data.dueDate) || formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</p>
              {data.executionDate && (
                <p style={{ margin: '2px 0' }}>Date d'exécution: {formatDate(data.executionDate)}</p>
              )}
              {data.purchaseOrderNumber && (
                <p style={{ margin: '2px 0' }}>Référence devis: {data.purchaseOrderNumber}</p>
              )}
              {data.isDepositInvoice && (
                <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#0066cc' }}>FACTURE D'ACOMPTE</p>
              )}
            </div>
          </div>
        </div>

        {/* Section Expéditeur, Destinataire et Livraison */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Expéditeur (Informations de l'entreprise) */}
          <div>
            <h3 style={{ 
              fontSize: '12px', 
              fontWeight: 'bold', 
              color: '#000',
              marginBottom: '8px'
            }}>
              {data.companyInfo?.name || 'Votre Entreprise'}
            </h3>
            <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.3' }}>
              <p>{data.companyInfo?.email || 'Non renseigné'}</p>
              <p>{data.companyInfo?.phone || 'Non renseigné'}</p>
              
              {/* Affichage de l'adresse - toujours visible */}
              {typeof data.companyInfo?.address === 'string' ? (
                <p style={{ whiteSpace: 'pre-line' }}> {data.companyInfo.address || 'Non renseignée'}</p>
              ) : (
                <>
                  <p>{data.companyInfo?.address?.street || 'Non renseignée'}</p>
                  <p>{data.companyInfo?.address?.postalCode || data.companyInfo?.address?.zipCode || 'Non renseigné'} {data.companyInfo?.address?.city || 'Non renseignée'}, {data.companyInfo?.address?.country || 'Non renseigné'}</p>
                </>
              )}
              
              {/* Affichage des informations légales - toujours visibles */}
              <p>SIRET: {data.companyInfo?.siret || 'Non renseigné'}</p>
              <p>TVA: {data.companyInfo?.vatNumber || 'Non renseigné'}</p>
              <p>{data.companyInfo?.website || 'Non renseigné'}</p>
            </div>
          </div>

          {/* Destinataire (Facturer à) */}
          <div>
            <h3 style={{ 
              fontSize: '12px', 
              fontWeight: 'bold', 
              color: '#000',
              marginBottom: '8px'
            }}>
              Facturer à :
            </h3>
            <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.3' }}>
              {data.client ? (
                <>
                  <p><strong>{data.client.name || `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim()}</strong></p>
                  {data.client.email && <p>{data.client.email}</p>}
                  {data.client.address && (
                    <>
                      {data.client.address.street && <p>{data.client.address.street}</p>}
                      {data.client.address.city && (
                        <p>{data.client.address.postalCode} {data.client.address.city}</p>
                      )}
                      {data.client.address.country && <p>{data.client.address.country}</p>}
                    </>
                  )}
                  {data.client.siret && <p>SIRET: {data.client.siret}</p>}
                  {data.client.vatNumber && <p>TVA: {data.client.vatNumber}</p>}
                </>
              ) : (
                <p style={{ fontStyle: 'italic', color: '#999' }}>Aucun client sélectionné</p>
              )}
            </div>
          </div>

          {/* Adresse de livraison */}
          <div>
            {data.client && data.client.hasDifferentShippingAddress && data.client.shippingAddress ? (
              <>
                <h3 style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  color: '#000',
                  marginBottom: '8px'
                }}>
                  Livrer à :
                </h3>
                <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.3' }}>
                  <p><strong>{data.client.name || `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim()}</strong></p>
                  {data.client.shippingAddress.street && <p>{data.client.shippingAddress.street}</p>}
                  {data.client.shippingAddress.city && (
                    <p>{data.client.shippingAddress.postalCode} {data.client.shippingAddress.city}</p>
                  )}
                  {data.client.shippingAddress.country && <p>{data.client.shippingAddress.country}</p>}
                </div>
              </>
            ) : (
              <div style={{ minHeight: '20px' }}></div>
            )}
          </div>
        </div>

        {/* Notes d'en-tête */}
        {data.headerNotes && (
          <div style={{ marginBottom: '24px', fontSize: '10px' }}>
            <p style={{ whiteSpace: 'pre-line' }}>{data.headerNotes}</p>
          </div>
        )}

        {/* Tableau des articles */}
        <div style={{ marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#000000' }}>
                <th style={{ 
                  padding: '8px', 
                  textAlign: 'left', 
                  fontWeight: 'bold',
                  color: '#ffffff'
                }}>
                  Description
                </th>
                <th style={{ 
                  padding: '8px', 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  width: '80px',
                  color: '#ffffff'
                }}>
                  Quantité
                </th>
                <th style={{ 
                  padding: '8px', 
                  textAlign: 'right', 
                  fontWeight: 'bold',
                  width: '100px',
                  color: '#ffffff'
                }}>
                  Prix unitaire
                </th>
                <th style={{ 
                  padding: '8px', 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  width: '60px',
                  color: '#ffffff'
                }}>
                  TVA
                </th>
                <th style={{ 
                  padding: '8px', 
                  textAlign: 'right', 
                  fontWeight: 'bold',
                  width: '100px',
                  color: '#ffffff'
                }}>
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const itemTotal = calculateItemTotal(item);
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 4px', fontSize: '10px', verticalAlign: 'top' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{item.description || 'Article sans nom'}</div>
                        {item.details && (
                          <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                            {item.details}
                          </div>
                        )}
                        {item.discount > 0 && (
                          <div style={{ fontSize: '9px', color: '#0066cc', marginTop: '2px' }}>
                            Remise: {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                          </div>
                        )}
                        {item.vatExemptionText && (
                          <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                            {item.vatExemptionText}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px 4px', fontSize: '10px', textAlign: 'center' }}>
                      {item.quantity || 1} {item.unit || ''}
                    </td>
                    <td style={{ padding: '8px 4px', fontSize: '10px', textAlign: 'right' }}>
                      {formatCurrency(item.unitPrice || 0)}
                    </td>
                    <td style={{ padding: '8px 4px', fontSize: '10px', textAlign: 'center' }}>
                      {item.taxRate || 20}%
                    </td>
                    <td style={{ padding: '8px 4px', fontSize: '10px', textAlign: 'right' }}>
                      {formatCurrency(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '200px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '4px 0',
                fontSize: '10px'
              }}>
                <span>Sous-total HT</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '4px 0',
                  fontSize: '10px',
                  color: '#0066cc'
                }}>
                  <span>Remise {globalDiscountType === 'percentage' ? `(${globalDiscount}%)` : ''}</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '4px 0',
                fontSize: '10px'
              }}>
                <span>Total HT</span>
                <span>{formatCurrency(subtotalAfterDiscount)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '4px 0',
                fontSize: '10px'
              }}>
                <span>TVA</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 0',
                fontSize: '11px',
                fontWeight: 'bold',
                borderTop: '1px solid #000'
              }}>
                <span>Total TTC</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              
              {/* Champs personnalisés intégrés dans les totaux */}
              {data.customFields && data.customFields.length > 0 && (
                data.customFields.map((field, index) => {
                  // Debug: Afficher la structure des champs personnalisés
                  console.log('InvoicePreview - Custom field:', field);
                  console.log('InvoicePreview - field.label:', field.label);
                  console.log('InvoicePreview - field.value:', field.value);
                  console.log('InvoicePreview - field.name:', field.name);
                  console.log('InvoicePreview - field keys:', Object.keys(field));
                  
                  return (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '4px 0',
                      fontSize: '10px',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      <span>{field.label || field.name || `Champ ${index + 1}`}</span>
                      <span>{field.value}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Conditions générales */}
        {data.termsAndConditions && (
          <div style={{ 
            fontSize: '9px', 
            color: '#666', 
            lineHeight: '1.4',
            marginBottom: '24px'
          }}>
            <div style={{ whiteSpace: 'pre-line' }}>
              {data.termsAndConditions}
            </div>
          </div>
        )}

        {/* Section Footer avec fond gris */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          marginTop: '24px',
          borderRadius: '4px'
        }}>
          {/* Coordonnées bancaires (si activées) */}
          {data.showBankDetails && (
            (data.bankDetails?.iban || data.bankDetails?.bic || data.bankDetails?.bankName) ||
            (data.companyInfo?.bankDetails?.iban || data.companyInfo?.bankDetails?.bic || data.companyInfo?.bankDetails?.bankName)
          ) && (
            <div style={{ 
              marginBottom: '24px',
              paddingTop: '0px',
              fontSize: '9px',
              color: '#666'
            }}>
              <h4 style={{ 
                fontSize: '10px', 
                fontWeight: 'bold', 
                color: '#000',
                marginBottom: '8px',
                textAlign: 'left'
              }}>
                Coordonnées bancaires
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                fontSize: '9px',
                lineHeight: '1.3'
              }}>
                {(data.bankDetails?.iban || data.companyInfo?.bankDetails?.iban) && (
                  <div>
                    <strong>IBAN:</strong><br />
                    <span style={{ fontFamily: 'monospace' }}>
                      {data.bankDetails?.iban || data.companyInfo?.bankDetails?.iban}
                    </span>
                  </div>
                )}
                {(data.bankDetails?.bic || data.companyInfo?.bankDetails?.bic) && (
                  <div>
                    <strong>BIC/SWIFT:</strong><br />
                    <span style={{ fontFamily: 'monospace' }}>
                      {data.bankDetails?.bic || data.companyInfo?.bankDetails?.bic}
                    </span>
                  </div>
                )}
                {(data.bankDetails?.bankName || data.companyInfo?.bankDetails?.bankName) && (
                  <div>
                    <strong>Banque:</strong><br />
                    {data.bankDetails?.bankName || data.companyInfo?.bankDetails?.bankName}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Séparateur */}
          {(data.showBankDetails && (
            (data.bankDetails?.iban || data.bankDetails?.bic || data.bankDetails?.bankName) ||
            (data.companyInfo?.bankDetails?.iban || data.companyInfo?.bankDetails?.bic || data.companyInfo?.bankDetails?.bankName)
          )) && (
            <div style={{ 
              marginTop: '16px', 
              marginBottom: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #ddd'
            }}>
            </div>
          )}

          {/* Notes de bas de page */}
          {data.footerNotes && (
            <div style={{ 
              fontSize: '9px', 
              color: '#666', 
              lineHeight: '1.4',
              marginBottom: '16px'
            }}>
              <p style={{ whiteSpace: 'pre-line' }}>{data.footerNotes}</p>
            </div>
          )}

          {/* Numéro de page */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: '9px',
            color: '#999',
            marginTop: '8px'
          }}>
            <p>Page 1/1</p>
          </div>
        </div>
      </article>
    </div>
  );
}
