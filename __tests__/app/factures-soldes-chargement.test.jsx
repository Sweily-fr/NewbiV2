import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  HttpLink,
} from "@apollo/client";

// Page Factures clients : les soldes (CA facturé, CA payé, en retard) sont
// calculés sur les données que le tableau remonte. Elles arrivent par
// plusieurs requêtes (factures, factures importées, compteurs) : le tableau
// ne doit les remonter, et s'afficher, qu'une fois toutes là.

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/outils/factures",
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

vi.mock("@/src/graphql/invoiceQueries", async (importOriginal) => ({
  ...(await importOriginal()),
  useInvoices: () => donnees.factures,
}));
vi.mock("@/src/graphql/importedInvoiceQueries", async (importOriginal) => ({
  ...(await importOriginal()),
  useImportedInvoices: () => donnees.importees,
}));
vi.mock("@/src/graphql/creditNoteQueries", async (importOriginal) => ({
  ...(await importOriginal()),
  useCreditNotes: () => donnees.avoirs,
}));
vi.mock("@/src/graphql/invoiceRecurrenceQueries", async (importOriginal) => ({
  ...(await importOriginal()),
  useInvoiceRecurrences: () => donnees.recurrences,
}));
vi.mock("@/src/graphql/invoiceReminderQueries", async (importOriginal) => ({
  ...(await importOriginal()),
  useInvoiceReminderSettings: () => ({ data: undefined }),
}));
vi.mock("@/src/graphql/documentEmailQueries", async (importOriginal) => ({
  ...(await importOriginal()),
  useEmailTrackingSubscription: () => {},
}));

// Fenêtres, volets et actions de ligne : hors sujet ici
vi.mock(
  "@/app/dashboard/outils/factures/components/invoice-row-actions",
  () => ({
    default: () => null,
  }),
);
vi.mock("@/app/dashboard/outils/factures/components/invoice-sidebar", () => ({
  default: () => null,
}));
vi.mock(
  "@/app/dashboard/outils/factures/components/send-document-modal",
  () => ({
    SendDocumentModal: () => null,
  }),
);
vi.mock(
  "@/app/dashboard/outils/factures/components/SaveInvoiceTemplateDialog",
  () => ({ SaveInvoiceTemplateDialog: () => null }),
);
vi.mock(
  "@/app/dashboard/outils/factures/components/import-invoice-modal",
  () => ({
    ImportInvoiceModal: () => null,
  }),
);
vi.mock(
  "@/app/dashboard/outils/factures/components/imported-invoice-sidebar",
  () => ({ ImportedInvoiceSidebar: () => null }),
);
vi.mock(
  "@/app/dashboard/outils/factures/components/credit-notes-table",
  () => ({
    default: () => null,
  }),
);
vi.mock(
  "@/app/dashboard/outils/factures/components/recurring-invoices-table",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/dashboard/outils/factures/components/invoice-recurrence-dialog",
  () => ({ default: () => null }),
);
vi.mock("@/app/dashboard/outils/factures/components/invoice-filters", () => ({
  default: () => null,
}));

// Colonnes réelles hors sujet (et en JSX dans un .js, que vitest ne lit
// pas) : un tableau TanStack minimal, filtré comme la page le lit.
vi.mock("@/app/dashboard/outils/factures/hooks/use-invoice-table", async () => {
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
      accessorFn: (facture) => facture.number || facture.id,
    },
  ];
  return {
    useInvoiceTable: ({ data }) => {
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
        typeFilter: [],
        setTypeFilter: () => {},
        selectedRows: [],
        handleDeleteSelected: () => {},
        isDeleting: false,
      };
    },
  };
});

import InvoiceTable from "@/app/dashboard/outils/factures/components/invoice-table";

const client = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:4000/graphql", fetch }),
  cache: new InMemoryCache(),
});

const FACTURES = [
  {
    id: "f1",
    number: "F-2026-001",
    status: "COMPLETED",
    totalHT: 1000,
    finalTotalHT: 1000,
    finalTotalTTC: 1200,
    issueDate: "2026-11-02",
    dueDate: "2026-12-02",
    createdAt: "2026-11-02",
    client: { id: "c1", name: "Client A" },
  },
  {
    id: "f2",
    number: "F-2026-002",
    status: "PENDING",
    totalHT: 500,
    finalTotalHT: 500,
    finalTotalTTC: 600,
    issueDate: "2026-10-01",
    dueDate: "2026-10-31",
    createdAt: "2026-10-01",
    client: { id: "c2", name: "Client B" },
  },
  {
    id: "f3",
    number: "F-2026-003",
    status: "DRAFT",
    totalHT: 80,
    finalTotalHT: 80,
    finalTotalTTC: 96,
    issueDate: "2026-11-20",
    dueDate: "2026-12-20",
    createdAt: "2026-11-20",
    client: { id: "c1", name: "Client A" },
  },
];

const IMPORTEES = [
  {
    id: "i1",
    status: "VALIDATED",
    totalHT: 300,
    totalTTC: 360,
    invoiceDate: "2026-09-15",
    dueDate: null,
    createdAt: "2026-09-15",
    vendor: { name: "Client C" },
    client: { name: "Client C" },
  },
  {
    id: "i2",
    status: "VALIDATED",
    totalHT: 200,
    totalTTC: 240,
    invoiceDate: "2026-08-10",
    dueDate: null,
    createdAt: "2026-08-10",
    vendor: { name: "Client D" },
    client: { name: "Client D" },
  },
];

