import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BankSyncOverlay } from "@/src/components/bank-sync-overlay";

describe("BankSyncOverlay", () => {
  it("does not render anything when isVisible is false", () => {
    const { container } = render(<BankSyncOverlay isVisible={false} />);
    // AnimatePresence may render nothing
    expect(container.textContent).toBe("");
  });

  it("renders the default message when visible", () => {
    render(<BankSyncOverlay isVisible={true} />);
    expect(
      screen.getByText(/Synchronisation de vos comptes bancaires/i),
    ).toBeInTheDocument();
  });

  it("renders a custom message when provided", () => {
    render(<BankSyncOverlay isVisible={true} message="Custom syncing..." />);
    expect(screen.getByText(/Custom syncing/i)).toBeInTheDocument();
  });

  it("renders the 'Veuillez patienter' subtitle", () => {
    render(<BankSyncOverlay isVisible={true} />);
    expect(
      screen.getByText(/Veuillez patienter quelques instants/i),
    ).toBeInTheDocument();
  });

  it("renders an SVG loader icon", () => {
    const { container } = render(<BankSyncOverlay isVisible={true} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
