import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const saveRecurrence = vi.fn();
const setStatus = vi.fn();

vi.mock("@/src/hooks/useSubscriptionAccess", () => ({
  useSubscriptionAccess: () => ({ isReadOnly: false }),
}));
vi.mock("@/src/graphql/emailQueries", () => ({
  useEmailSettings: () => ({ data: null }),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@/src/graphql/invoiceRecurrenceQueries", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useSaveInvoiceRecurrence: () => ({ saveRecurrence, loading: false }),
    useSetInvoiceRecurrenceStatus: () => ({ setStatus, loading: false }),
  };
});

import InvoiceRecurrenceDialog from "@/app/dashboard/outils/factures/components/invoice-recurrence-dialog";

const invoice = {
  id: "inv-1",
  prefix: "F-102026",
  number: "0004",
  status: "PENDING",
  issueDate: "2026-10-03",
  finalTotalTTC: 360,
  client: { name: "Acme", email: "compta@acme.fr" },
};

describe("InvoiceRecurrenceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveRecurrence.mockResolvedValue({
      success: true,
      recurrence: { id: "rec-1", nextRunDate: "2099-11-03" },
    });
  });

  it("programme une facture mensuelle avec l'email par défaut", async () => {
    const onOpenChange = vi.fn();
    render(
      <InvoiceRecurrenceDialog
        open
        onOpenChange={onOpenChange}
        invoice={invoice}
        recurrence={null}
      />,
    );

    expect(
      screen.getByText("Rendre la facture récurrente"),
    ).toBeInTheDocument();
    expect(screen.getByText(/compta@acme\.fr/)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Facture {documentNumber}"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Programmer" }));

    await waitFor(() => expect(saveRecurrence).toHaveBeenCalledTimes(1));
    const [invoiceId, input] = saveRecurrence.mock.calls[0];
    expect(invoiceId).toBe("inv-1");
    expect(input).toMatchObject({
      frequency: "MONTHLY",
      interval: 1,
      endDate: null,
      // Textes par défaut : null pour suivre le modèle des paramètres email
      emailSubject: null,
      emailBody: null,
    });
    // Même jour que la facture modèle, à partir d'aujourd'hui
    expect(input.startDate).toMatch(/^\d{4}-\d{2}-03$/);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("affiche une récurrence active et permet de la suspendre", async () => {
    setStatus.mockResolvedValue({ success: true, recurrence: {} });
    render(
      <InvoiceRecurrenceDialog
        open
        onOpenChange={vi.fn()}
        invoice={invoice}
        recurrence={{
          id: "rec-1",
          sourceInvoiceId: "inv-1",
          frequency: "WEEKLY",
          interval: 2,
          startDate: "2099-01-05",
          endDate: null,
          nextRunDate: "2099-01-05",
          status: "ACTIVE",
          emailSubject: "Votre facture {documentNumber}",
          emailBody: null,
          generatedCount: 3,
          lastRunDate: "2026-09-28",
          lastError: null,
        }}
      />,
    );

    expect(screen.getByText("Récurrence de la facture")).toBeInTheDocument();
    expect(screen.getByText(/3 factures générées/)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Votre facture {documentNumber}"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Suspendre" }));
    await waitFor(() =>
      expect(setStatus).toHaveBeenCalledWith("rec-1", "PAUSED"),
    );
  });
});