const refetch = () => Promise.resolve();

const facturesEnCours = () => ({
  invoices: [],
  loading: true,
  complete: false,
  error: null,
  refetch,
});
const facturesRecues = (invoices = FACTURES, complete = true) => ({
  invoices,
  loading: false,
  complete,
  error: null,
  refetch,
});
const importeesEnCours = () => ({
  importedInvoices: [],
  loading: true,
  initialLoading: true,
  refetch,
});
const importeesRecues = ({ rafraichissement = false } = {}) => ({
  importedInvoices: IMPORTEES,
  loading: rafraichissement,
  initialLoading: false,
  refetch,
});
const avoirsRecus = () => ({ totalCount: 2, loading: false });
const recurrencesRecues = () => ({
  recurrences: [],
  loading: false,
  initialLoading: false,
  error: null,
  refetch,
});

function Tableau({ onFilteredDataChange }) {
  return (
    <ApolloProvider client={client}>
      <InvoiceTable
        onFilteredDataChange={onFilteredDataChange}
        onSelectionChange={() => {}}
        onImportTriggered={() => {}}
      />
    </ApolloProvider>
  );
}

/** Ce que la page a reçu pour ses soldes, appel après appel. */
const remontees = (espion) => espion.mock.calls.map(([lignes]) => lignes);

describe("Factures clients : soldes affichés d'un coup au chargement", () => {
  beforeEach(() => {
    donnees.factures = facturesEnCours();
    donnees.importees = importeesEnCours();
    donnees.avoirs = { totalCount: 0, loading: true };
    donnees.recurrences = {
      recurrences: [],
      loading: true,
      initialLoading: true,
      error: null,
      refetch,
    };
  });

  it("n'affiche ni liste ni soldes tant que les factures importées ne sont pas arrivées", () => {
    const espion = vi.fn();
    const { rerender } = render(<Tableau onFilteredDataChange={espion} />);
    expect(screen.queryByText("Toutes les factures")).not.toBeInTheDocument();

    // Les factures arrivent seules (premier écran d'un poste lent)
    donnees.factures = facturesRecues();
    donnees.avoirs = avoirsRecus();
    donnees.recurrences = recurrencesRecues();
    rerender(<Tableau onFilteredDataChange={espion} />);
    expect(screen.queryByText("Toutes les factures")).not.toBeInTheDocument();
    expect(remontees(espion).every((lignes) => lignes === null)).toBe(true);

    // Puis les importées : tout apparaît, soldes compris, en une fois
    donnees.importees = importeesRecues();
    rerender(<Tableau onFilteredDataChange={espion} />);
    expect(screen.getByText("Toutes les factures")).toBeInTheDocument();
    const recues = remontees(espion).filter((lignes) => lignes !== null);
    expect(recues.length).toBeGreaterThan(0);
    // Jamais de liste partielle remontée : les 3 factures + 2 importées
    expect(recues.every((lignes) => lignes.length === 5)).toBe(true);
  });

  it("attend la liste entière des factures (la suite encore en cours)", () => {
    donnees.factures = facturesRecues(FACTURES.slice(0, 2), false);
    donnees.importees = importeesRecues();
    donnees.avoirs = avoirsRecus();
    donnees.recurrences = recurrencesRecues();
    const espion = vi.fn();
    const { rerender } = render(<Tableau onFilteredDataChange={espion} />);
    expect(screen.queryByText("Toutes les factures")).not.toBeInTheDocument();
    expect(remontees(espion).every((lignes) => lignes === null)).toBe(true);

    donnees.factures = facturesRecues(FACTURES, true);
    rerender(<Tableau onFilteredDataChange={espion} />);
    expect(screen.getByText("Toutes les factures")).toBeInTheDocument();
    const recues = remontees(espion).filter((lignes) => lignes !== null);
    expect(recues.every((lignes) => lignes.length === 5)).toBe(true);
  });

  it("attend aussi les compteurs d'avoirs et de factures récurrentes", () => {
    donnees.factures = facturesRecues();
    donnees.importees = importeesRecues();
    const espion = vi.fn();
    const { rerender } = render(<Tableau onFilteredDataChange={espion} />);
    expect(screen.queryByText("Toutes les factures")).not.toBeInTheDocument();

    donnees.avoirs = avoirsRecus();
    donnees.recurrences = recurrencesRecues();
    rerender(<Tableau onFilteredDataChange={espion} />);
    expect(screen.getByText("Toutes les factures")).toBeInTheDocument();
  });

  it("retour sur la page : le cache s'affiche aussitôt et le rafraîchissement ne remet pas les soldes en attente", () => {
    donnees.factures = facturesRecues();
    // Factures importées en cache, relues en arrière-plan
    donnees.importees = importeesRecues({ rafraichissement: true });
    donnees.avoirs = avoirsRecus();
    donnees.recurrences = recurrencesRecues();
    const espion = vi.fn();
    const { rerender } = render(<Tableau onFilteredDataChange={espion} />);
    expect(screen.getByText("Toutes les factures")).toBeInTheDocument();

    donnees.importees = importeesRecues();
    rerender(<Tableau onFilteredDataChange={espion} />);
    expect(screen.getByText("Toutes les factures")).toBeInTheDocument();
    expect(remontees(espion).every((lignes) => lignes?.length === 5)).toBe(
      true,
    );
  });
});
