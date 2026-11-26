// Pages publiques : panneau du virement et réservation d'un créneau payant.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));
const api = vi.hoisted(() => ({ bookAppointment: vi.fn() }));
vi.mock("@/app/rdv/_lib/booking-api", async (importOriginal) => ({
  ...(await importOriginal()),
  bookAppointment: api.bookAppointment,
}));

import { BankTransferPanel } from "@/app/rdv/_components/bank-transfer-panel";
import { BookingForm } from "@/app/rdv/_components/booking-form";

const VIREMENT = {
  holder: "Cabinet Martin",
  iban: "FR76 3000 6000 0112 3456 7890 189",
  bic: "AGRIFRPP",
  bankName: null,
  reference: "NB-7K3QXA",
  amount: 4000,
  currency: "EUR",
  dueAt: "2026-11-29T20:00:00.000Z",
  declaredAt: null,
  autoDetect: false,
};

describe("BankTransferPanel", () => {
  it("coordonnées, montant exact, référence et échéance", () => {
    render(
      <BankTransferPanel
        bankTransfer={VIREMENT}
        kind="slot"
        organizerName="Cabinet Martin"
        timeZone="Europe/Paris"
        onDeclare={vi.fn()}
      />,
    );
    expect(screen.getByText("NB-7K3QXA")).toBeTruthy();
    expect(screen.getByText("FR76 3000 6000 0112 3456 7890 189")).toBeTruthy();
    expect(screen.getAllByText(/40,00/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /Le créneau vous est gardé jusqu'au 29 nov\. 2026, 21:00/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/Cabinet Martin confirme le rendez-vous dès réception/),
    ).toBeTruthy();
  });

  it("« J'ai fait le virement » annonce sans confirmer, annulable", async () => {
    const onDeclare = vi
      .fn()
      .mockResolvedValueOnce({ declaredAt: "2026-11-27T09:30:00.000Z" })
      .mockResolvedValueOnce({ declaredAt: null });
    render(
      <BankTransferPanel
        bankTransfer={VIREMENT}
        kind="event"
        timeZone="Europe/Paris"
        onDeclare={onDeclare}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "J'ai fait le virement" }),
    );
    await screen.findByText(/Virement annoncé le 27 nov\. 2026, 10:30/);
    expect(onDeclare).toHaveBeenLastCalledWith(false);
    expect(screen.queryByText(/confirmé/i)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Je n'ai pas encore fait le virement",
      }),
    );
    await screen.findByRole("button", { name: "J'ai fait le virement" });
    expect(onDeclare).toHaveBeenLastCalledWith(true);
  });

  it("réservation qui n'attend plus de virement : message", async () => {
    const error = Object.assign(new Error("NOT_ALLOWED"), {
      code: "NOT_ALLOWED",
    });
    render(
      <BankTransferPanel
        bankTransfer={VIREMENT}
        timeZone="Europe/Paris"
        onDeclare={vi.fn().mockRejectedValue(error)}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "J'ai fait le virement" }),
    );
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /n'attend plus de virement/,
    );
  });
});

describe("BookingForm d'un créneau payant", () => {
  const assign = vi.fn();
  beforeEach(() => {
    api.bookAppointment.mockReset();
    assign.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign },
    });
  });

  const TYPE = {
    slug: "consultation",
    locationKind: "IN_PERSON",
    payment: {
      price: { amount: 4000, currency: "EUR" },
      paymentMode: "ONLINE",
      depositAmount: null,
      amountOnline: 4000,
      amountDueOnSite: 0,
      paymentMethods: ["stripe", "bank_transfer"],
    },
  };
  const SLOT = {
    start: "2026-12-01T09:00:00.000Z",
    end: "2026-12-01T09:30:00.000Z",
  };

  const remplir = () => {
    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Bernard" },
    });
    fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
      target: { value: "ana@exemple.fr" },
    });
  };

  it("virement : moyen envoyé, puis page du rendez-vous (pas de confirmation)", async () => {
    const onBooked = vi.fn();
    api.bookAppointment.mockResolvedValue({
      status: "PENDING_PAYMENT",
      booking: { id: "b1" },
      manageUrl: "https://www.newbi.fr/rdv/gerer/jeton123",
      icsUrl: null,
      expiresAt: "2026-11-29T20:00:00.000Z",
    });
    render(
      <BookingForm
        slug="cabinet"
        type={TYPE}
        slot={SLOT}
        guestTimeZone="Europe/Paris"
        onBack={vi.fn()}
        onBooked={onBooked}
      />,
    );
    expect(
      screen.getByText(
        "Le créneau est gardé 3 jours. Il est confirmé dès que le virement arrive.",
      ),
    ).toBeTruthy();
    remplir();
    fireEvent.click(screen.getByRole("radio", { name: /Virement/ }));
    fireEvent.click(screen.getByRole("button", { name: /Payer 40,00/ }));
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith("/rdv/gerer/jeton123"),
    );
    expect(api.bookAppointment.mock.calls[0][2].provider).toBe("bank_transfer");
    expect(onBooked).not.toHaveBeenCalled();
  });

  it("carte : redirection vers le prestataire", async () => {
    api.bookAppointment.mockResolvedValue({
      status: "PENDING_PAYMENT",
      paymentUrl: "https://checkout.stripe.com/c/pay/cs_test",
      expiresAt: "2026-11-26T21:00:00.000Z",
    });
    render(
      <BookingForm
        slug="cabinet"
        type={TYPE}
        slot={SLOT}
        guestTimeZone="Europe/Paris"
        onBack={vi.fn()}
        onBooked={vi.fn()}
      />,
    );
    remplir();
    fireEvent.click(screen.getByRole("button", { name: /Payer 40,00/ }));
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(
        "https://checkout.stripe.com/c/pay/cs_test",
      ),
    );
    expect(api.bookAppointment.mock.calls[0][2].provider).toBe("stripe");
  });

  it("sur place : aucun moyen demandé, reste annoncé", async () => {
    const onBooked = vi.fn();
    api.bookAppointment.mockResolvedValue({ status: "CONFIRMED", booking: {} });
    render(
      <BookingForm
        slug="cabinet"
        type={{
          ...TYPE,
          payment: {
            ...TYPE.payment,
            paymentMode: "ON_SITE",
            amountOnline: 0,
            amountDueOnSite: 4000,
          },
        }}
        slot={SLOT}
        guestTimeZone="Europe/Paris"
        onBack={vi.fn()}
        onBooked={onBooked}
      />,
    );
    expect(screen.queryByText("Moyen de paiement")).toBeNull();
    expect(
      screen.getByText(/40,00.*à régler sur place, au rendez-vous/),
    ).toBeTruthy();
    remplir();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmer le rendez-vous" }),
    );
    await waitFor(() => expect(onBooked).toHaveBeenCalled());
    expect(api.bookAppointment.mock.calls[0][2]).not.toHaveProperty("provider");
  });
});
