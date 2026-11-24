import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  HttpLink,
} from "@apollo/client";

// Tableau des bons de commande : il réunit la liste des BC et les BC
// importés, lus par une autre requête. Il ne doit s'afficher, et signaler à
// la page qu'elle peut montrer ses totaux, qu'une fois toutes les données là.
// Les totaux eux-mêmes : bons-commande-page-totaux.test.jsx.

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/outils/bons-commande",
}));

vi.mock("@/src/hooks/useWorkspace", async (importOriginal) => ({
  ...(await importOriginal()),
  useRequiredWorkspace: () => ({ workspaceId: "ws-1", loading: false }),
  useWorkspace: () => ({ workspaceId: "ws-1", loading: false }),
}));

vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({
    isReady: true,
    loading: false,
    can: () => true,
    canDo: () => true,
    canRead: () => true,
    canWrite: () => true,
    canDelete: () => true,
  }),
}));

vi.mock("@/src/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isLoading: false,
    isReady: true,
    canView: async () => true,
    canCreate: async () => true,
    canEdit: async () => true,
    canDelete: async () => true,
  }),
}));

vi.mock("@/src/hooks/use-mobile", () => ({ useIsMobile: () => false }));

// Données des requêtes, modifiées d'une étape à l'autre du chargement
const donnees = vi.hoisted(() => ({}));

vi.mock("@/src/graphql/purchaseOrderQueries", async (importOriginal) => ({
  ...(await importOriginal()),
  usePurchaseOrders: () => donnees.bons,
}));
vi.mock(
  "@/src/graphql/importedPurchaseOrderQueries",
  async (importOriginal) => ({
    ...(await importOriginal()),
    useImportedPurchaseOrders: () => donnees.importes,
  }),
);
vi.mock("@/src/graphql/documentEmailQueries", async (importOriginal) => ({
  ...(await importOriginal()),
  useEmailTrackingSubscription: () => {},
}));

// Fenêtres, volets, filtres et actions de ligne : hors sujet ici
vi.mock(
  "@/app/dashboard/outils/bons-commande/components/purchase-order-row-actions",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/dashboard/outils/bons-commande/components/purchase-order-sidebar",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/dashboard/outils/bons-commande/components/purchase-order-filters",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/dashboard/outils/factures/components/send-document-modal",
  () => ({
    SendDocumentModal: () => null,
  }),
);
vi.mock(
  "@/app/dashboard/outils/bons-commande/components/SavePurchaseOrderTemplateDialog",
  () => ({ SavePurchaseOrderTemplateDialog: () => null }),
);
vi.mock(
  "@/app/dashboard/outils/bons-commande/components/import-purchase-order-modal",
  () => ({ ImportPurchaseOrderModal: () => null }),
);
vi.mock(
  "@/app/dashboard/outils/bons-commande/components/imported-purchase-order-sidebar",
  () => ({ ImportedPurchaseOrderSidebar: () => null }),
);
// Colonnes réelles hors sujet (et en JSX dans un .js, que vitest ne lit
// pas) : un tableau TanStack minimal.
vi.mock(
  "@/app/dashboard/outils/bons-commande/hooks/use-purchase-order-table",
  async () => {
    const {
      useReactTable,
      getCoreRowModel,
      getFilteredRowModel,
      getPaginationRowModel,
    } = await import("@tanstack/react-table");
    const colonnes = [
      {
        id: "number",
        header: "Numéro",
        accessorFn: (bon) => bon.number || bon.id,
      },
    ];
    return {
      usePurchaseOrderTable: ({ data }) => {
        const table = useReactTable({
          data,
          columns: colonnes,
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
        });
        return {
          table,
          globalFilter: "",
          setGlobalFilter: () => {},
          searchExact: false,
          setSearchExact: () => {},
          statusFilter: [],
          setStatusFilter: () => {},
          clientFilter: [],
          setClientFilter: () => {},
          dateFilter: null,
          setDateFilter: () => {},
          selectedRows: [],
          handleDeleteSelected: () => {},
          isDeleting: false,
        };
      },
    };
  },
);

import PurchaseOrderTable from "@/app/dashboard/outils/bons-commande/components/purchase-order-table";

const client = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:4000/graphql", fetch }),
  cache: new InMemoryCache(),
});

