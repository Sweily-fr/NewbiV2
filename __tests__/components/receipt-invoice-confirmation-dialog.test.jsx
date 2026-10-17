import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceiptInvoiceConfirmationDialog } from "@/app/dashboard/outils/transactions/components/receipt-invoice-confirmation-dialog";

// Confirmation d'un justificatif (page Transactions) : ce qui est affiché
// dans le dialogue est ce qui part à la création.
const proposal = {
  supplierName: "Canva",
  invoiceNumber: "INV-1",
  issueDate: "2026-10-01T00:00:00.000Z",
  dueDate: null,
  amountHT: 10,
  amountTVA: 2,
  vatRate: 20,
  vatBreakdown: [],
  amountTTC: 12,
  currency: "EUR",
  category: "SOFTWARE",
  subcategory: "logiciel",
  paymentMethod: "CREDIT_CARD",
  extractionQuality: "full",
  duplicate: null,
};

// `overrides` : valeurs lues qui diffèrent de la proposition de base
const renderDialog = (overrides = {}) => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(
    <ReceiptInvoiceConfirmationDialog
      open
      onOpenChange={() => {}}
      transaction={{ id: "tx-1", date: "2026-10-01", amount: -12 }}
      receiptFile={{
        id: "file-1",
        filename: "canva.png",
        proposal: { ...proposal, ...overrides },
      }}
      onConfirm={onConfirm}
    />,
  );
  return { onConfirm, user: userEvent.setup() };
};

// Le moyen de paiement (Select) est aussi un combobox : la catégorie est le
// seul déclencheur de Popover.
const categoryTrigger = () =>
  screen
    .getAllByRole("combobox")
    .find((el) => el.getAttribute("aria-haspopup") === "dialog");

const createButton = () =>
  screen.getByRole("button", { name: "Créer la facture" });

// Champ de saisie d'une ligne du volet, retrouvé par son libellé
const field = (label) =>
  within(
    screen.getByText(label, { selector: "label" }).parentElement,
  ).getByRole("textbox");

// Valeurs envoyées à la création
const created = async (onConfirm, user) => {
  await user.click(createButton());
  await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  return onConfirm.mock.calls[0][1];
};

describe("ReceiptInvoiceConfirmationDialog", () => {
  it("recliquer la catégorie choisie la garde : c'est elle qui part à la création", async () => {
    const { onConfirm, user } = renderDialog();

    await user.click(categoryTrigger());
    await user.click(
      await screen.findByRole("option", { name: "Matériel informatique" }),
    );
    await user.click(categoryTrigger());
    await user.click(
      await screen.findByRole("option", { name: "Matériel informatique" }),
    );

    // Avant : « Sélectionner une catégorie » à l'écran, et la facture
    // partait avec la catégorie de l'OCR (« logiciel »)
    expect(categoryTrigger()).toHaveTextContent("Matériel informatique");
    await user.click(createButton());
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    const [action, values] = onConfirm.mock.calls[0];
    expect(action).toBe("CREATE");
    expect(values.subcategory).toBe("materiel");
  });

  it("nom du fournisseur vidé : création bloquée tant qu'il n'est pas renseigné", async () => {
    const { onConfirm, user } = renderDialog();
    const name = screen.getByDisplayValue("Canva");

    await user.clear(name);
    expect(
      screen.getByText("Nom du fournisseur requis pour créer la facture."),
    ).toBeInTheDocument();
    expect(createButton()).toBeDisabled();

    await user.type(name, "Canva Pty");
    expect(createButton()).toBeEnabled();
    await user.click(createButton());
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(onConfirm.mock.calls[0][1].supplierName).toBe("Canva Pty");
  });

  it("nombre illisible : création bloquée au lieu de l'envoyer vide", async () => {
    const { onConfirm, user } = renderDialog();
    const ht = screen.getByDisplayValue("10.00");

    await user.clear(ht);
    await user.type(ht, "abc");
    expect(
      screen.getByText(
        "Montant HT : saisissez un nombre, par exemple 1234,56.",
      ),
    ).toBeInTheDocument();
    expect(createButton()).toBeDisabled();

    await user.clear(ht);
    await user.type(ht, "10,50");
    await user.click(createButton());
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(onConfirm.mock.calls[0][1].amountHT).toBe(10.5);
  });
});

