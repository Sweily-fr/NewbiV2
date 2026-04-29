import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  EInvoiceStatusBadge,
  EInvoiceIndicator,
  EInvoiceHeaderBadge,
} from "@/src/components/invoices/e-invoice-status-badge";

describe("EInvoiceStatusBadge", () => {
  it("returns null when status is missing", () => {
    const { container } = render(<EInvoiceStatusBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when status is NOT_SENT", () => {
    const { container } = render(<EInvoiceStatusBadge status="NOT_SENT" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the VALIDATED label", () => {
    render(<EInvoiceStatusBadge status="VALIDATED" />);
    expect(screen.getAllByText("Validée").length).toBeGreaterThan(0);
  });

  it("hides the label when showLabel=false", () => {
    render(<EInvoiceStatusBadge status="VALIDATED" showLabel={false} />);
    // Label may still appear in tooltip content (not rendered to DOM until hover),
    // but the inline span should be hidden
    const inlineLabels = screen.queryAllByText("Validée");
    // Only the tooltip/aria might contain the text — there should be 0 visible spans
    // We assert the inline span is missing by checking absence of <span>Validée</span>
    const spans = inlineLabels.filter((el) => el.tagName === "SPAN");
    expect(spans.length).toBe(0);
  });

  it("uses the unknown status fallback safely", () => {
    // Falls back to NOT_SENT config but still renders since status is truthy
    render(<EInvoiceStatusBadge status="WEIRD" />);
    // Falls back to NOT_SENT label "Non envoyée"
    expect(screen.getAllByText("Non envoyée").length).toBeGreaterThan(0);
  });
});

describe("EInvoiceIndicator", () => {
  it("returns null for NOT_SENT", () => {
    const { container } = render(<EInvoiceIndicator status="NOT_SENT" />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when status is missing", () => {
    const { container } = render(<EInvoiceIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it("renders an icon container for ACCEPTED", () => {
    const { container } = render(<EInvoiceIndicator status="ACCEPTED" />);
    expect(container.querySelector(".rounded-full")).toBeTruthy();
  });
});

describe("EInvoiceHeaderBadge", () => {
  it("returns null when status is NOT_SENT", () => {
    const { container } = render(<EInvoiceHeaderBadge status="NOT_SENT" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders e-facture label for SENT_TO_RECIPIENT", () => {
    render(<EInvoiceHeaderBadge status="SENT_TO_RECIPIENT" />);
    expect(screen.getByText(/E-facture/)).toBeInTheDocument();
  });

  it("renders truncated SuperPDP id when provided", () => {
    render(
      <EInvoiceHeaderBadge
        status="ACCEPTED"
        superPdpInvoiceId="abcdef1234567890"
      />,
    );
    expect(screen.getByText(/ID: abcdef12/)).toBeInTheDocument();
  });
});
