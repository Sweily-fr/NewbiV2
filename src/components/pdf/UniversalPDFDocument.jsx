import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';

// Styles pour le document PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 60,
    objectFit: 'contain',
  },
  titleSection: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    fontSize: 10,
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120,
    marginRight: 8,
  },
  infoValue: {
    flex: 1,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  addressBlock: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f3f3',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    padding: 8,
    fontSize: 9,
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    marginBottom: 5,
    fontSize: 10,
  },
  totalLabel: {
    fontWeight: 'normal',
  },
  totalValue: {
    fontWeight: 'normal',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    backgroundColor: '#f3f3f3',
    padding: 15,
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    fontSize: 9,
    marginBottom: 4,
  },
  footerLabel: {
    width: 120,
    fontWeight: 'bold',
  },
  footerValue: {
    flex: 1,
  },
  disclaimer: {
    marginTop: 15,
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  notes: {
    marginTop: 20,
    fontSize: 9,
    lineHeight: 1.5,
  },
});

const UniversalPDFDocument = ({ data, type = 'invoice' }) => {
  const isCreditNote = type === 'creditNote';
  const isQuote = type === 'quote';

  // Fonction pour formater les montants
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0,00 €';
    const num = parseFloat(amount);
    if (isNaN(num)) return '0,00 €';
    const formatted = num.toFixed(2).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',') + ' €';
  };

  // Fonction pour formater les dates
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

  // Déterminer le titre du document
  const getDocumentTitle = () => {
    if (isCreditNote) return 'Avoir';
    if (data.isDepositInvoice) return "Facture d'acompte";
    if (data.status === 'DRAFT') return isQuote ? 'Devis' : 'Facture proforma';
    return isQuote ? 'Devis' : 'Facture';
  };

  const companyInfo = data?.companyInfo || {};
  const client = data?.client || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* Logo */}
          <View>
            {companyInfo.logo && (
              <Image src={companyInfo.logo} style={styles.logo} />
            )}
          </View>

          {/* Titre et informations */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{getDocumentTitle()}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {isCreditNote ? "Numéro d'avoir" : isQuote ? 'Numéro de devis' : 'Numéro de facture'}:
              </Text>
              <Text style={styles.infoValue}>{data.number || '---'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date d'émission:</Text>
              <Text style={styles.infoValue}>{formatDate(data.issueDate || data.date)}</Text>
            </View>
            {!isCreditNote && data.dueDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {isQuote ? "Valide jusqu'au" : "Date d'échéance"}:
                </Text>
                <Text style={styles.infoValue}>{formatDate(data.dueDate || data.validUntil)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* INFORMATIONS ENTREPRISE ET CLIENT */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          {/* Entreprise */}
          <View style={[styles.section, { width: '45%' }]}>
            <Text style={styles.sectionTitle}>ÉMETTEUR</Text>
            <View style={styles.addressBlock}>
              <Text>{companyInfo.name || 'Entreprise'}</Text>
              {companyInfo.address?.street && <Text>{companyInfo.address.street}</Text>}
              {(companyInfo.address?.postalCode || companyInfo.address?.city) && (
                <Text>{companyInfo.address?.postalCode} {companyInfo.address?.city}</Text>
              )}
              {companyInfo.siret && <Text>SIRET: {companyInfo.siret}</Text>}
              {companyInfo.tva && <Text>TVA: {companyInfo.tva}</Text>}
            </View>
          </View>

          {/* Client */}
          <View style={[styles.section, { width: '45%' }]}>
            <Text style={styles.sectionTitle}>CLIENT</Text>
            <View style={styles.addressBlock}>
              <Text>{client.name || 'N/A'}</Text>
              {client.address?.street && <Text>{client.address.street}</Text>}
              {(client.address?.postalCode || client.address?.city) && (
                <Text>{client.address.postalCode} {client.address.city}</Text>
              )}
            </View>
          </View>
        </View>

        {/* TABLEAU DES ARTICLES */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Qté</Text>
            <Text style={styles.col3}>P.U. HT</Text>
            <Text style={styles.col4}>TVA</Text>
            <Text style={styles.col5}>Total HT</Text>
          </View>

          {data?.items?.map((item, index) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            let itemTotal = quantity * unitPrice;

            // Application remise article
            if (item.discount && item.discount > 0) {
              if (item.discountType === 'PERCENTAGE' || item.discountType === 'percentage') {
                itemTotal = itemTotal * (1 - Math.min(item.discount, 100) / 100);
              } else {
                itemTotal = Math.max(0, itemTotal - item.discount);
              }
            }

            return (
              <View key={index} style={styles.tableRow}>
                <View style={styles.col1}>
                  <Text>{item.description}</Text>
                  {item.details && (
                    <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
                      {item.details}
                    </Text>
                  )}
                </View>
                <Text style={styles.col2}>{quantity}</Text>
                <Text style={styles.col3}>{formatCurrency(unitPrice)}</Text>
                <Text style={styles.col4}>{item.vatRate || 20}%</Text>
                <Text style={styles.col5}>{formatCurrency(itemTotal)}</Text>
              </View>
            );
          })}
        </View>

        {/* TOTAUX */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{formatCurrency(data?.finalTotalHT || data?.totalHT || 0)}</Text>
          </View>

          {data?.discount && data.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#ff6b00' }]}>
                Remise {data.discountType === 'PERCENTAGE' ? `${data.discount}%` : ''}
              </Text>
              <Text style={[styles.totalValue, { color: '#ff6b00' }]}>
                -{formatCurrency(
                  data.discountType === 'PERCENTAGE'
                    ? (data.totalHT * data.discount) / 100
                    : data.discount
                )}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{formatCurrency(data?.totalVAT || 0)}</Text>
          </View>

          <View style={styles.grandTotal}>
            <Text>Total TTC</Text>
            <Text style={isCreditNote ? { color: '#dc2626' } : {}}>
              {formatCurrency(data?.finalTotalTTC || data?.totalTTC || 0)}
            </Text>
          </View>
        </View>

        {/* NOTES */}
        {(data?.headerNotes || data?.footerNotes) && (
          <View style={styles.notes}>
            {data.headerNotes && <Text>{data.headerNotes}</Text>}
            {data.footerNotes && <Text style={{ marginTop: 10 }}>{data.footerNotes}</Text>}
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          {/* Coordonnées bancaires */}
          {data?.showBankDetails && data?.bankDetails && type !== 'quote' && !isCreditNote && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.footerTitle}>Détails du paiement</Text>
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Nom du bénéficiaire</Text>
                <Text style={styles.footerValue}>{companyInfo.name || 'Entreprise'}</Text>
              </View>
              {data.bankDetails.bankName && (
                <View style={styles.footerRow}>
                  <Text style={styles.footerLabel}>Nom de la banque</Text>
                  <Text style={styles.footerValue}>{data.bankDetails.bankName}</Text>
                </View>
              )}
              {data.bankDetails.bic && (
                <View style={styles.footerRow}>
                  <Text style={styles.footerLabel}>BIC</Text>
                  <Text style={styles.footerValue}>{data.bankDetails.bic}</Text>
                </View>
              )}
              {data.bankDetails.iban && (
                <View style={styles.footerRow}>
                  <Text style={styles.footerLabel}>IBAN</Text>
                  <Text style={styles.footerValue}>{data.bankDetails.iban}</Text>
                </View>
              )}
            </View>
          )}

          {/* Informations légales */}
          <View>
            <Text style={{ fontSize: 9 }}>
              {companyInfo.name || 'Entreprise'}
              {companyInfo.legalForm && `, ${companyInfo.legalForm}`}
              {companyInfo.capitalSocial && ` au capital de ${companyInfo.capitalSocial}`}
              {companyInfo.rcs && ` - ${companyInfo.rcs}`}
            </Text>
          </View>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            Document généré par Newbi. Ce document doit être relu par une personne compétente. 
            Newbi ne peut être tenu responsable en cas d'erreur dans les informations fournies.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default UniversalPDFDocument;