// Taux unique : HT, TVA, taux et TTC se suivent, la dernière valeur saisie
// commande, et les valeurs recalculées s'affichent avant de partir.
describe("ReceiptInvoiceConfirmationDialog : montants recalculés", () => {
  // Ticket lu sans TVA : HT = TTC, à 0 %
  const sansTva = {
    amountHT: 120.5,
    amountTVA: 0,
    vatRate: 0,
    amountTTC: 120.5,
  };

  it("TVA complétée : HT = TTC - TVA, taux déduit, envoyés tels qu'affichés", async () => {
    const { onConfirm, user } = renderDialog(sansTva);

    await user.clear(field("TVA"));
    await user.type(field("TVA"), "20,08");

    // Avant : HT 120,50 et 0 % restaient affichés, la facture partait en
    // « TVA 20,08 € à 0 % » avec HT + TVA différent du TTC
    expect(field("TVA")).toHaveValue("20,08");
    expect(field("Montant HT")).toHaveValue("100.42");
    expect(field("Taux de TVA (%)")).toHaveValue("20");
    expect(field("Montant TTC")).toHaveValue("120.50");
    expect(await created(onConfirm, user)).toMatchObject({
      amountHT: 100.42,
      amountTVA: 20.08,
      vatRate: 20,
      amountTTC: 120.5,
      currency: "EUR",
    });
  });

  it("taux changé : HT = TTC / (1 + taux), TVA = TTC - HT", async () => {
    const { onConfirm, user } = renderDialog();

    await user.clear(field("Taux de TVA (%)"));
    await user.type(field("Taux de TVA (%)"), "5,5");

    expect(field("Taux de TVA (%)")).toHaveValue("5,5");
    expect(field("Montant HT")).toHaveValue("11.37");
    expect(field("TVA")).toHaveValue("0.63");
    expect(field("Montant TTC")).toHaveValue("12.00");
    expect(await created(onConfirm, user)).toMatchObject({
      amountHT: 11.37,
      amountTVA: 0.63,
      vatRate: 5.5,
      amountTTC: 12,
    });
  });

  it("HT changé : TVA = TTC - HT, taux déduit", async () => {
    const { onConfirm, user } = renderDialog(sansTva);

    await user.clear(field("Montant HT"));
    await user.type(field("Montant HT"), "100,42");

    expect(field("Montant HT")).toHaveValue("100,42");
    expect(field("TVA")).toHaveValue("20.08");
    expect(field("Taux de TVA (%)")).toHaveValue("20");
    expect(field("Montant TTC")).toHaveValue("120.50");
    expect(await created(onConfirm, user)).toMatchObject({
      amountHT: 100.42,
      amountTVA: 20.08,
      vatRate: 20,
      amountTTC: 120.5,
    });
  });

  it("TTC changé : TVA gardée, HT = TTC - TVA, taux déduit", async () => {
    // TTC mal lu (102,50 au lieu de 120,50), TVA lue juste
    const { onConfirm, user } = renderDialog({
      amountHT: 82.42,
      amountTVA: 20.08,
      vatRate: 24.36,
      amountTTC: 102.5,
    });

    await user.clear(field("Montant TTC"));
    await user.type(field("Montant TTC"), "120,50");

    expect(field("Montant TTC")).toHaveValue("120,50");
    expect(field("TVA")).toHaveValue("20.08");
    expect(field("Montant HT")).toHaveValue("100.42");
    expect(field("Taux de TVA (%)")).toHaveValue("20");
    expect(await created(onConfirm, user)).toMatchObject({
      amountHT: 100.42,
      amountTVA: 20.08,
      vatRate: 20,
      amountTTC: 120.5,
    });
  });

  it("champ vidé ou illisible : rien n'est recalculé", async () => {
    const { user } = renderDialog();
    const unchanged = () => {
      expect(field("Montant HT")).toHaveValue("10.00");
      expect(field("Taux de TVA (%)")).toHaveValue("20");
    };

    await user.clear(field("TVA"));
    unchanged();
    await user.type(field("TVA"), "abc");
    unchanged();
    // Le blocage d'un nombre illisible reste
    expect(createButton()).toBeDisabled();

    // TTC vidé : plus de base de calcul
    await user.clear(field("Montant TTC"));
    unchanged();
    await user.clear(field("TVA"));
    await user.type(field("TVA"), "3");
    unchanged();
    expect(field("TVA")).toHaveValue("3");
  });

  it("moyen de paiement et date changés : envoyés tels quels, montants intacts", async () => {
    const { onConfirm, user } = renderDialog();

    await user.click(
      screen
        .getAllByRole("combobox")
        .find((el) => el.getAttribute("aria-haspopup") !== "dialog"),
    );
    await user.click(await screen.findByRole("option", { name: "Virement" }));
    await user.click(screen.getByRole("button", { name: /01\/10\/2026/ }));
    await user.click(
      within(await screen.findByRole("grid")).getByRole("button", {
        name: /15 octobre 2026/,
      }),
    );

    expect(await created(onConfirm, user)).toMatchObject({
      paymentMethod: "BANK_TRANSFER",
      issueDate: "2026-10-15",
      amountHT: 10,
      amountTVA: 2,
      vatRate: 20,
      amountTTC: 12,
      currency: "EUR",
    });
  });

  it("détail par taux affiché : le TTC modifié ne recalcule rien", async () => {
    // Note de restaurant : plats à 10 %, alcool à 20 %, pourboire ajouté
    const lines = [
      { rate: 20, baseHT: 35.36, amountTVA: 7.07 },
      { rate: 10, baseHT: 80, amountTVA: 8 },
    ];
    const { onConfirm, user } = renderDialog({
      amountHT: 115.36,
      amountTVA: 15.07,
      vatRate: 10,
      amountTTC: 130.43,
      vatBreakdown: lines,
    });

    await user.clear(field("Montant TTC"));
    await user.type(field("Montant TTC"), "135,43");

    expect(
      screen.getByText(/Le TTC diffère de HT \+ TVA de 5,00/),
    ).toBeInTheDocument();
    expect(await created(onConfirm, user)).toMatchObject({
      amountHT: 115.36,
      amountTVA: 15.07,
      vatRate: 10,
      amountTTC: 135.43,
      vatBreakdown: lines,
    });
  });
});
