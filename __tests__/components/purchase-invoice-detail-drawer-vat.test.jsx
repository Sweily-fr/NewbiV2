import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Tiroir d'une facture d'achat : choisir un taux sans HT (vide ou 0) tire
 * HT et TVA du TTC au lieu de remettre le TTC à 0, seul moyen de corriger à
 * la main une ancienne facture « TVA 0 € à 20 % ». À la relance OCR, un taux
 * absent du patch suit la même règle que l'API (deriveVatRate) plutôt que
 * le quotient brut.
 */

vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: () => ({ data: null, loading: false }),
}));
// Miniature PDF (pdfjs) : hors sujet ici
vi.mock("next/dynamic", () => ({ default: () => () => null }));
const updateInvoice = vi.fn();
const reanalyzeInvoice = vi.fn();
vi.mock("@/src/hooks/usePurchaseInvoices", () => ({
  useCreatePurchaseInvoice: () => ({ createInvoice: vi.fn(), loading: false }),
  useUpdatePurchaseInvoice: () => ({ updateInvoice, loading: false }),
  useDeletePurchaseInvoice: () => ({ deleteInvoice: vi.fn() }),
  useAddPurchaseInvoiceFile: () => ({ addFile: vi.fn() }),
  useRemovePurchaseInvoiceFile: () => ({ removeFile: vi.fn() }),
  useMarkAsPaid: () => ({ markAsPaid: vi.fn(), loading: false }),
  useReconciliationSuggestions: () => ({ suggestions: [] }),
  useReconcilePurchaseInvoice: () => ({ reconcile: vi.fn(), loading: false }),
  useAcknowledgePurchaseInvoiceEInvoice: () => ({
    acknowledge: vi.fn(),
    loading: false,
  }),
  useRefusePurchaseInvoiceEInvoice: () => ({ refuse: vi.fn(), loading: false }),
  useSubmitPurchaseInvoiceEInvoiceEvent: () => ({
    submitEvent: vi.fn(),
    loading: false,
  }),
  useUnlinkPurchaseInvoiceFromTransaction: () => ({
    unlink: vi.fn(),
    loading: false,
  }),
  usePurchaseInvoiceReconciliationPicker: () => ({
    fetchTransactionsForPurchaseInvoice: vi.fn().mockResolvedValue([]),
    fetchReconcileCandidate: vi.fn().mockResolvedValue(null),
  }),
  useCheckPurchaseInvoiceDuplicates: () => ({
    checkDuplicates: vi.fn().mockResolvedValue([]),
  }),
  useReanalyzePurchaseInvoice: () => ({ reanalyzeInvoice, loading: false }),
  useReanalyzePurchaseInvoiceFiles: () => ({
    reanalyzeAllFiles: vi.fn(),
    loading: false,
  }),
  useUnreconcilePurchaseInvoice: () => ({ unreconcile: vi.fn() }),
}));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({
    canDo: () => true,
    canRead: () => true,
    isReady: true,
  }),
}));
// Volet d'aperçu et sélecteur de catégorie : hors sujet ici
vi.mock("@/src/components/document-preview-panel", () => ({
  DocumentPreviewPanel: () => null,
  DocumentEyeButton: ({ onClick }) => (
    <button type="button" aria-label="Aperçu" onClick={onClick} />
  ),
  isDocumentPreviewTarget: () => false,
}));
vi.mock("@/src/components/category-search-select", () => ({
  default: () => null,
}));

import { PurchaseInvoiceDetailDrawer } from "@/app/dashboard/outils/factures-achat/components/detail-drawer";

