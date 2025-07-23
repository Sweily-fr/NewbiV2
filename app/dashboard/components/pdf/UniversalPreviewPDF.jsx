"use client";

import React from "react";

const UniversalPreviewPDF = ({ data, type = "invoice" }) => {
  if (!data) return null;

  // Données par défaut pour éviter les erreurs
  const defaultData = {
    number: "DRAFT",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    validUntil: new Date().toISOString().split("T")[0],
    items: [],
    subtotal: 0,
    totalTax: 0,
    total: 0,
    companyInfo: {
      name: "Votre Entreprise",
      address: "",
      city: "",
      postalCode: "",
      email: "",
      phone: "",
    },
    clientInfo: {
      name: "Client",
      address: "",
      city: "",
      postalCode: "",
      email: "",
    },
  };

  const documentData = { ...defaultData, ...data };
  const isInvoice = type === "invoice";

  // Formatage des devises
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Formatage des dates
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  };

  // Styles inline pour éviter les problèmes oklch
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      lineHeight: "1.4",
      color: "#000000",
      backgroundColor: "#ffffff",
      padding: "20px",
      maxWidth: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "30px",
      borderBottom: "1px solid #e5e5e5",
      paddingBottom: "20px",
    },
    logo: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#000000",
    },
    title: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#000000",
      textAlign: "right",
    },
    infoSection: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "30px",
    },
    infoBlock: {
      width: "48%",
    },
    infoTitle: {
      fontSize: "12px",
      fontWeight: "bold",
      marginBottom: "10px",
      color: "#000000",
    },
    infoContent: {
      fontSize: "11px",
      color: "#666666",
      lineHeight: "1.5",
    },
    documentInfo: {
      textAlign: "right",
      marginBottom: "30px",
    },
    documentInfoLine: {
      marginBottom: "5px",
      fontSize: "11px",
      color: "#666666",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "20px",
    },
    tableHeader: {
      backgroundColor: "#f5f5f5",
      fontWeight: "bold",
      fontSize: "11px",
      color: "#000000",
    },
    tableCell: {
      padding: "10px",
      borderBottom: "1px solid #e5e5e5",
      fontSize: "11px",
      color: "#000000",
    },
    tableCellRight: {
      padding: "10px",
      borderBottom: "1px solid #e5e5e5",
      fontSize: "11px",
      color: "#000000",
      textAlign: "right",
    },
    totalsSection: {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: "30px",
    },
    totalsTable: {
      width: "300px",
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: "1px solid #e5e5e5",
    },
    totalRowFinal: {
      display: "flex",
      justifyContent: "space-between",
      padding: "10px 0",
      borderTop: "2px solid #000000",
      fontWeight: "bold",
      fontSize: "12px",
    },
    footer: {
      marginTop: "40px",
      fontSize: "10px",
      color: "#666666",
      textAlign: "center",
      borderTop: "1px solid #e5e5e5",
      paddingTop: "20px",
    },
    notes: {
      marginTop: "20px",
      fontSize: "10px",
      color: "#666666",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          {documentData.companyInfo?.logo ? (
            <img
              src={documentData.companyInfo.logo}
              alt="Logo"
              style={{ maxHeight: "60px", maxWidth: "200px" }}
            />
          ) : (
            "newbi."
          )}
        </div>
        <div style={styles.title}>{isInvoice ? "FACTURE" : "DEVIS"}</div>
      </div>

      {/* Informations du document */}
      <div style={styles.documentInfo}>
        <div style={styles.documentInfoLine}>
          <strong>N° {documentData.number}</strong>
        </div>
        <div style={styles.documentInfoLine}>
          Date d'émission : {formatDate(documentData.date)}
        </div>
        {isInvoice ? (
          <div style={styles.documentInfoLine}>
            Date d'échéance : {formatDate(documentData.dueDate)}
          </div>
        ) : (
          <div style={styles.documentInfoLine}>
            Valide jusqu'au : {formatDate(documentData.validUntil)}
          </div>
        )}
        {documentData.purchaseOrder && (
          <div style={styles.documentInfoLine}>
            Bon de commande : {documentData.purchaseOrder}
          </div>
        )}
      </div>

      {/* Informations entreprise et client */}
      <div style={styles.infoSection}>
        <div style={styles.infoBlock}>
          <div style={styles.infoTitle}>
            {documentData.companyInfo?.name || "Votre Entreprise"}
          </div>
          <div style={styles.infoContent}>
            {documentData.companyInfo?.address && (
              <div>{documentData.companyInfo.address}</div>
            )}
            {(documentData.companyInfo?.postalCode ||
              documentData.companyInfo?.city) && (
              <div>
                {documentData.companyInfo.postalCode}{" "}
                {documentData.companyInfo.city}
              </div>
            )}
            {documentData.companyInfo?.email && (
              <div>{documentData.companyInfo.email}</div>
            )}
            {documentData.companyInfo?.phone && (
              <div>{documentData.companyInfo.phone}</div>
            )}
            {documentData.companyInfo?.siret && (
              <div>SIRET : {documentData.companyInfo.siret}</div>
            )}
            {documentData.companyInfo?.vatNumber && (
              <div>TVA : {documentData.companyInfo.vatNumber}</div>
            )}
          </div>
        </div>

        <div style={styles.infoBlock}>
          <div style={styles.infoTitle}>
            {isInvoice ? "Facturer à :" : "Devis pour :"}{" "}
            {documentData.clientInfo?.name || "Client"}
          </div>
          <div style={styles.infoContent}>
            {documentData.clientInfo?.address && (
              <div>{documentData.clientInfo.address}</div>
            )}
            {(documentData.clientInfo?.postalCode ||
              documentData.clientInfo?.city) && (
              <div>
                {documentData.clientInfo.postalCode}{" "}
                {documentData.clientInfo.city}
              </div>
            )}
            {documentData.clientInfo?.email && (
              <div>{documentData.clientInfo.email}</div>
            )}
          </div>
        </div>
      </div>

      {/* Tableau des articles */}
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th style={styles.tableCell}>Description</th>
            <th style={styles.tableCellRight}>Quantité</th>
            <th style={styles.tableCellRight}>Prix unitaire</th>
            <th style={styles.tableCellRight}>TVA</th>
            <th style={styles.tableCellRight}>Total HT</th>
          </tr>
        </thead>
        <tbody>
          {documentData.items && documentData.items.length > 0 ? (
            documentData.items.map((item, index) => (
              <tr key={index}>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: "bold" }}>{item.description}</div>
                  {item.details && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#666666",
                        marginTop: "5px",
                      }}
                    >
                      {item.details}
                    </div>
                  )}
                </td>
                <td style={styles.tableCellRight}>
                  {item.quantity} {item.unit || ""}
                </td>
                <td style={styles.tableCellRight}>
                  {formatCurrency(item.unitPrice)}
                </td>
                <td style={styles.tableCellRight}>{item.vatRate}%</td>
                <td style={styles.tableCellRight}>
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="5"
                style={{
                  ...styles.tableCell,
                  textAlign: "center",
                  color: "#666666",
                }}
              >
                Aucun article
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totaux */}
      <div style={styles.totalsSection}>
        <div style={styles.totalsTable}>
          <div style={styles.totalRow}>
            <span>Total HT</span>
            <span>{formatCurrency(documentData.subtotal)}</span>
          </div>

          {documentData.discount > 0 && (
            <div style={styles.totalRow}>
              <span>Remise</span>
              <span>-{formatCurrency(documentData.discount)}</span>
            </div>
          )}

          <div style={styles.totalRow}>
            <span>TVA</span>
            <span>{formatCurrency(documentData.totalTax)}</span>
          </div>

          <div style={styles.totalRowFinal}>
            <span>Total TTC</span>
            <span>{formatCurrency(documentData.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(documentData.headerNotes || documentData.footerNotes) && (
        <div style={styles.notes}>
          {documentData.headerNotes && (
            <div style={{ marginBottom: "15px" }}>
              <strong>Notes :</strong>
              <br />
              {documentData.headerNotes}
            </div>
          )}
          {documentData.footerNotes && (
            <div>
              <strong>Conditions :</strong>
              <br />
              {documentData.footerNotes}
            </div>
          )}
        </div>
      )}

      {/* Coordonnées bancaires */}
      {documentData.showBankDetails && documentData.bankDetails && (
        <div style={styles.notes}>
          <strong>Coordonnées bancaires :</strong>
          <br />
          {documentData.bankDetails.iban && (
            <div>IBAN : {documentData.bankDetails.iban}</div>
          )}
          {documentData.bankDetails.bic && (
            <div>BIC : {documentData.bankDetails.bic}</div>
          )}
          {documentData.bankDetails.bankName && (
            <div>Banque : {documentData.bankDetails.bankName}</div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <div>Merci pour votre confiance !</div>
        <div style={{ marginTop: "10px" }}>Page 1/1</div>
      </div>
    </div>
  );
};

export default UniversalPreviewPDF;
