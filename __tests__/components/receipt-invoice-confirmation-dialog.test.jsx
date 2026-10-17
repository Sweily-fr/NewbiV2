import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

const renderDialog = () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(
    <ReceiptInvoiceConfirmationDialog
      open
      onOpenChange={() => {}}
      transaction={{ id: "tx-1", date: "2026-10-01", amount: -12 }}
      receiptFile={{ id: "file-1", filename: "canva.png", proposal }}
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