// Ancienne facture « TVA 0 € à 20 % » : HT non lu enregistré à 0
const OLD_INVOICE = {
  id: "pi-1",
  supplierName: "Canva",
  invoiceNumber: "F-1",
  issueDate: "2026-09-01T00:00:00.000Z",
  amountHT: 0,
  amountTVA: 0,
  vatRate: 20,
  vatBreakdown: [],
  amountTTC: 120,
  currency: "EUR",
  status: "TO_PROCESS",
  category: "OTHER",
  files: [
    {
      id: "file-1",
      url: "https://r2.example/ticket.png",
      originalFilename: "ticket.png",
      mimetype: "image/png",
    },
  ],
  linkedTransactionIds: [],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

// Proposition de la relance OCR (champs non lus à null)
const proposalOf = (values) => ({
  supplierName: "Canva",
  invoiceNumber: "F-1",
  invoiceDate: null,
  dueDate: null,
  amountHT: null,
  amountTVA: null,
  vatRate: null,
  vatBreakdown: [],
  amountTTC: null,
  currency: "EUR",
  category: null,
  paymentMethod: null,
  confidence: 0.9,
  extractionQuality: "full",
  ...values,
});

beforeEach(() => {
  updateInvoice.mockReset();
  updateInvoice.mockResolvedValue({ id: "pi-1" });
  reanalyzeInvoice.mockReset();
});

const renderDrawer = (invoice) => {
  render(
    <PurchaseInvoiceDetailDrawer
      open
      onOpenChange={() => {}}
      invoice={invoice}
      embedded
    />,
  );
  return userEvent.setup();
};

const row = (label) => screen.getByText(label).parentElement;
const htValue = () => within(row("Montant HT")).getByRole("spinbutton").value;
// TTC : champ en tête de fiche, à côté du symbole de la devise
const ttcValue = () => within(row("€")).getByRole("spinbutton").value;
const tvaText = () => row("TVA").lastChild.textContent;
const chooseRate = async (user, label) => {
  await user.click(within(row("Taux TVA")).getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: label }));
};
const editAndChoose = async (invoice, label) => {
  const user = renderDrawer(invoice);
  await user.click(screen.getByRole("button", { name: "Modifier" }));
  await chooseRate(user, label);
  return user;
};
// Relance OCR puis enregistrement des valeurs cochées par défaut
const applyOcr = async (invoice, proposal) => {
  reanalyzeInvoice.mockResolvedValue(proposal);
  const user = renderDrawer(invoice);
  await user.click(
    screen.getAllByRole("button", { name: "Relancer l'analyse" })[0],
  );
  await user.click(await screen.findByRole("button", { name: /^Enregistrer/ }));
  await waitFor(() => expect(updateInvoice).toHaveBeenCalledTimes(1));
  return updateInvoice.mock.calls[0][1];
};

describe("PurchaseInvoiceDetailDrawer : taux choisi sans HT", () => {
  it("HT à 0 : HT et TVA tirés du TTC, qui reste la base des taux suivants", async () => {
    const user = await editAndChoose(OLD_INVOICE, "10% - Taux intermédiaire");
    // Avant : TVA = 0 x 10 %, TTC remis à 0
    expect(htValue()).toBe("109.09");
    expect(tvaText()).toMatch(/^10,91\s€$/);
    expect(ttcValue()).toBe("120");

    // 20 % (déjà affiché, donc choisi en second) : toujours depuis le TTC
    await chooseRate(user, "20% - Taux normal");
    expect(htValue()).toBe("100.00");
    expect(tvaText()).toMatch(/^20,00\s€$/);
    expect(ttcValue()).toBe("120");

    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(updateInvoice).toHaveBeenCalledTimes(1));
    expect(updateInvoice.mock.calls[0][1]).toMatchObject({
      amountHT: 100,
      amountTVA: 20,
      vatRate: 20,
      amountTTC: 120,
    });
  });

  it("taux personnalisé saisi chiffre par chiffre : toujours depuis le TTC", async () => {
    const user = await editAndChoose(OLD_INVOICE, "Personnalisé…");
    await user.type(within(row("Taux TVA")).getByRole("spinbutton"), "13");
    // « 1 » puis « 13 » : le second chiffre ne repart pas du HT du premier
    expect(htValue()).toBe("106.19");
    expect(tvaText()).toMatch(/^13,81\s€$/);
    expect(ttcValue()).toBe("120");
  });

  it("HT vide : même calcul depuis le TTC", async () => {
    await editAndChoose(
      { ...OLD_INVOICE, amountHT: null },
      "5,5% - Taux réduit",
    );
    expect(htValue()).toBe("113.74");
    expect(tvaText()).toMatch(/^6,26\s€$/);
    expect(ttcValue()).toBe("120");
  });

  it("HT renseigné : le taux part du HT, comme avant", async () => {
    await editAndChoose(
      { ...OLD_INVOICE, amountHT: 100, amountTVA: 20 },
      "10% - Taux intermédiaire",
    );
    expect(htValue()).toBe("100");
    expect(tvaText()).toMatch(/^10,00\s€$/);
    expect(ttcValue()).toBe("110.00");
  });
});

describe("PurchaseInvoiceDetailDrawer : relance OCR", () => {
  it("taux absent du patch : taux légal qui redonne la TVA, plus le quotient brut", async () => {
    const input = await applyOcr(
      { ...OLD_INVOICE, amountHT: 10, amountTVA: 2, amountTTC: 12 },
      proposalOf({ amountHT: 8.33, amountTVA: 1.67, amountTTC: 10 }),
    );
    // Avant : 1,67 / 8,33 = 20,05 %
    expect(input).toMatchObject({
      amountHT: 8.33,
      amountTVA: 1.67,
      vatRate: 20,
      amountTTC: 10,
    });
  });

  it("HT à 0 et montants non relus : la TVA n'est pas mise au TTC", async () => {
    const input = await applyOcr(
      OLD_INVOICE,
      proposalOf({ supplierName: "Canva Pty Ltd", amountTTC: 120 }),
    );
    // Avant : TVA = TTC - HT = 120 €
    expect(input).toMatchObject({
      supplierName: "Canva Pty Ltd",
      amountHT: 0,
      amountTVA: 0,
      amountTTC: 120,
    });
  });
});
