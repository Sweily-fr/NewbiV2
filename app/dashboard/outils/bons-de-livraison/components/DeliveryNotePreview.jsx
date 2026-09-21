"use client";

import React from "react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { generateDynamicFooter } from "@/src/utils/document-suggestions";
import { getDraftEffectiveDates } from "@/src/utils/dateFormatter";
import { DELIVERY_NOTE_STATUS_LABELS } from "@/src/graphql/deliveryNoteQueries";

/**
 * Aperçu A4 d'un bon de livraison (écran et PDF).
 *
 * Reprend le gabarit visuel d'UniversalPreviewPDF (794px = 210mm, en-tête,
 * blocs entreprise / client, tableau, pied de page) mais SANS AUCUNE colonne
 * prix / TVA / total : un BL atteste la remise de marchandises, il liste des
 * produits et des quantités. Porte les marqueurs data-pdf-* exploités par la
 * génération PDF vectorielle (src/lib/vectorPdf.js).
 */
const stripHtml = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
};

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
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatQuantity = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatAddress = (address) => {
  if (!address) return "";
  if (typeof address === "string") return address;
  const parts = [];
  if (address.street) parts.push(String(address.street));
  if (address.postalCode && address.city) {
    parts.push(`${address.postalCode} ${address.city}`);
  } else if (address.city) {
    parts.push(String(address.city));
  }
  if (address.country) parts.push(String(address.country));
  return parts.join("\n");
};

