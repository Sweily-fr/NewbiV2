// Consulter les listes ne demande rien : la fenêtre « Configuration de
// votre entreprise » n'apparaît qu'au moment de créer un document.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const state = vi.hoisted(() => ({
  organization: null,
  canEditSettings: true,
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push }),
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
// Formulaire de la fenêtre (chargé à la demande) : remplacé par un bouton
// qui simule l'enregistrement, testé à part (company-info-form.test.jsx).
vi.mock("next/dynamic", () => ({
  default: () => (props) => (
    <button onClick={props.onSaved}>Enregistrer et continuer</button>
  ),
}));

const {
  CompanyInfoGateProvider,
  useCompanyInfoGate,
  useCreationLinkClick,
  useGoToCreation,
} = await import("@/src/components/company-info-gate");

const COMPLETE = {
  companyName: "Boulangerie Martin",
  companyEmail: "contact@boulangerie.fr",
  addressStreet: "12 rue du Four",
  addressCity: "Lyon",
  addressZipCode: "69002",
  addressCountry: "France",
  siret: "12345678900012",
  legalForm: "SARL",
  // Mentions exigées par l'API sur les documents d'une société
  rcs: "RCS Lyon 123 456 789",
  capitalSocial: "1000",
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
  state.push.mockClear();
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
    // Formulaire : pas de compteur (il passait sous la croix de fermeture)
    expect(screen.queryByText("9/10")).not.toBeInTheDocument();

    // Informations enregistrées dans la fenêtre : la création repart seule
    fireEvent.click(screen.getByText("Enregistrer et continuer"));
    expect(onCreate).toHaveBeenCalledOnce();
    expect(
      screen.queryByText("Configuration de votre entreprise"),
    ).not.toBeInTheDocument();
  });

  it("société sans RCS ni capital : la fenêtre les demande (exigés par l'API)", () => {
    state.organization = { ...COMPLETE, rcs: "", capitalSocial: "" };
    state.canEditSettings = false;
    const onCreate = vi.fn();
    renderGate(onCreate);

    fireEvent.click(screen.getByText("Créer la facture"));
    expect(onCreate).not.toHaveBeenCalled();
    // Vue « liste » (sans droit de modifier) : compteur et champs manquants
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByText("Numéro RCS")).toBeInTheDocument();
    expect(screen.getByText("Capital social")).toBeInTheDocument();
  });

  it("sans droit de modifier l'espace : invitation à contacter l'administrateur, « Retour » ferme sans quitter la liste", () => {
    state.organization = { ...COMPLETE, siret: "" };
    state.canEditSettings = false;
    renderGate(vi.fn());
    fireEvent.click(screen.getByText("Créer la facture"));
    expect(
      screen.getByText("Contactez l'administrateur de l'espace"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Enregistrer et continuer"),
    ).not.toBeInTheDocument();

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

// La fenêtre s'ouvre sur la page courante AVANT de partir vers la page de
// création : sinon l'éditeur restait en chargement derrière la fenêtre.
describe("aller vers une page de création", () => {
  function NewInvoiceLink({ onClick }) {
    const creationLinkClick = useCreationLinkClick();
    return (
      <a
        href="/dashboard/outils/factures/new"
        onClick={(event) => {
          creationLinkClick("/dashboard/outils/factures/new")(event);
          onClick(event.defaultPrevented);
        }}
      >
        Nouvelle facture
      </a>
    );
  }

  function NewQuoteButton() {
    const goToCreation = useGoToCreation();
    return (
      <button onClick={() => goToCreation("/dashboard/outils/devis/new")}>
        Nouveau devis
      </button>
    );
  }

  const renderEntries = (onLinkClick = vi.fn()) =>
    render(
      <CompanyInfoGateProvider>
        <p>Liste des factures</p>
        <NewInvoiceLink onClick={onLinkClick} />
        <NewQuoteButton />
      </CompanyInfoGateProvider>,
    );

  it("entreprise configurée : le lien et le bouton partent normalement", () => {
    const onLinkClick = vi.fn();
    renderEntries(onLinkClick);

    fireEvent.click(screen.getByText("Nouvelle facture"));
    expect(onLinkClick).toHaveBeenCalledWith(false); // navigation du lien
    fireEvent.click(screen.getByText("Nouveau devis"));
    expect(state.push).toHaveBeenCalledWith("/dashboard/outils/devis/new");
    expect(
      screen.queryByText("Configuration de votre entreprise"),
    ).not.toBeInTheDocument();
  });

  it("entreprise incomplète : fenêtre sur la liste, puis la page de création après l'enregistrement", () => {
    state.organization = { ...COMPLETE, siret: "" };
    const onLinkClick = vi.fn();
    renderEntries(onLinkClick);

    fireEvent.click(screen.getByText("Nouvelle facture"));
    // Le lien est retenu : on reste sur la liste, la fenêtre s'ouvre
    expect(onLinkClick).toHaveBeenCalledWith(true);
    expect(screen.getByText("Liste des factures")).toBeInTheDocument();
    expect(
      screen.getByText("Configuration de votre entreprise"),
    ).toBeInTheDocument();
    expect(state.push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Enregistrer et continuer"));
    expect(state.push).toHaveBeenCalledWith("/dashboard/outils/factures/new");
  });

  it("entreprise incomplète : même chose pour un bouton", () => {
    state.organization = { ...COMPLETE, siret: "" };
    renderEntries();

    fireEvent.click(screen.getByText("Nouveau devis"));
    expect(state.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Enregistrer et continuer"));
    expect(state.push).toHaveBeenCalledWith("/dashboard/outils/devis/new");
  });
});
