import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmailTrackingStatus } from "@/src/components/email-tracking-status";

describe("EmailTrackingStatus", () => {
  it("renders 'Non envoyé' when no emailTracking", () => {
    render(<EmailTrackingStatus emailTracking={null} />);
    expect(screen.getByText("Non envoyé")).toBeInTheDocument();
  });

  it("renders 'Non envoyé' when emailSentAt is missing", () => {
    render(<EmailTrackingStatus emailTracking={{}} />);
    expect(screen.getByText("Non envoyé")).toBeInTheDocument();
  });

  it("renders 'Envoyé' when sent but not opened", () => {
    render(
      <EmailTrackingStatus
        emailTracking={{ emailSentAt: "2026-01-01T10:00:00Z" }}
      />,
    );
    expect(screen.getByText("Envoyé")).toBeInTheDocument();
  });

  it("renders 'Ouvert' when sent and opened", () => {
    render(
      <EmailTrackingStatus
        emailTracking={{
          emailSentAt: "2026-01-01T10:00:00Z",
          emailOpenedAt: "2026-01-01T11:00:00Z",
        }}
      />,
    );
    expect(screen.getByText("Ouvert")).toBeInTheDocument();
  });

  it("renders 'Consulté' when clicked", () => {
    render(
      <EmailTrackingStatus
        emailTracking={{
          emailSentAt: "2026-01-01T10:00:00Z",
          emailOpenedAt: "2026-01-01T11:00:00Z",
          emailClickedAt: "2026-01-01T12:00:00Z",
          emailClickCount: 2,
        }}
      />,
    );
    expect(screen.getByText("Consulté")).toBeInTheDocument();
  });

  it("handles numeric timestamp string", () => {
    render(
      <EmailTrackingStatus
        emailTracking={{
          emailSentAt: "1735732800000",
        }}
      />,
    );
    expect(screen.getByText("Envoyé")).toBeInTheDocument();
  });

  it("handles invalid date gracefully", () => {
    render(
      <EmailTrackingStatus
        emailTracking={{
          emailSentAt: "invalid-date",
        }}
      />,
    );
    // Should still render an "Envoyé" badge (formatDate returns "" but doesn't break)
    expect(screen.getByText("Envoyé")).toBeInTheDocument();
  });
});
