import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const GB = 1_000_000_000;

const mockStorage = { value: null };
vi.mock("@/src/hooks/useWorkspaceStorage", () => ({
  useWorkspaceStorage: () => ({
    storage: mockStorage.value,
    loading: false,
    workspaceId: "org1",
  }),
}));

const mockPermissions = { actions: {} };
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({
    isReady: true,
    can: (page, level) =>
      level === "read"
        ? (mockPermissions.actions[page] || []).includes("view")
        : (mockPermissions.actions[page] || []).includes("manage"),
    canDo: (page, action) =>
      (mockPermissions.actions[page] || []).includes(action),
  }),
}));

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "org1" }),
}));

const mockSetPacks = vi.fn();
const mockPacks = { available: true };
vi.mock("@/src/hooks/useStoragePacks", () => ({
  useStoragePacks: () => ({
    isAvailableFor: () => mockPacks.available,
    loaded: true,
    setPacks: mockSetPacks,
    saving: false,
  }),
  openSubscriptionSettings: vi.fn(),
  openStorageSettings: vi.fn(),
}));

import { StorageSection } from "@/src/components/settings/storage-section";
import { StorageBanner } from "@/src/components/storage/storage-banner";
import { StorageQuotaDialog } from "@/src/components/storage/storage-quota-dialog";
import { STORAGE_QUOTA_EVENT } from "@/src/lib/storage-plans";

// Propositions de l'API : Standard plein = offre supérieure seulement (packs
// réservés à Entreprise) ; Entreprise pleine = packs seulement
const offer = {
  neededBytes: 101 * GB,
  currentMonthlyCost: 17.99,
  recommended: "upgrade",
  packs: null,
  upgrade: {
    plan: "pme",
    label: "Premium",
    packs: 0,
    planMonthlyPrice: 50,
    monthlyCost: 50,
    quotaBytes: 500 * GB,
  },
};

const enterpriseOffer = {
  neededBytes: 2001 * GB,
  currentMonthlyCost: 200,
  recommended: "packs",
  packs: {
    additionalPacks: 1,
    totalPacks: 1,
    monthlyCost: 97.98,
    extraMonthlyCost: 2.99,
    billedPrice: 2.99,
    interval: "month",
    addedBytes: 50 * GB,
  },
  upgrade: null,
};

function storage(overrides = {}) {
  return {
    workspaceId: "org1",
    ready: true,
    plan: "freelance",
    planLabel: "Standard",
    interval: "month",
    subscriptionActive: true,
    usedBytes: 30 * GB,
    quotaBytes: 100 * GB,
    baseQuotaBytes: 100 * GB,
    remainingBytes: 70 * GB,
    percent: 30,
    level: "ok",
    packs: 0,
    packBytes: 0,
    canViewDetails: true,
    byCategory: [
      {
        category: "sharedDocuments",
        label: "Documents partagés",
        bytes: 20 * GB,
      },
      {
        category: "kanban",
        label: "Projets (pièces jointes et images)",
        bytes: 10 * GB,
      },
    ],
    byUser: [
      { userId: "u1", name: "Alice Martin", email: "a@x.fr", bytes: 25 * GB },
      { userId: null, name: "Non attribué", email: null, bytes: 5 * GB },
    ],
    offer,
    ...overrides,
  };
}

