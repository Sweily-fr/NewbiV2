import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

/**
 * Dialogues « Nouvelle analyse OCR » (factures d'achat et importées) : date
 * d'émission relue (l'API la nomme invoiceDate), cases et compteur fidèles à
 * ce qui part à l'enregistrement en mode « Modifier », aperçu du justificatif
 * ouvert d'office sur écran large seulement.
 */

// Volet d'aperçu remplacé par un témoin (pas d'iframe) : seul compte qu'il
// soit ouvert ou non.
vi.mock("@/src/components/document-preview-panel", () => ({
  DocumentPreviewPanel: ({ items }) =>
    items.length > 0 ? <div data-testid="apercu" /> : null,
  DocumentEyeButton: ({ onClick }) => (
    <button type="button" aria-label="Aperçu" onClick={onClick} />
  ),
  isDocumentPreviewTarget: () => false,
}));
// Sélecteur de catégorie du mode « Modifier » : hors sujet ici
vi.mock("@/src/components/category-search-select", () => ({
  default: () => null,
}));

import { PurchaseOcrComparisonDialog } from "@/app/dashboard/outils/factures-achat/components/ocr-comparison-dialog";
import { OcrComparisonDialog } from "@/app/dashboard/outils/factures/components/ocr-comparison-dialog";

