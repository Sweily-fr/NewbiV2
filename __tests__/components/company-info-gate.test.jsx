// Consulter les listes ne demande rien : la fenêtre « Configuration de
// votre entreprise » n'apparaît qu'au moment de créer un document.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const state = vi.hoisted(() => ({
  organization: null,
  canEditSettings: true,
}));

vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useDashboardLayoutContext: () => ({ organization: state.organization }),
}));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({
    isReady: true,
    canDo: (module, action) =>
      module === "orgSettings" && action === "edit"
        ? state.canEditSettings
        : true,
  }),
}));
vi.mock("next/dynamic", () => ({
  default: () => (props) =>
    props.open ? <div>Paramètres : {props.initialTab}</div> : null,
}));

const { CompanyInfoGateProvider, useCompanyInfoGate } =
  await import("@/src/components/company-info-gate");

const COMPLETE = {
  companyName: "Boulangerie Martin",
  companyEmail: "contact@boulangerie.fr",
  addressStreet: "12 rue du Four",
  addressCity: "Lyon",
  addressZipCode: "69002",
  addressCountry: "France",
  siret: "12345678900012",
  legalForm: "SARL",
};

function CreateButton({ onCreate }) {
  const ensureCompanyInfo = useCompanyInfoGate();
  return (
    <button onClick={() => ensureCompanyInfo(onCreate)}>
      Créer la facture
    </button>
  );
}

const renderGate = (onCreate) =>
  render(
    <CompanyInfoGateProvider>
      <p>Liste des factures</p>
      <CreateButton onCreate={onCreate} />
    </CompanyInfoGateProvider>,
  );

beforeEach(() => {
  state.organization = { ...COMPLETE };
  state.canEditSettings = true;
});

describe("useCompanyInfoGate", () => {
  it("informations complètes : la création part directement", () => {
    const onCreate = vi.fn();
    renderGate(onCreate);
    fireEvent.click(screen.getByText("Créer la facture"));
    expect(onCreate).toHaveBeenCalledOnce();
    expect(
      screen.queryByText("Configuration de votre entreprise"),
    ).not.toBeInTheDocument();
  });

  it("informations incomplètes : la liste reste visible, la fenêtre n'apparaît qu'à la création", () => {
    state.organization = { ...COMPLETE, companyEmail: "" };
    const onCreate = vi.fn();
    renderGate(onCreate);

    // Consulter : aucune fenêtre
    expect(screen.getByText("Liste des factures")).toBeInTheDocument();
    expect(
      screen.queryByText("Configuration de votre entreprise"),
    ).not.toBeInTheDocument();

    // Créer : fenêtre, aucune création
    fireEvent.click(screen.getByText("Créer la facture"));
    expect(onCreate).not.toHaveBeenCalled();
    expect(
      screen.getByText("Configuration de votre entreprise"),
    ).toBeInTheDocument();
    expect(screen.getByText("7/8")).toBeInTheDocument();

    // « Compléter » ouvre les paramètres sur l'onglet du champ manquant
    fireEvent.click(screen.getByText("Compléter"));
    expect(screen.getByText("Paramètres : generale")).toBeInTheDocument();
  });

  it("sans droit de modifier l'espace : invitation à contacter l'administrateur, « Retour » ferme sans quitter la liste", () => {
    state.organization = { ...COMPLETE, siret: "" };
    state.canEditSettings = false;
    renderGate(vi.fn());
    fireEvent.click(screen.getByText("Créer la facture"));
    expect(
      screen.getByText("Contactez l'administrateur de l'espace"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Compléter")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Retour"));
    expect(
      screen.queryByText("Configuration de votre entreprise"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Liste des factures")).toBeInTheDocument();
  });

  it("hors du tableau de bord : l'action est exécutée telle quelle", () => {
    const onCreate = vi.fn();
    render(<CreateButton onCreate={onCreate} />);
    fireEvent.click(screen.getByText("Créer la facture"));
    expect(onCreate).toHaveBeenCalledOnce();
  });
});