function enterprise(overrides = {}) {
  return storage({
    plan: "entreprise",
    planLabel: "Entreprise",
    quotaBytes: 2000 * GB,
    baseQuotaBytes: 2000 * GB,
    remainingBytes: 1970 * GB,
    percent: 1.5,
    offer: enterpriseOffer,
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPacks.available = true;
  mockPermissions.actions = { billing: ["view", "manage"] };
});

describe("Paramètres > Stockage", () => {
  it("affiche l'espace utilisé, le quota et le reste", () => {
    mockStorage.value = storage();
    render(<StorageSection />);
    expect(screen.getByTestId("stockage-resume").textContent).toBe(
      "30 Go utilisés sur 100 Go, il vous reste 70 Go.",
    );
  });

  it("détaille par type de fichier et par personne, avec « Non attribué »", () => {
    mockStorage.value = storage();
    render(<StorageSection />);
    expect(screen.getByTestId("stockage-par-type").textContent).toContain(
      "Documents partagés",
    );
    const people = screen.getByTestId("stockage-par-personne").textContent;
    expect(people).toContain("Alice Martin");
    expect(people).toContain("Non attribué");
  });

  it("Standard : propose seulement de passer à l'offre Premium, sans pack", () => {
    mockStorage.value = storage();
    render(<StorageSection />);
    expect(
      screen.getByText("Passer à l'offre Premium", { selector: "button" }),
    ).toBeTruthy();
    expect(screen.getByTestId("offre-superieure").textContent).toContain(
      "500 Go de stockage, 50,00 € TTC/mois",
    );
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(screen.queryByTestId("packs-indisponibles")).toBeNull();
    // Pas de rubrique « Packs actifs » sur une offre qui n'en vend pas
    expect(screen.queryByText("Packs actifs")).toBeNull();
  });

  it("Entreprise : propose d'ajouter des packs, sans offre supérieure", () => {
    mockStorage.value = enterprise();
    render(<StorageSection />);
    expect(
      screen.getByText("Ajouter du stockage", { selector: "button" }),
    ).toBeTruthy();
    expect(screen.getByTestId("offre-packs").textContent).toContain(
      "2,99 € TTC/mois de plus",
    );
    expect(screen.queryByTestId("offre-superieure")).toBeNull();
    expect(screen.getByText("Aucun pack de stockage.")).toBeTruthy();
  });

  it("Entreprise sans prix Stripe : l'achat est masqué et le message le dit, sans case vide", () => {
    mockPacks.available = false;
    mockStorage.value = enterprise();
    render(<StorageSection />);
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(screen.queryByTestId("offre-superieure")).toBeNull();
    expect(screen.getByTestId("packs-indisponibles").textContent).toContain(
      "n'est pas disponible pour le moment",
    );
  });

  it("sans abonnement actif : un abonnement est demandé pour les packs", () => {
    mockStorage.value = enterprise({ subscriptionActive: false });
    render(<StorageSection />);
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(screen.getByTestId("packs-indisponibles").textContent).toContain(
      "abonnement actif est nécessaire",
    );
  });

  it("montre les packs actifs", () => {
    mockStorage.value = enterprise({
      packs: 2,
      packBytes: 100 * GB,
      quotaBytes: 2100 * GB,
    });
    render(<StorageSection />);
    expect(screen.getByTestId("stockage-packs").textContent).toContain(
      "2 packs de 50 Go",
    );
  });

  it("garde retirables les packs déjà achetés sur Premium, sans en proposer d'autres", () => {
    mockStorage.value = storage({
      plan: "pme",
      planLabel: "Premium",
      packs: 1,
      packBytes: 50 * GB,
      quotaBytes: 550 * GB,
      baseQuotaBytes: 500 * GB,
      offer: {
        ...offer,
        upgrade: {
          plan: "entreprise",
          label: "Entreprise",
          packs: 0,
          planMonthlyPrice: 200,
          monthlyCost: 200,
          quotaBytes: 2000 * GB,
        },
      },
    });
    render(<StorageSection />);
    expect(screen.getByTestId("stockage-packs").textContent).toContain(
      "1 pack de 50 Go",
    );
    expect(screen.getByText("Retirer un pack")).toBeTruthy();
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(
      screen.getByText("Passer à l'offre Entreprise", { selector: "button" }),
    ).toBeTruthy();
  });

  it("ne montre que l'état aux membres qui ne voient pas l'abonnement", () => {
    mockPermissions.actions = {};
    mockStorage.value = storage({
      canViewDetails: false,
      byCategory: null,
      byUser: null,
      offer: null,
    });
    render(<StorageSection />);
    expect(screen.getByTestId("stockage-resume")).toBeTruthy();
    expect(screen.queryByTestId("stockage-par-type")).toBeNull();
    expect(screen.queryByText("Ajouter du stockage")).toBeNull();
  });

  it("annonce un calcul en cours avant le premier résultat", () => {
    mockStorage.value = storage({ ready: false });
    render(<StorageSection />);
    expect(
      screen.getByText(/Calcul de l.espace utilisé en cours/),
    ).toBeTruthy();
  });
});

describe("Bandeau de stockage", () => {
  it("n'apparaît pas sous 80 %", () => {
    mockStorage.value = storage();
    const { container } = render(<StorageBanner />);
    expect(container.textContent).toBe("");
  });

  it("alerte à 80 % et ouvre Paramètres > Stockage", () => {
    const open = vi.fn();
    mockStorage.value = storage({
      level: "warning",
      percent: 82,
      usedBytes: 82 * GB,
    });
    render(<StorageBanner onOpenStorage={open} />);
    expect(screen.getByTestId("bandeau-stockage").textContent).toContain(
      "utilisé à 82 %",
    );
    fireEvent.click(screen.getByText("Gérer le stockage"));
    expect(open).toHaveBeenCalled();
  });

  it("dit à 100 % que les nouveaux envois sont refusés", () => {
    mockPermissions.actions = {};
    mockStorage.value = storage({
      level: "full",
      percent: 100,
      usedBytes: 100 * GB,
    });
    render(<StorageBanner />);
    const text = screen.getByTestId("bandeau-stockage").textContent;
    expect(text).toContain("nouveaux envois de fichiers sont refusés");
    expect(text).toContain("Contactez la personne qui gère l'abonnement");
  });
});

describe("Fenêtre de refus d'envoi", () => {
  it("s'ouvre sur le refus avec le message de l'API et l'offre supérieure (Standard)", () => {
    render(<StorageQuotaDialog />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent(STORAGE_QUOTA_EVENT, {
          detail: {
            message:
              "Espace de stockage plein : 99 Go utilisés sur 100 Go. Ce fichier (2 Go) ne peut pas être enregistré.",
            details: { offer, interval: "month" },
          },
        }),
      );
    });
    expect(screen.getByText(/99 Go utilisés sur 100 Go/)).toBeTruthy();
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(screen.getByTestId("offre-superieure").textContent).toContain(
      "50,00 € TTC/mois",
    );
  });

  it("Entreprise : la fenêtre propose d'ajouter des packs", () => {
    render(<StorageQuotaDialog />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent(STORAGE_QUOTA_EVENT, {
          detail: {
            message: "Espace de stockage plein : 5 To utilisés sur 5 To.",
            details: { offer: enterpriseOffer, interval: "month" },
          },
        }),
      );
    });
    expect(screen.getByTestId("offre-packs").textContent).toContain(
      "Ajouter 1 pack de 50 Go",
    );
    expect(screen.queryByTestId("offre-superieure")).toBeNull();
  });

  it("prix des packs non configurés : la fenêtre le dit", () => {
    mockPacks.available = false;
    render(<StorageQuotaDialog />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent(STORAGE_QUOTA_EVENT, {
          detail: {
            message: "Espace de stockage plein",
            details: { offer: enterpriseOffer, interval: "month" },
          },
        }),
      );
    });
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(screen.getByTestId("packs-indisponibles")).toBeTruthy();
  });

  it("n'offre pas d'achat aux membres qui ne gèrent pas l'abonnement", () => {
    mockPermissions.actions = {};
    render(<StorageQuotaDialog />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent(STORAGE_QUOTA_EVENT, {
          detail: {
            message: "Espace de stockage plein",
            details: { offer: enterpriseOffer },
          },
        }),
      );
    });
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(screen.getByText(/Contactez la personne qui gère/)).toBeTruthy();
  });
});