// Largeur d'écran pilotée : large (≥ 768 px) ou étroit
let wide = true;
const originalMatchMedia = window.matchMedia;
beforeEach(() => {
  wide = true;
  window.matchMedia = (query) => ({
    matches: query.includes("min-width: 768px") ? wide : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
});
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

const rowOf = (label) => screen.getByText(label).closest("tr");
const checkbox = (label) => within(rowOf(label)).getByRole("checkbox");
const isChecked = (label) =>
  checkbox(label).getAttribute("aria-checked") === "true";
const saveButton = () => screen.getByRole("button", { name: /^Enregistrer/ });
const typeIn = (label, role, value) =>
  fireEvent.change(within(rowOf(label)).getByRole(role), {
    target: { value },
  });

describe("PurchaseOcrComparisonDialog", () => {
  // Formulaire du tiroir (chaînes)
  const current = {
    supplierName: "Meta",
    invoiceNumber: "F-1",
    issueDate: "2026-09-01",
    dueDate: "",
    amountHT: "100",
    amountTVA: "20",
    vatRate: "20",
    vatLines: [],
    amountTTC: "120",
    currency: "EUR",
    category: "OTHER",
    paymentMethod: "",
  };
  // Proposition telle que renvoyée par l'API (date d'émission = invoiceDate)
  const proposal = {
    supplierName: "Meta Platforms",
    invoiceNumber: "F-1",
    invoiceDate: "2026-09-15T00:00:00.000Z",
    dueDate: null,
    amountHT: 100,
    amountTVA: 20,
    vatRate: 20,
    vatBreakdown: [],
    amountTTC: 120,
    currency: "EUR",
    category: null,
    paymentMethod: null,
    confidence: 0.9,
  };
  const renderDialog = (props = {}) =>
    render(
      <PurchaseOcrComparisonDialog
        open
        onOpenChange={() => {}}
        current={current}
        proposal={proposal}
        currency="EUR"
        onApply={() => {}}
        {...props}
      />,
    );

  it("relance d'un fichier : propose la date d'émission et l'enregistre en issueDate", () => {
    const onApply = vi.fn();
    renderDialog({ onApply });
    expect(
      within(rowOf("Date d'émission")).getByText("15/09/2026"),
    ).toBeInTheDocument();
    expect(isChecked("Date d'émission")).toBe(true);
    expect(saveButton()).toHaveTextContent("Enregistrer 2 valeurs");
    fireEvent.click(saveButton());
    expect(onApply).toHaveBeenCalledWith({
      supplierName: "Meta Platforms",
      issueDate: "2026-09-15",
    });
  });

  it("mode Modifier : la date relue pré-remplit le champ", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    expect(
      within(rowOf("Date d'émission")).getByRole("button", {
        name: "15/09/2026",
      }),
    ).toBeInTheDocument();
  });

  it("date AAAA-MM-JJ identique à l'actuelle : ligne inchangée, non cochée", () => {
    renderDialog({ proposal: { ...proposal, invoiceDate: "2026-09-01" } });
    // Valeur actuelle et nouvelle analyse
    expect(
      within(rowOf("Date d'émission")).getAllByText("01/09/2026"),
    ).toHaveLength(2);
    expect(isChecked("Date d'émission")).toBe(false);
    expect(checkbox("Date d'émission")).toBeDisabled();
    expect(saveButton()).toHaveTextContent("Enregistrer 1 valeur");
  });

  it("relance de tous les justificatifs : date combinée puis celle du fichier choisi", () => {
    const fileProposal = {
      ...proposal,
      invoiceDate: "2026-09-20T00:00:00.000Z",
    };
    const multi = {
      files: [
        {
          fileId: "f1",
          filename: "facture-meta.pdf",
          ok: true,
          error: null,
          proposal: fileProposal,
          convertedAmountHT: null,
          convertedAmountTVA: null,
          convertedAmountTTC: null,
          rate: null,
          rateDate: null,
          duplicateOf: null,
        },
      ],
      combined: proposal,
      distinctCount: 1,
      conversionMethod: "none",
      conversionNote: null,
    };
    renderDialog({ multi });
    expect(
      within(rowOf("Date d'émission")).getByText("15/09/2026"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("facture-meta.pdf"));
    expect(
      within(rowOf("Date d'émission")).getByText("20/09/2026"),
    ).toBeInTheDocument();
  });

  it("mode Modifier : un champ vidé n'est ni coché ni compté, le bouton se désactive", () => {
    const onApply = vi.fn();
    // Seule différence : le fournisseur
    renderDialog({
      onApply,
      proposal: { ...proposal, invoiceDate: "2026-09-01" },
    });
    expect(saveButton()).toHaveTextContent("Enregistrer 1 valeur");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    typeIn("Fournisseur", "textbox", "");
    expect(isChecked("Fournisseur")).toBe(false);
    expect(saveButton()).toHaveTextContent(/^Enregistrer$/);
    expect(saveButton()).toBeDisabled();
  });

  it("mode Modifier : une case décochée à la main le reste après « Terminer la saisie »", () => {
    const onApply = vi.fn();
    renderDialog({ onApply });
    fireEvent.click(checkbox("Fournisseur"));
    expect(isChecked("Fournisseur")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    // Une valeur saisie coche toujours sa ligne
    typeIn("N° de facture", "textbox", "F-2");
    expect(isChecked("N° de facture")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Terminer la saisie" }));
    expect(isChecked("Fournisseur")).toBe(false);
    expect(isChecked("N° de facture")).toBe(true);
    expect(saveButton()).toHaveTextContent("Enregistrer 2 valeurs");
    fireEvent.click(saveButton());
    expect(onApply).toHaveBeenCalledWith({
      invoiceNumber: "F-2",
      issueDate: "2026-09-15",
    });
  });

  it("TTC bloqué (facture rapprochée) : compté une seule fois, et seulement avec le détachement", () => {
    const onUnlinkAndApply = vi.fn();
    renderDialog({
      proposal: { ...proposal, invoiceDate: "2026-09-01" },
      reconciled: true,
      onUnlinkAndApply,
    });
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    typeIn("Montant TTC", "spinbutton", "130");
    expect(isChecked("Montant TTC")).toBe(false);
    expect(saveButton()).toHaveTextContent("Enregistrer 1 valeur");
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Détacher la transaction pour enregistrer le nouveau montant TTC",
      }),
    );
    expect(isChecked("Montant TTC")).toBe(true);
    expect(saveButton()).toHaveTextContent("Enregistrer 2 valeurs");
    fireEvent.click(saveButton());
    expect(onUnlinkAndApply).toHaveBeenCalledWith({
      supplierName: "Meta Platforms",
      amountTTC: 130,
    });
  });

  it("aperçu du justificatif ouvert d'office sur écran large seulement", () => {
    const files = [
      {
        id: "f1",
        url: "https://example.test/f1.pdf",
        mimetype: "application/pdf",
        originalFilename: "f1.pdf",
      },
    ];
    const props = { invoiceId: "pi-1", files, sourceFileId: "f1" };
    const { unmount } = renderDialog(props);
    expect(screen.getByTestId("apercu")).toBeInTheDocument();
    unmount();

    wide = false;
    renderDialog(props);
    expect(screen.queryByTestId("apercu")).toBeNull();
    // Toujours ouvrable à la main
    fireEvent.click(screen.getByRole("button", { name: "Aperçu" }));
    expect(screen.getByTestId("apercu")).toBeInTheDocument();
  });
});

describe("OcrComparisonDialog (factures importées)", () => {
  const current = {
    originalInvoiceNumber: "A-1",
    clientId: null,
    clientName: "",
    invoiceDate: "2026-09-01",
    dueDate: "",
    totalHT: 100,
    totalVAT: 20,
    totalTTC: 120,
    vatRate: 20,
    category: "OTHER",
    paymentMethod: "UNKNOWN",
  };
  // Mêmes noms de champs que la mutation reanalyzeImportedInvoice
  const proposal = {
    originalInvoiceNumber: "A-2",
    clientId: null,
    clientMatched: false,
    clientName: null,
    invoiceDate: "2026-09-15T00:00:00.000Z",
    dueDate: null,
    totalHT: 100,
    totalVAT: 20,
    totalTTC: 120,
    currency: "EUR",
    category: null,
    paymentMethod: null,
    confidence: 0.8,
  };
  const renderDialog = (props = {}) =>
    render(
      <OcrComparisonDialog
        open
        onOpenChange={() => {}}
        current={current}
        proposal={proposal}
        currency="EUR"
        onApply={() => {}}
        {...props}
      />,
    );

  it("mode Modifier : un champ vidé n'est ni coché ni compté, le bouton se désactive", () => {
    renderDialog({
      proposal: { ...proposal, invoiceDate: "2026-09-01T00:00:00.000Z" },
    });
    expect(saveButton()).toHaveTextContent("Enregistrer 1 valeur");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    typeIn("N° de facture", "textbox", "");
    expect(isChecked("N° de facture")).toBe(false);
    expect(saveButton()).toHaveTextContent(/^Enregistrer$/);
    expect(saveButton()).toBeDisabled();
  });

  it("mode Modifier : une case décochée à la main le reste après « Terminer la saisie »", () => {
    const onApply = vi.fn();
    renderDialog({ onApply });
    fireEvent.click(checkbox("N° de facture"));
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    typeIn("Montant HT", "spinbutton", "150");
    expect(isChecked("Montant HT")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Terminer la saisie" }));
    expect(isChecked("N° de facture")).toBe(false);
    fireEvent.click(saveButton());
    expect(onApply).toHaveBeenCalledWith({
      invoiceDate: "2026-09-15",
      totalHT: 150,
    });
  });

  it("aperçu de la facture ouvert d'office sur écran large seulement", () => {
    const props = {
      invoiceId: "ii-1",
      file: {
        url: "https://example.test/ii-1.pdf",
        originalFileName: "ii-1.pdf",
        mimeType: "application/pdf",
      },
    };
    const { unmount } = renderDialog(props);
    expect(screen.getByTestId("apercu")).toBeInTheDocument();
    unmount();

    wide = false;
    renderDialog(props);
    expect(screen.queryByTestId("apercu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Aperçu" }));
    expect(screen.getByTestId("apercu")).toBeInTheDocument();
  });
});
