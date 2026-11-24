import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Page Bons de commande : les totaux (commandé, confirmé, en cours) sont
// calculés sur la liste des BC. Ils ne s'affichent qu'avec la liste entière
// et une fois le tableau prêt (BC importés compris), jamais sur une liste
// partielle. Le tableau lui-même : bons-commande-totaux-chargement.test.jsx.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/outils/bons-commande",
}));

vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({
    isReady: true,
    canDo: () => true,
    canRead: () => true,
    canDelete: () => true,
  }),
}));

vi.mock("@/src/hooks/use-mobile", () => ({ useIsMobile: () => false }));

// Données de la page et état du tableau, modifiés d'une étape à l'autre
const donnees = vi.hoisted(() => ({}));

vi.mock("@/src/graphql/purchaseOrderQueries", async (importOriginal) => ({
  ...(await importOriginal()),
  usePurchaseOrders: () => donnees.bons,
}));

// Tableau simulé : il signale qu'il est prêt comme le vrai (avant peinture)
vi.mock(
  "@/app/dashboard/outils/bons-commande/components/purchase-order-table",
  async () => {
    const { useLayoutEffect: avantPeinture } = await import("react");
    return {
      default: function TableauSimule({ onDataReadyChange }) {
        const pret = donnees.tablePrete;
        avantPeinture(() => {
          onDataReadyChange?.(pret);
        }, [onDataReadyChange, pret]);
        return null;
      },
    };
  },
);

vi.mock(
  "@/app/dashboard/outils/bons-commande/components/purchase-order-export-button",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/dashboard/outils/bons-commande/components/purchase-order-settings-modal",
  () => ({ PurchaseOrderSettingsModal: () => null }),
);
vi.mock(
  "@/app/dashboard/outils/factures/components/send-document-modal",
  () => ({
    SendDocumentModal: () => null,
  }),
);
vi.mock("@/src/components/pro-route-guard", () => ({
  ProRouteGuard: ({ children }) => children,
}));
vi.mock("@/src/components/rbac", () => ({
  PermissionButton: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
vi.mock("@/src/components/ui/toast-manager", () => ({
  useToastManager: () => ({ add: vi.fn() }),
}));
vi.mock("@/src/components/company-info-gate", () => ({
  useGoToCreation: () => vi.fn(),
}));

import PurchaseOrdersPage from "@/app/dashboard/outils/bons-commande/page";

const BONS = [
  { id: "bc1", status: "IN_PROGRESS", totalHT: 1000, finalTotalHT: 1000 },
  { id: "bc2", status: "CONFIRMED", totalHT: 500, finalTotalHT: 500 },
  { id: "bc3", status: "DRAFT", totalHT: 80, finalTotalHT: 80 },
];

const refetch = () => Promise.resolve();
const bons = (purchaseOrders, complete) => ({
  purchaseOrders,
  loading: !complete && purchaseOrders.length === 0,
  complete,
  error: null,
  refetch,
});

// Total commandé, total confirmé, en cours de traitement
const totaux = () =>
  screen
    .getAllByText(/^(\.\.\.|[\d\s ,]+ €)$/)
    .map((element) => element.textContent);

describe("Bons de commande : totaux affichés avec la liste", () => {
  beforeEach(() => {
    donnees.bons = bons([], false);
    donnees.tablePrete = false;
  });

  it("« ... » tant que la liste ou le tableau n'est pas prêt, puis les totaux de la liste entière", () => {
    const { rerender } = render(<PurchaseOrdersPage />);
    expect(totaux()).toEqual(["...", "...", "..."]);

    // Liste partielle (la suite arrive) : pas de total intermédiaire
    donnees.bons = bons(BONS.slice(0, 1), false);
    rerender(<PurchaseOrdersPage />);
    expect(totaux()).toEqual(["...", "...", "..."]);

    // Liste entière, mais BC importés du tableau encore en route
    donnees.bons = bons(BONS, true);
    rerender(<PurchaseOrdersPage />);
    expect(totaux()).toEqual(["...", "...", "..."]);

    // Tout est là : totaux et liste ensemble
    donnees.tablePrete = true;
    rerender(<PurchaseOrdersPage />);
    const [commande, confirme, enCours] = totaux();
    expect(commande).toMatch(/^1\s?580,00 €$/);
    expect(confirme).toMatch(/^1\s?500,00 €$/);
    expect(enCours).toMatch(/^1\s?000,00 €$/);
  });

  it("retour sur la page : cache complet et tableau prêt, totaux affichés d'emblée", () => {
    donnees.bons = bons(BONS, true);
    donnees.tablePrete = true;
    render(<PurchaseOrdersPage />);
    expect(totaux()).not.toContain("...");
  });
});
