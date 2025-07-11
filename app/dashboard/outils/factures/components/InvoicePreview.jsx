"use client";

import { useRef } from 'react';
import { PDFGenerator } from "./pdf-generator";

export default function InvoicePreview({ data = {}, className = '', enablePDF = true }) {
  const previewRef = useRef(null);

  // Calculate totals - utilise les données par défaut de l'image si pas de données
  const items = data.items || [
    { 
      description: 'Site web\nTest du détail', 
      quantity: 1, 
      unitPrice: 254.00, 
      taxRate: 10,
      total: 254.00 
    }
  ];
  
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const taxRate = 10; // 10% TVA comme dans l'image
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

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
        ref={previewRef} 
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
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#000',
              margin: 0
            }}>
              newbi.
            </h1>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#000',
              margin: '0 0 16px 0'
            }}>
              FACTURE
            </h2>
            <div style={{ fontSize: '10px', color: '#666' }}>
              <p style={{ margin: '2px 0' }}>N° {data.number || 'F-202505-000014'}</p>
              <p style={{ margin: '2px 0' }}>Date d'émission: {formatDate(data.issueDate) || '17-05-2025'}</p>
              <p style={{ margin: '2px 0' }}>Date d'échéance: {formatDate(data.dueDate) || '17-05-2025'}</p>
              <p style={{ margin: '2px 0' }}>Date de paiement: {formatDate(data.paymentDate) || '17-05-2025'}</p>
            </div>
          </div>
        </div>

        {/* Section Expéditeur et Destinataire */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Expéditeur (Sweily45) */}
          <div>
            <h3 style={{ 
              fontSize: '12px', 
              fontWeight: 'bold', 
              color: '#000',
              marginBottom: '8px'
            }}>
              Sweily45
            </h3>
            <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.3' }}>
              <p>contact@sweily.fr</p>
              <p>0787770012</p>
              <p>229 rue Saint-Honoré</p>
              <p>75001 Paris</p>
              <p>France</p>
              <p>SIRET: 12345678900012</p>
              <p>TVA: FR12345678909</p>
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
              <p><strong>Sweily</strong></p>
              <p>ldskfjdslf@de.de</p>
              <p>123 Avenue de la République</p>
              <p>75011 Paris</p>
              <p>France</p>
              <p>SIRET: 12345678901234</p>
              <p>TVA: FR12345678901</p>
            </div>
          </div>
        </div>

        {/* Message de remerciement */}
        <div style={{ marginBottom: '24px', fontSize: '10px' }}>
          <p>Merci de votre confiance. N'hésitez pas à nous contacter pour toute question.</p>
        </div>

        {/* Tableau des articles */}
        <div style={{ marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ 
                  padding: '8px', 
                  textAlign: 'left', 
                  fontWeight: 'bold',
                  border: '1px solid #ddd'
                }}>
                  Description
                </th>
                <th style={{ 
                  padding: '8px', 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  border: '1px solid #ddd',
                  width: '80px'
                }}>
                  Quantité
                </th>
                <th style={{ 
                  padding: '8px', 
                  textAlign: 'right', 
                  fontWeight: 'bold',
                  border: '1px solid #ddd',
                  width: '100px'
                }}>
                  Prix unitaire
                </th>
                <th style={{ 
                  padding: '8px', 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  border: '1px solid #ddd',
                  width: '60px'
                }}>
                  TVA
                </th>
                <th style={{ 
                  padding: '8px', 
                  textAlign: 'right', 
                  fontWeight: 'bold',
                  border: '1px solid #ddd',
                  width: '100px'
                }}>
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd',
                    whiteSpace: 'pre-line'
                  }}>
                    {item.description || 'Site web\nTest du détail'}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'center',
                    border: '1px solid #ddd'
                  }}>
                    {item.quantity || 1}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    border: '1px solid #ddd'
                  }}>
                    {formatCurrency(item.unitPrice || 254.00)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'center',
                    border: '1px solid #ddd'
                  }}>
                    {item.taxRate || 10}%
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    border: '1px solid #ddd'
                  }}>
                    {formatCurrency(item.total || 254.00)}
                  </td>
                </tr>
              ))}
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
                <span>Total HT</span>
                <span>{formatCurrency(subtotal)}</span>
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
            </div>
          </div>
        </div>

        {/* Conditions de paiement */}
        <div style={{ fontSize: '9px', color: '#666', lineHeight: '1.4' }}>
          <p style={{ marginBottom: '8px' }}>
            Les factures sont payables à réception, sauf accord préalable.
          </p>
          <p style={{ marginBottom: '8px' }}>
            Pas d'escompte accordé pour paiement anticipé.
          </p>
          <p style={{ marginBottom: '8px' }}>
            En cas de retard de paiement, des pénalités seront appliquées. Tout montant non réglé à l'échéance sera majoré d'un intérêt annuel de 11,13 %.
          </p>
          <p style={{ marginBottom: '8px' }}>
            Tout retard de paiement entraînera une indemnité forfaitaire pour frais de recouvrement de 40€.
          </p>
          <p>
            En cas de litige, le tribunal de commerce de (Ville) sera seul compétent.
          </p>
        </div>

        {/* Coordonnées bancaires (si activées) */}
        {data.showBankDetails && data.companyInfo?.bankDetails?.iban && (
          <div style={{ 
            marginTop: '24px', 
            paddingTop: '16px',
            borderTop: '1px solid #ddd',
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
              <div>
                <strong>IBAN:</strong><br />
                <span style={{ fontFamily: 'monospace' }}>{data.companyInfo.bankDetails.iban}</span>
              </div>
              <div>
                <strong>BIC/SWIFT:</strong><br />
                <span style={{ fontFamily: 'monospace' }}>{data.companyInfo.bankDetails.bic}</span>
              </div>
              <div>
                <strong>Banque:</strong><br />
                {data.companyInfo.bankDetails.bankName}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: '32px', 
          paddingTop: '16px',
          borderTop: '1px solid #eee',
          textAlign: 'center',
          fontSize: '9px',
          color: '#999'
        }}>
          <p style={{ marginBottom: '4px' }}>
            Nous vous remercions pour votre confiance et restons à votre disposition pour toute information complémentaire.
          </p>
          <p>Page 1/1</p>
        </div>
      </article>

      {enablePDF && (
        <div className="mt-6 flex justify-end">
          <PDFGenerator 
            contentRef={previewRef} 
            fileName={`facture-${data.number || 'brouillon'}.pdf`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            buttonText={
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Télécharger le PDF
              </>
            }
          />
        </div>
      )}
    </div>
  );
}
