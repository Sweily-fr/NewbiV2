import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LegalForm } from "@/app/dashboard/outils/mentions-legales/components/legal-form";

describe("LegalForm", () => {
  it("renders the company info section", () => {
    render(<LegalForm onFormChange={vi.fn()} />);
    expect(
      screen.getByText("Informations sur l'entreprise"),
    ).toBeInTheDocument();
  });

  it("renders the company name field", () => {
    render(<LegalForm onFormChange={vi.fn()} />);
    expect(screen.getByLabelText(/Nom de l'entreprise/i)).toBeInTheDocument();
  });

  it("renders the email field by name", () => {
    render(<LegalForm onFormChange={vi.fn()} />);
    expect(document.querySelector('[name="email"]')).toBeTruthy();
    expect(document.querySelector('[name="websiteUrl"]')).toBeTruthy();
  });

  it("renders the legal form select", () => {
    render(<LegalForm onFormChange={vi.fn()} />);
    expect(screen.getAllByText(/Forme juridique/i).length).toBeGreaterThan(0);
  });

  it("calls onFormChange after typing (debounced ~300ms)", async () => {
    const onFormChange = vi.fn();
    render(<LegalForm onFormChange={onFormChange} />);

    fireEvent.change(screen.getByLabelText(/Nom de l'entreprise/i), {
      target: { value: "Acme" },
    });

    await waitFor(
      () => {
        expect(onFormChange).toHaveBeenCalled();
      },
      { timeout: 1000 },
    );
    const lastCall = onFormChange.mock.calls.at(-1)[0];
    expect(lastCall.companyName).toBe("Acme");
  });

  it("does NOT call onFormChange before any field is modified", async () => {
    const onFormChange = vi.fn();
    render(<LegalForm onFormChange={onFormChange} />);
    // Wait past the debounce window
    await new Promise((r) => setTimeout(r, 500));
    expect(onFormChange).not.toHaveBeenCalled();
  });
});
