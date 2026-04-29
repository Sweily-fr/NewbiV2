import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignatureStatusBadge } from "@/src/components/esignature/signature-status-badge";

describe("SignatureStatusBadge", () => {
  it("renders the PENDING label by default for unknown status", () => {
    render(<SignatureStatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText("En attente")).toBeInTheDocument();
  });

  it("renders the WAIT_SIGN label", () => {
    render(<SignatureStatusBadge status="WAIT_SIGN" />);
    expect(screen.getByText("Prêt à signer")).toBeInTheDocument();
  });

  it("renders the DONE label with a custom green class", () => {
    const { container } = render(<SignatureStatusBadge status="DONE" />);
    expect(screen.getByText("Signé")).toBeInTheDocument();
    expect(container.querySelector(".bg-green-100")).toBeTruthy();
  });

  it("renders the ERROR label", () => {
    render(<SignatureStatusBadge status="ERROR" />);
    expect(screen.getByText("Erreur")).toBeInTheDocument();
  });

  it("renders the CANCELLED label with gray class", () => {
    const { container } = render(<SignatureStatusBadge status="CANCELLED" />);
    expect(screen.getByText("Annulé")).toBeInTheDocument();
    expect(container.querySelector(".bg-gray-100")).toBeTruthy();
  });

  it("applies the additional className prop", () => {
    const { container } = render(
      <SignatureStatusBadge status="WAIT_SIGN" className="my-extra-class" />,
    );
    expect(container.querySelector(".my-extra-class")).toBeTruthy();
  });

  it("falls back to PENDING when no status is provided", () => {
    render(<SignatureStatusBadge />);
    expect(screen.getByText("En attente")).toBeInTheDocument();
  });
});
