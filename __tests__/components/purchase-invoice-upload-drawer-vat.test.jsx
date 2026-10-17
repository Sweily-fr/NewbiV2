import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Dépôt d'une facture d'achat (onglet OCR) : HT, TVA, TTC et taux sont
 * pré-remplis depuis les montants lus et complétés comme le justificatif
 * côté API (completeVatAmounts). Un taux non lu n'est plus 20 % d'office,
 * un taux fabriqué par l'OCR cède à celui des montants, et un taux choisi
 * ensuite part du TTC lu quand le HT en a été tiré.
 */

const processOcr = vi.fn();
vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal()),
  useMutation: () => [processOcr, { loading: false }],
}));
const createInvoice = vi.fn();
vi.mock("@/src/hooks/usePurchaseInvoices", () => ({
  useCreatePurchaseInvoice: () => ({ createInvoice }),
  useAddPurchaseInvoiceFile: () => ({ addFile: vi.fn() }),
  useCheckPurchaseInvoiceDuplicates: () => ({
    checkDuplicates: vi.fn().mockResolvedValue([]),
  }),
  useReconcilePurchaseInvoice: () => ({ reconcile: vi.fn() }),
  usePurchaseInvoiceReconciliationPicker: () => ({
    fetchReconcileCandidate: vi.fn().mockResolvedValue(null),
  }),
}));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1" }),
}));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({ canDo: () => true, isReady: true }),
}));
// Volet d'aperçu et sélecteur de catégorie : hors sujet ici
vi.mock("@/src/components/document-preview-panel", () => ({
  DocumentPreviewPanel: () => null,
  isDocumentPreviewTarget: () => false,
}));
vi.mock("@/src/components/category-search-select", () => ({
  default: () => null,
}));

import { PurchaseInvoiceUploadDrawer } from "@/app/dashboard/outils/factures-achat/components/upload-drawer";

beforeEach(() => {
  processOcr.mockReset();
  createInvoice.mockReset();
  createInvoice.mockResolvedValue({ id: "pi-1" });
});

// Dépose un justificatif et attend le formulaire de vérification, pré-rempli
// depuis l'analyse OCR donnée (JSON brut, comme processDocumentOcr)
const reviewOcr = async (financial) => {
  processOcr.mockResolvedValue({
    data: {
      processDocumentOcr: {
        success: true,
        financialAnalysis: JSON.stringify(financial),
        metadata: null,
      },
    },
  });
  const user = userEvent.setup();
  const { container } = render(
    <PurchaseInvoiceUploadDrawer open onOpenChange={() => {}} embedded />,
  );
  fireEvent.change(container.querySelector('input[type="file"]'), {
    target: { files: [new File(["x"], "ticket.png", { type: "image/png" })] },
  });
  await user.click(screen.getByRole("button", { name: /Analyser/ }));
  await screen.findByText("Données extraites");
  return user;
};

const row = (label) => screen.getByText(label).parentElement;
const amount = (label) => within(row(label)).getByRole("spinbutton").value;
const rateLabel = () =>
  within(row("Taux TVA")).getByRole("combobox").textContent;
const tvaText = () => row("TVA").lastChild.textContent;
const chooseRate = async (user, label) => {
  await user.click(within(row("Taux TVA")).getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: label }));
};
const createdWith = async (user) => {
  await user.click(screen.getByRole("button", { name: "Créer la facture" }));
  await waitFor(() => expect(createInvoice).toHaveBeenCalledTimes(1));
  return createInvoice.mock.calls[0][0];
};

