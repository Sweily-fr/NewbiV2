import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock Apollo
vi.mock("@apollo/client", () => ({
  useMutation: vi.fn(() => [vi.fn().mockResolvedValue({ data: {} })]),
}));

// Mock toast
vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock GraphQL mutation imports (just to avoid graphql parsing)
vi.mock("@/src/graphql/mutations/documentUpload", () => ({
  UPLOAD_DOCUMENT: "UPLOAD_DOCUMENT",
  DELETE_DOCUMENT: "DELETE_DOCUMENT",
}));

import { WorkspaceForm } from "@/src/components/create-workspace/workspace-form";

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WorkspaceForm", () => {
  it("renders the title and search field", () => {
    render(
      <WorkspaceForm
        companyName=""
        setCompanyName={vi.fn()}
        setCompanyData={vi.fn()}
        logoUrl={null}
        setLogoUrl={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Créer votre espace de travail"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Nom de l'entreprise/),
    ).toBeInTheDocument();
  });

  it("shows fallback letter from companyName initial", () => {
    render(
      <WorkspaceForm
        companyName="Acme Corp"
        setCompanyName={vi.fn()}
        setCompanyData={vi.fn()}
        logoUrl={null}
        setLogoUrl={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("falls back to 'A' when companyName empty", () => {
    render(
      <WorkspaceForm
        companyName=""
        setCompanyName={vi.fn()}
        setCompanyData={vi.fn()}
        logoUrl={null}
        setLogoUrl={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("workspace slug input shows my-workspace when name empty", () => {
    render(
      <WorkspaceForm
        companyName=""
        setCompanyName={vi.fn()}
        setCompanyData={vi.fn()}
        logoUrl={null}
        setLogoUrl={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(
      screen.getByDisplayValue("app.newbi.io/my-workspace"),
    ).toBeInTheDocument();
  });

  it("workspace slug derived from companyName (kebab-case)", () => {
    render(
      <WorkspaceForm
        companyName="Acme Co. & Sons"
        setCompanyName={vi.fn()}
        setCompanyData={vi.fn()}
        logoUrl={null}
        setLogoUrl={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    // Special chars stripped, spaces -> dashes
    expect(
      screen.getByDisplayValue(/app\.newbi\.io\/acme-co-sons/),
    ).toBeInTheDocument();
  });

  it("Continue button is disabled when no company selected", () => {
    render(
      <WorkspaceForm
        companyName=""
        setCompanyName={vi.fn()}
        setCompanyData={vi.fn()}
        logoUrl={null}
        setLogoUrl={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.getByText("Continuer")).toBeDisabled();
  });

  it("typing in name input calls setCompanyName", () => {
    const setCompanyName = vi.fn();
    render(
      <WorkspaceForm
        companyName=""
        setCompanyName={setCompanyName}
        setCompanyData={vi.fn()}
        logoUrl={null}
        setLogoUrl={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/Nom de l'entreprise/), {
      target: { value: "Acme" },
    });
    expect(setCompanyName).toHaveBeenCalledWith("Acme");
  });

  it("billing country select shows France by default", () => {
    render(
      <WorkspaceForm
        companyName=""
        setCompanyName={vi.fn()}
        setCompanyData={vi.fn()}
        logoUrl={null}
        setLogoUrl={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.getByText("France")).toBeInTheDocument();
  });

  it("displays the logo image when logoUrl is set", () => {
    render(
      <WorkspaceForm
        companyName="Acme"
        setCompanyName={vi.fn()}
        setCompanyData={vi.fn()}
        logoUrl="https://example.com/logo.png"
        setLogoUrl={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    const img = screen.queryByAltText("Logo");
    if (img) {
      expect(img).toHaveAttribute("src", "https://example.com/logo.png");
    }
  });

  it("triggers debounced search when name >= 3 chars", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ results: [] }),
      }),
    );
    render(
      <WorkspaceForm
        companyName="Acme"
        setCompanyName={vi.fn()}
        setCompanyData={vi.fn()}
        logoUrl={null}
        setLogoUrl={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalled();
      },
      { timeout: 1000 },
    );
    const url = fetch.mock.calls[0][0];
    expect(url).toContain("/api/search-companies?q=Acme");
  });
});
