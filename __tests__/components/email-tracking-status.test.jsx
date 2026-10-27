import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { TooltipProvider } from "@/src/components/ui/tooltip";
import { EmailTrackingStatus } from "@/src/components/email-tracking-status";

const SENT_AT = "2026-10-26T09:00:00.000Z";

function renderStatus(emailTracking) {
  return render(
    <TooltipProvider>
      <EmailTrackingStatus emailTracking={emailTracking} />
    </TooltipProvider>,
  );
}

describe("EmailTrackingStatus - remise de l'email", () => {
  it("affiche « Non envoyé » sans suivi", () => {
    renderStatus(null);
    expect(screen.getByText("Non envoyé")).toBeInTheDocument();
  });

  it("reste « Envoyé » tant que la remise n'est pas confirmée", () => {
    renderStatus({ emailSentAt: SENT_AT, deliveryStatus: "SENT" });
    expect(screen.getByText("Envoyé")).toBeInTheDocument();
  });

  it("reste « Envoyé » une fois l'email remis (suivi inchangé)", () => {
    renderStatus({
      emailSentAt: SENT_AT,
      deliveryStatus: "DELIVERED",
      deliveredAt: "2026-10-26T09:00:04.000Z",
    });
    expect(screen.getByText("Envoyé")).toBeInTheDocument();
    expect(screen.queryByText("Remis")).not.toBeInTheDocument();
  });

  it("affiche « Ouvert » quand le client a ouvert l'email remis", () => {
    renderStatus({
      emailSentAt: SENT_AT,
      deliveryStatus: "DELIVERED",
      emailOpenedAt: "2026-10-26T10:00:00.000Z",
      emailOpenCount: 1,
    });
    expect(screen.getByText("Ouvert")).toBeInTheDocument();
  });

  it("affiche « Rejeté » même si une copie a été ouverte", () => {
    renderStatus({
      emailSentAt: SENT_AT,
      deliveryStatus: "FAILED",
      deliveryFailureReason: "L'adresse e-mail n'existe pas",
      recipientEmail: "client@test.fr",
      emailOpenedAt: "2026-10-26T10:00:00.000Z",
    });
    expect(screen.getByText("Rejeté")).toBeInTheDocument();
    expect(screen.queryByText("Ouvert")).not.toBeInTheDocument();
  });

  it("garde l'affichage des anciens envois sans état de remise", () => {
    renderStatus({ emailSentAt: SENT_AT });
    expect(screen.getByText("Envoyé")).toBeInTheDocument();
  });
});