const DeliveryNotePreview = ({
  data,
  forPDF = false,
  recalcDraftDates = false,
}) => {
  const { organization } = useWorkspace();

  if (!data) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-sm border">
        <div className="text-center text-gray-500">
          <p>Aucune donnée disponible pour l'aperçu</p>
        </div>
      </div>
    );
  }

  const sellerLegalForm =
    data.companyInfo?.legalForm ||
    data.companyInfo?.companyStatus ||
    organization?.legalForm ||
    "";
  const isEntrepreneurIndividuel = [
    "EI",
    "Auto-entrepreneur",
    "AUTO_ENTREPRENEUR",
  ].includes(sellerLegalForm);
  const displayedCompanyName = (() => {
    const name = data.companyInfo?.name || "";
    if (isEntrepreneurIndividuel && name && !/^EI\b/.test(name.trim())) {
      return `EI ${name}`;
    }
    return name;
  })();

  const resolvedCompanyInfo = {
    ...data.companyInfo,
    vatFranchise: data.companyInfo?.vatFranchise ?? organization?.vatFranchise,
  };

  const rawCompanyLogo = data.companyInfo?.logo || organization?.logo;
  const companyLogo = rawCompanyLogo
    ? `${rawCompanyLogo}${rawCompanyLogo.includes("?") ? "&" : "?"}v=2`
    : rawCompanyLogo;

  const isClientForeign = (() => {
    if (data.client?.isInternational === true) return true;
    const country = String(data.client?.address?.country || "")
      .trim()
      .toLowerCase();
    return country !== "" && country !== "france" && country !== "fr";
  })();

  // Brouillon repris plus tard : dates recalées à l'écran (jamais pour le PDF)
  const draftDates =
    recalcDraftDates && data.status === "DRAFT"
      ? getDraftEffectiveDates(data.issueDate, data.deliveryDate)
      : null;
  const effectiveIssueDate = draftDates?.changed
    ? draftDates.issue.effective
    : data.issueDate;
  const effectiveDeliveryDate = draftDates?.changed
    ? draftDates.second.effective
    : data.deliveryDate;

  const documentNumber = (() => {
    const prefix = data.prefix?.trim();
    const number = data.number?.trim();
    if (data.status === "DRAFT" && (!number || /^DRAFT-/.test(number))) {
      return prefix ? `${prefix}-…` : "Brouillon";
    }
    if (prefix && number) return `${prefix}-${number}`;
    if (number) return number;
    return prefix || "BL-202609-0001";
  })();

  const headerBg = data.appearance?.headerBgColor || "#000000";
  const headerText = data.appearance?.headerTextColor || "#FFFFFF";

  // Adresse de livraison : celle du document, sinon celle du client
  const deliveryAddress =
    data.deliveryAddress && (data.deliveryAddress.street || data.deliveryAddress.city)
      ? data.deliveryAddress
      : data.client?.hasDifferentShippingAddress && data.client?.shippingAddress
        ? data.client.shippingAddress
        : null;

  const hasReception =
    data.receivedBy || data.receivedAt || data.signatureDataUrl;
  const items = data.items || [];
  const hasPartialQuantities = items.some(
    (item) =>
      item.orderedQuantity != null &&
      item.deliveredQuantity != null &&
      Number(item.orderedQuantity) !== Number(item.deliveredQuantity),
  );

  return (
    <div>
      <div
        data-pdf-content
        className={`w-full bg-white relative flex flex-col ${forPDF ? "min-h-[1123px]" : "shadow-lg min-h-screen"}`}
        style={{
          color: data.appearance?.textColor || "#000000",
          fontSize: "10px",
          ...(forPDF && {
            minHeight: "1123px",
            display: "flex",
            flexDirection: "column",
          }),
        }}
        data-pdf-document="true"
        data-pdf-root
      >
        <div
          className="px-14 pt-10 pb-4 relative flex-grow"
          data-pdf-content="true"
          data-pdf-section="body"
          style={forPDF ? { paddingBottom: "16px" } : {}}
        >
          {/* EN-TÊTE */}
          <div
            className="flex justify-between items-start mb-6"
            data-pdf-section="header"
            data-no-break
            data-critical
          >
            <div className="flex-shrink-0">
              {companyLogo && (
                <img
                  src={companyLogo}
                  alt="Logo entreprise"
                  className="h-20 w-auto object-contain"
                  style={{ maxWidth: "150px" }}
                />
              )}
            </div>

            <div className="text-right mb-6">
              <div className="text-3xl font-medium dark:text-[#0A0A0A] mb-2">
                Bon de livraison
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1" style={{ fontSize: "10px" }}>
                  <span className="font-medium dark:text-[#0A0A0A]">
                    Numéro de BL :
                  </span>
                  <span className="dark:text-[#0A0A0A]">{documentNumber}</span>
                </div>
                <div className="flex gap-1" style={{ fontSize: "10px" }}>
                  <span className="font-medium dark:text-[#0A0A0A]">
                    Date d'émission :
                  </span>
                  <span className="dark:text-[#0A0A0A]">
                    {formatDate(effectiveIssueDate) || formatDate(new Date())}
                  </span>
                </div>
                {effectiveDeliveryDate && (
                  <div className="flex gap-1" style={{ fontSize: "10px" }}>
                    <span className="font-medium dark:text-[#0A0A0A]">
                      Date de livraison :
                    </span>
                    <span className="dark:text-[#0A0A0A]">
                      {formatDate(effectiveDeliveryDate)}
                    </span>
                  </div>
                )}
                {data.sourceQuote?.number && (
                  <div className="flex gap-1" style={{ fontSize: "10px" }}>
                    <span className="font-medium dark:text-[#0A0A0A]">
                      Devis :
                    </span>
                    <span className="dark:text-[#0A0A0A]">
                      {data.sourceQuote.prefix
                        ? `${data.sourceQuote.prefix}-${data.sourceQuote.number}`
                        : data.sourceQuote.number}
                    </span>
                  </div>
                )}
                {data.sourceInvoice?.number && (
                  <div className="flex gap-1" style={{ fontSize: "10px" }}>
                    <span className="font-medium dark:text-[#0A0A0A]">
                      Facture :
                    </span>
                    <span className="dark:text-[#0A0A0A]">
                      {data.sourceInvoice.prefix
                        ? `${data.sourceInvoice.prefix}-${data.sourceInvoice.number}`
                        : data.sourceInvoice.number}
                    </span>
                  </div>
                )}
                {!forPDF && data.status && data.status !== "DRAFT" && (
                  <div className="flex gap-1" style={{ fontSize: "10px" }}>
                    <span className="font-medium dark:text-[#0A0A0A]">
                      Statut :
                    </span>
                    <span className="dark:text-[#0A0A0A]">
                      {DELIVERY_NOTE_STATUS_LABELS[data.status] || data.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ENTREPRISE / CLIENT / LIVRAISON */}
          <div
            className="grid grid-cols-3 gap-4 mb-6"
            data-pdf-section="info"
            data-no-break
            data-critical
          >
            <div data-no-break>
              <div
                className="font-medium mb-2 dark:text-[#0A0A0A]"
                style={{ fontSize: "10px" }}
              >
                {displayedCompanyName}
                {data.companyInfo?.commercialName && (
                  <div className="font-normal dark:text-[#0A0A0A]">
                    {data.companyInfo.commercialName}
                  </div>
                )}
              </div>
              <div className="font-normal" style={{ fontSize: "10px" }}>
                {data.companyInfo?.address && (
                  <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                    {formatAddress(data.companyInfo.address)}
                  </div>
                )}
                {data.companyInfo?.siren && (
                  <div className="dark:text-[#0A0A0A]">
                    SIREN: {data.companyInfo.siren}
                  </div>
                )}
                {data.companyInfo?.phone && (
                  <div className="dark:text-[#0A0A0A]">
                    {data.companyInfo.phone}
                  </div>
                )}
                {data.companyInfo?.email && (
                  <div className="dark:text-[#0A0A0A]">
                    {data.companyInfo.email}
                  </div>
                )}
              </div>
            </div>

            {(data.client?.name ||
              data.client?.firstName ||
              data.client?.lastName) && (
              <div
                className={
                  !deliveryAddress && data.clientPositionRight
                    ? "col-start-3 text-right"
                    : ""
                }
              >
                <div
                  className="font-medium mb-2 dark:text-[#0A0A0A]"
                  style={{ fontSize: "10px" }}
                >
                  {data.client?.name ||
                    `${data.client?.firstName || ""} ${data.client?.lastName || ""}`.trim()}
                </div>
                <div className="font-normal" style={{ fontSize: "10px" }}>
                  {data.client?.address && (
                    <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                      {formatAddress(data.client.address)}
                    </div>
                  )}
                  {data.client?.siret && (
                    <div className="dark:text-[#0A0A0A]">
                      {isClientForeign
                        ? data.client.siret
                        : `SIREN: ${data.client.siret.replace(/\D/g, "").slice(0, 9)}`}
                    </div>
                  )}
                  {data.client?.email && (
                    <div className="dark:text-[#0A0A0A]">
                      {data.client.email}
                    </div>
                  )}
                </div>
              </div>
            )}

            {deliveryAddress && (
              <div>
                <div
                  className="font-medium mb-2 dark:text-[#0A0A0A]"
                  style={{ fontSize: "10px" }}
                >
                  Adresse de livraison
                </div>
                <div className="font-normal" style={{ fontSize: "10px" }}>
                  {deliveryAddress.fullName && (
                    <div className="dark:text-[#0A0A0A]">
                      {deliveryAddress.fullName}
                    </div>
                  )}
                  <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                    {formatAddress(deliveryAddress)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TRANSPORT */}
          {(data.carrier || data.trackingNumber) && (
            <div
              className="mb-4 grid grid-cols-3 gap-4 rounded"
              data-pdf-section="transport"
              data-no-break
              style={{
                fontSize: "10px",
                backgroundColor: "#F5F5F5",
                padding: "8px 10px",
              }}
            >
              {data.carrier && (
                <div>
                  <span className="font-medium dark:text-[#0A0A0A]">
                    Transporteur :{" "}
                  </span>
                  <span className="dark:text-[#0A0A0A]">{data.carrier}</span>
                </div>
              )}
              {data.trackingNumber && (
                <div>
                  <span className="font-medium dark:text-[#0A0A0A]">
                    N° de suivi :{" "}
                  </span>
                  <span className="dark:text-[#0A0A0A]">
                    {data.trackingNumber}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* NOTES D'EN-TÊTE */}
          {data.headerNotes && (
            <div
              className="mb-4 text-[10px] dark:text-[#0A0A0A] whitespace-pre-wrap break-words"
              data-pdf-section="header-notes"
              data-no-break
            >
              {data.headerNotes}
            </div>
          )}

          {/* ARTICLES (jamais de prix) */}
          <div className="mb-6" data-pdf-section="items">
            <table className="w-full border-collapse text-xs border-b border-[#CCCCCC]">
              <thead data-pdf-table-header data-repeat-on-page data-no-break>
                <tr style={{ backgroundColor: headerBg }}>
                  <th
                    className="py-2 px-2 text-left text-[10px] font-medium"
                    style={{ color: headerText, width: "16%" }}
                  >
                    Référence
                  </th>
                  <th
                    className="py-2 px-2 text-left text-[10px] font-medium"
                    style={{
                      color: headerText,
                      width: hasPartialQuantities ? "48%" : "60%",
                    }}
                  >
                    Désignation
                  </th>
                  {hasPartialQuantities && (
                    <th
                      className="py-2 px-2 text-right text-[10px] font-medium"
                      style={{
                        color: headerText,
                        width: "12%",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Qté commandée
                    </th>
                  )}
                  <th
                    className="py-2 px-2 text-right text-[10px] font-medium"
                    style={{
                      color: headerText,
                      width: "12%",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hasPartialQuantities ? "Qté livrée" : "Quantité"}
                  </th>
                  <th
                    className="py-2 px-2 text-left text-[10px] font-medium"
                    style={{ color: headerText, width: "12%" }}
                  >
                    Unité
                  </th>
                </tr>
              </thead>
              <tbody className="text-[10px]" data-pdf-items-body>
                {items.length > 0 ? (
                  items.map((item, index) => {
                    const delivered =
                      item.deliveredQuantity != null
                        ? item.deliveredQuantity
                        : item.quantity;
                    const ordered =
                      item.orderedQuantity != null
                        ? item.orderedQuantity
                        : item.quantity;
                    return (
                      <tr
                        key={index}
                        className={`border-b border-[#CCCCCC] no-break ${index === items.length - 1 ? "border-b-2" : ""}`}
                        data-no-break="true"
                        data-pdf-item
                        data-item-index={index}
                        style={{
                          pageBreakInside: "avoid",
                          breakInside: "avoid",
                        }}
                      >
                        <td className="pt-3 pb-3 px-2 dark:text-[#0A0A0A] align-top">
                          {item.reference || "—"}
                        </td>
                        <td
                          className="pt-3 pb-3 px-2 dark:text-[#0A0A0A] align-top"
                          style={{
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                          }}
                        >
                          <div className="text-xs font-normal dark:text-[#0A0A0A] whitespace-pre-line break-words">
                            {item.description || ""}
                          </div>
                          {item.details && (
                            <div className="text-[10px] text-gray-600 mt-1 dark:text-[#0A0A0A] whitespace-pre-line break-words">
                              {stripHtml(item.details)}
                            </div>
                          )}
                        </td>
                        {hasPartialQuantities && (
                          <td className="pt-3 pb-3 px-2 text-right dark:text-[#0A0A0A] align-top">
                            {formatQuantity(ordered)}
                          </td>
                        )}
                        <td className="pt-3 pb-3 px-2 text-right dark:text-[#0A0A0A] align-top">
                          {formatQuantity(delivered)}
                        </td>
                        <td className="pt-3 pb-3 px-2 dark:text-[#0A0A0A] align-top">
                          {item.unit || ""}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={hasPartialQuantities ? 5 : 4}
                      className="py-6 text-center text-gray-400"
                    >
                      Aucun article
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div
              className="mt-2 text-right text-[10px] dark:text-[#0A0A0A]"
              data-no-break
            >
              {items.length} ligne{items.length > 1 ? "s" : ""} ·{" "}
              {formatQuantity(
                items.reduce(
                  (sum, item) =>
                    sum +
                    (parseFloat(
                      item.deliveredQuantity != null
                        ? item.deliveredQuantity
                        : item.quantity,
                    ) || 0),
                  0,
                ),
              )}{" "}
              unité(s) livrée(s)
            </div>
          </div>

          {/* REMARQUES DE LIVRAISON */}
          {data.notes && (
            <div
              className="mb-4 text-[10px] dark:text-[#0A0A0A] whitespace-pre-wrap break-words"
              data-pdf-section="notes"
              data-no-break
            >
              <div className="font-medium mb-1">Remarques</div>
              {data.notes}
            </div>
          )}

          {/* CHAMPS PERSONNALISÉS */}
          {data.customFields && data.customFields.length > 0 && (
            <div
              className="mb-4 text-[10px] dark:text-[#0A0A0A]"
              data-pdf-section="custom-fields"
              data-no-break
            >
              {data.customFields
                .filter((f) => (f.key || f.name) && f.value)
                .map((field, index) => (
                  <div key={index}>
                    <span className="font-medium">{field.key || field.name} : </span>
                    <span>{field.value}</span>
                  </div>
                ))}
            </div>
          )}

          {/* RÉCEPTION / SIGNATURE */}
          <div
            className="mt-8 grid grid-cols-2 gap-6"
            data-pdf-section="reception"
            data-no-break
            style={{ fontSize: "10px" }}
          >
            <div>
              <div className="font-medium mb-2 dark:text-[#0A0A0A]">
                Réception des marchandises
              </div>
              <div className="dark:text-[#0A0A0A]">
                Nom du réceptionnaire :{" "}
                <span className="font-normal">
                  {data.receivedBy || "______________________"}
                </span>
              </div>
              <div className="dark:text-[#0A0A0A] mt-1">
                Date de réception :{" "}
                <span className="font-normal">
                  {formatDate(data.receivedAt) || "____ / ____ / ________"}
                </span>
              </div>
              {!hasReception && (
                <div className="text-gray-500 mt-2">
                  Marchandises reçues en bon état, sauf réserves mentionnées
                  ci-dessous.
                </div>
              )}
            </div>
            <div>
              <div className="font-medium mb-2 dark:text-[#0A0A0A]">
                Signature du client
              </div>
              <div
                className="rounded border border-dashed border-[#CCCCCC] flex items-center justify-center"
                style={{ height: "70px", backgroundColor: "#FAFAFA" }}
              >
                {data.signatureDataUrl ? (
                  <img
                    src={data.signatureDataUrl}
                    alt="Signature du client"
                    style={{ maxHeight: "64px", maxWidth: "100%" }}
                  />
                ) : (
                  <span className="text-gray-400">Signature et cachet</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PIED DE PAGE */}
        <div
          className="mt-auto px-14 pb-6 pt-2"
          data-pdf-section="footer"
          data-no-break
        >
          {data.footerNotes && (
            <div className="py-4 text-[10px]" data-pdf-section="footer-notes">
              {data.footerNotes.split("\n").map((line, index) =>
                line.trim() ? (
                  <div
                    key={index}
                    className="dark:text-[#0A0A0A] text-[10px] whitespace-pre-wrap break-words"
                  >
                    {line}
                  </div>
                ) : (
                  <div key={index} style={{ height: "0.5em" }} />
                ),
              )}
            </div>
          )}
          <div
            className={`text-[10px] dark:text-[#0A0A0A] whitespace-pre-line ${
              data.footerNotes ? "border-t pt-2" : "pt-2"
            }`}
          >
            {generateDynamicFooter(resolvedCompanyInfo)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryNotePreview;