describe("PurchaseInvoiceUploadDrawer : TVA pré-remplie depuis l'OCR", () => {
  it("TTC seul lu : sans TVA à 0 %, plus « TVA 0 € à 20 % »", async () => {
    // Montants non lus : les moteurs OCR mettent 0
    const user = await reviewOcr({
      transaction_data: {
        vendor_name: "La Poste",
        amount: 12.5,
        amount_ht: 0,
        tax_amount: 0,
        tax_rate: null,
      },
    });

    expect(amount("Montant HT")).toBe("12.5");
    expect(tvaText()).toBe("0 €");
    expect(rateLabel()).toBe("0% - Exonéré");
    expect(amount("Montant TTC *")).toBe("12.5");
    expect(await createdWith(user)).toMatchObject({
      amountHT: 12.5,
      amountTVA: 0,
      vatRate: 0,
      amountTTC: 12.5,
    });
  });

  it.each([
    // Claude arrondit TVA / HT à l'entier : 5,5 devient 6
    [
      "Claude",
      { amount: 105.5, amount_ht: 100, tax_amount: 5.5, tax_rate: 6 },
      "5,5% - Taux réduit",
    ],
    // Mistral met 0 quand le taux est absent
    [
      "Mistral",
      { amount: 120, amount_ht: 100, tax_amount: 20, tax_rate: 0 },
      "20% - Taux normal",
    ],
    // Le secours regex garde le quotient brut
    [
      "secours regex",
      { amount: 10, amount_ht: 8.33, tax_amount: 1.67, tax_rate: 20.05 },
      "20% - Taux normal",
    ],
  ])(
    "taux fabriqué par l'OCR (%s) : celui des montants",
    async (_engine, read, expected) => {
      await reviewOcr({
        transaction_data: { vendor_name: "Fournisseur", ...read },
      });
      expect(rateLabel()).toBe(expected);
    },
  );

  it("TTC et TVA lus sans HT : HT = TTC - TVA, taux déduit", async () => {
    const user = await reviewOcr({
      transaction_data: {
        vendor_name: "Uber",
        amount: 10.59,
        tax_amount: 1.76,
      },
    });

    expect(amount("Montant HT")).toBe("8.83");
    expect(rateLabel()).toBe("20% - Taux normal");
    expect(await createdWith(user)).toMatchObject({
      amountHT: 8.83,
      amountTVA: 1.76,
      vatRate: 20,
      amountTTC: 10.59,
    });
  });

  it("TTC et taux lus : HT = TTC / (1 + taux)", async () => {
    await reviewOcr({
      transaction_data: {
        vendor_name: "Free",
        amount: 120,
        amount_ht: 0,
        tax_amount: 0,
        tax_rate: 20,
      },
    });

    expect(amount("Montant HT")).toBe("100");
    expect(tvaText()).toBe("20 €");
    expect(rateLabel()).toBe("20% - Taux normal");
  });

  it("plusieurs taux lus : résumé du détail, TTC lu gardé (pourboire)", async () => {
    const user = await reviewOcr({
      transaction_data: {
        vendor_name: "Brasserie",
        amount: 133.43,
        tax_amount: 15.07,
      },
      extracted_fields: {
        tax_details: [
          { rate: 10, base: 80, amount: 8 },
          { rate: 20, base: 35.36, amount: 7.07 },
        ],
      },
    });

    // Détail par taux à la place du HT / taux uniques
    expect(screen.queryByText("Taux TVA")).not.toBeInTheDocument();
    expect(amount("Montant TTC *")).toBe("133.43");
    expect(await createdWith(user)).toMatchObject({
      amountHT: 115.36,
      amountTVA: 15.07,
      vatRate: 10,
      amountTTC: 133.43,
      vatBreakdown: [
        { rate: 20, baseHT: 35.36, amountTVA: 7.07 },
        { rate: 10, baseHT: 80, amountTVA: 8 },
      ],
    });
  });

  it("aucun montant lu : taux laissé vide, plus 20 % d'office", async () => {
    await reviewOcr({
      transaction_data: {
        vendor_name: "Inconnu",
        amount: 0,
        amount_ht: 0,
        tax_amount: 0,
        tax_rate: null,
      },
    });

    expect(amount("Montant HT")).toBe("");
    expect(rateLabel()).toBe("");
    expect(amount("Montant TTC *")).toBe("");
  });

  it("TTC seul lu puis 20 % choisi : HT et TVA tirés du TTC, qui ne bouge pas", async () => {
    const user = await reviewOcr({
      transaction_data: {
        vendor_name: "Canva",
        amount: 120,
        amount_ht: 0,
        tax_amount: 0,
      },
    });

    await chooseRate(user, "20% - Taux normal");
    expect(amount("Montant HT")).toBe("100.00");
    expect(tvaText()).toBe("20.00 €");
    expect(amount("Montant TTC *")).toBe("120");
    expect(await createdWith(user)).toMatchObject({
      amountHT: 100,
      amountTVA: 20,
      vatRate: 20,
      amountTTC: 120,
    });
  });

  it("HT lu : un taux choisi part toujours du HT (inchangé)", async () => {
    const user = await reviewOcr({
      transaction_data: {
        vendor_name: "OVH",
        amount: 120,
        amount_ht: 100,
        tax_amount: 20,
        tax_rate: 20,
      },
    });

    await chooseRate(user, "10% - Taux intermédiaire");
    expect(amount("Montant HT")).toBe("100");
    expect(tvaText()).toBe("10.00 €");
    expect(amount("Montant TTC *")).toBe("110.00");
  });
});