const BONS = [
  {
    id: "bc1",
    number: "BC-001",
    status: "IN_PROGRESS",
    totalHT: 1000,
    finalTotalHT: 1000,
    finalTotalTTC: 1200,
    issueDate: "2026-11-02",
    createdAt: "2026-11-02",
    client: { id: "c1", name: "Client A" },
  },
  {
    id: "bc2",
    number: "BC-002",
    status: "CONFIRMED",
    totalHT: 500,
    finalTotalHT: 500,
    finalTotalTTC: 600,
    issueDate: "2026-10-01",
    createdAt: "2026-10-01",
    client: { id: "c2", name: "Client B" },
  },
  {
    id: "bc3",
    number: "BC-003",
    status: "DRAFT",
    totalHT: 80,
    finalTotalHT: 80,
    finalTotalTTC: 96,
    issueDate: "2026-11-20",
    createdAt: "2026-11-20",
    client: { id: "c1", name: "Client A" },
  },
];

const IMPORTES = [
  {
    id: "i1",
    status: "VALIDATED",
    totalHT: 300,
    totalVAT: 60,
    totalTTC: 360,
    purchaseOrderDate: "2026-09-15",
    createdAt: "2026-09-15",
    vendor: { name: "Client C" },
    client: { name: "Client C" },
  },
];

const refetch = () => Promise.resolve();

const bonsEnCours = () => ({
  purchaseOrders: [],
  loading: true,
  complete: false,
  error: null,
  refetch,
});
const bonsRecus = (purchaseOrders = BONS, complete = true) => ({
  purchaseOrders,
  loading: false,
  complete,
  error: null,
  refetch,
});
const importesEnCours = () => ({
  importedPurchaseOrders: [],
  loading: true,
  initialLoading: true,
  refetch,
});
const importesRecus = ({ rafraichissement = false } = {}) => ({
  importedPurchaseOrders: IMPORTES,
  loading: rafraichissement,
  initialLoading: false,
  refetch,
});

beforeEach(() => {
  donnees.bons = bonsEnCours();
  donnees.importes = importesEnCours();
});

describe("Bons de commande : tableau affiché d'un coup", () => {
  function Tableau({ onDataReadyChange }) {
    return (
      <ApolloProvider client={client}>
        <PurchaseOrderTable
          onDataReadyChange={onDataReadyChange}
          onImportTriggered={() => {}}
        />
      </ApolloProvider>
    );
  }

  const ongletTous = () => screen.queryByRole("tab", { name: /^Tous/ });

  it("n'affiche rien tant que les BC importés ne sont pas arrivés", () => {
    const pret = vi.fn();
    const { rerender } = render(<Tableau onDataReadyChange={pret} />);
    expect(ongletTous()).not.toBeInTheDocument();

    donnees.bons = bonsRecus();
    rerender(<Tableau onDataReadyChange={pret} />);
    expect(ongletTous()).not.toBeInTheDocument();
    expect(pret.mock.calls.every(([etat]) => etat === false)).toBe(true);

    donnees.importes = importesRecus();
    rerender(<Tableau onDataReadyChange={pret} />);
    expect(ongletTous()).toBeInTheDocument();
    expect(pret).toHaveBeenLastCalledWith(true);
  });

  it("attend la liste entière des bons de commande", () => {
    donnees.bons = bonsRecus(BONS.slice(0, 2), false);
    donnees.importes = importesRecus();
    const pret = vi.fn();
    const { rerender } = render(<Tableau onDataReadyChange={pret} />);
    expect(ongletTous()).not.toBeInTheDocument();
    expect(pret.mock.calls.every(([etat]) => etat === false)).toBe(true);

    donnees.bons = bonsRecus(BONS, true);
    rerender(<Tableau onDataReadyChange={pret} />);
    expect(ongletTous()).toBeInTheDocument();
    expect(pret).toHaveBeenLastCalledWith(true);
  });

  it("retour sur la page : le cache s'affiche aussitôt, le rafraîchissement ne le masque pas", () => {
    donnees.bons = bonsRecus();
    donnees.importes = importesRecus({ rafraichissement: true });
    const pret = vi.fn();
    const { rerender } = render(<Tableau onDataReadyChange={pret} />);
    expect(ongletTous()).toBeInTheDocument();

    donnees.importes = importesRecus();
    rerender(<Tableau onDataReadyChange={pret} />);
    expect(ongletTous()).toBeInTheDocument();
    expect(pret.mock.calls.every(([etat]) => etat === true)).toBe(true);
  });
});
