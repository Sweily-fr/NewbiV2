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

const offer = {
  neededBytes: 76 * GB,
  currentMonthlyCost: 17.99,
  recommended: "packs",
  packs: {
    additionalPacks: 1,
    totalPacks: 1,
    monthlyCost: 20.98,
    extraMonthlyCost: 2.99,
    billedPrice: 2.99,
    interval: "month",
    addedBytes: 50 * GB,
  },
  upgrade: {
    plan: "pme",
    label: "TPE",
    packs: 0,
    planMonthlyPrice: 48.99,
    monthlyCost: 48.99,
    quotaBytes: 400 * GB,
  },
};

function storage(overrides = {}) {
  return {
    workspaceId: "org1",
    ready: true,
    plan: "freelance",
    planLabel: "Freelance",
    interval: "month",
    subscriptionActive: true,
    usedBytes: 30 * GB,
    quotaBytes: 75 * GB,
    baseQuotaBytes: 75 * GB,
    remainingBytes: 45 * GB,
    percent: 40,
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
      "30 Go utilisés sur 75 Go, il vous reste 45 Go.",
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

  it("propose d'ajouter du stockage ou de passer à l'offre TPE", () => {
    mockStorage.value = storage();
    render(<StorageSection />);
    expect(
      screen.getByText("Ajouter du stockage", { selector: "button" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Passer à l'offre TPE", { selector: "button" }),
    ).toBeTruthy();
    expect(screen.getByTestId("offre-packs").textContent).toContain(
      "2,99 € TTC/mois de plus",
    );
  });

  it("masque l'achat de packs quand les prix Stripe ne sont pas configurés", () => {
    mockPacks.available = false;
    mockStorage.value = storage();
    render(<StorageSection />);
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(screen.getByTestId("offre-superieure")).toBeTruthy();
    expect(screen.getByTestId("packs-indisponibles").textContent).toContain(
      "n'est pas disponible pour le moment",
    );
  });

  it("offre Entreprise sans prix Stripe : le message reste, sans case vide", () => {
    mockPacks.available = false;
    mockStorage.value = storage({
      plan: "entreprise",
      planLabel: "Entreprise",
      offer: { ...offer, upgrade: null, recommended: "packs" },
    });
    render(<StorageSection />);
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(screen.queryByTestId("offre-superieure")).toBeNull();
    expect(screen.getByTestId("packs-indisponibles")).toBeTruthy();
  });

  it("sans abonnement actif : un abonnement est demandé pour les packs", () => {
    mockStorage.value = storage({ subscriptionActive: false });
    render(<StorageSection />);
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(screen.getByTestId("packs-indisponibles").textContent).toContain(
      "abonnement actif est nécessaire",
    );
  });

  it("montre les packs actifs", () => {
    mockStorage.value = storage({
      packs: 2,
      packBytes: 100 * GB,
      quotaBytes: 175 * GB,
    });
    render(<StorageSection />);
    expect(screen.getByTestId("stockage-packs").textContent).toContain(
      "2 packs de 50 Go",
    );
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
      usedBytes: 61.5 * GB,
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
      usedBytes: 75 * GB,
    });
    render(<StorageBanner />);
    const text = screen.getByTestId("bandeau-stockage").textContent;
    expect(text).toContain("nouveaux envois de fichiers sont refusés");
    expect(text).toContain("Contactez la personne qui gère l'abonnement");
  });
});

describe("Fenêtre de refus d'envoi", () => {
  it("s'ouvre sur le refus avec le message de l'API et les deux options", () => {
    render(<StorageQuotaDialog />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent(STORAGE_QUOTA_EVENT, {
          detail: {
            message:
              "Espace de stockage plein : 74 Go utilisés sur 75 Go. Ce fichier (2 Go) ne peut pas être enregistré.",
            details: { offer, interval: "month" },
          },
        }),
      );
    });
    expect(screen.getByText(/74 Go utilisés sur 75 Go/)).toBeTruthy();
    expect(screen.getByTestId("offre-packs").textContent).toContain(
      "Ajouter 1 pack de 50 Go",
    );
    expect(screen.getByTestId("offre-superieure").textContent).toContain(
      "48,99 € TTC/mois",
    );
  });

  it("prix des packs non configurés : la fenêtre le dit", () => {
    mockPacks.available = false;
    render(<StorageQuotaDialog />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent(STORAGE_QUOTA_EVENT, {
          detail: {
            message: "Espace de stockage plein",
            details: { offer, interval: "month" },
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
          detail: { message: "Espace de stockage plein", details: { offer } },
        }),
      );
    });
    expect(screen.queryByTestId("offre-packs")).toBeNull();
    expect(screen.getByText(/Contactez la personne qui gère/)).toBeTruthy();
  });
});
