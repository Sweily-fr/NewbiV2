import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  useParams: () => ({ id: "log-1" }),
}));

const workspace = vi.hoisted(() => ({ workspaceId: "org-a" }));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => workspace,
}));

const queries = vi.hoisted(() => ({ log: null, logs: [], error: null }));
vi.mock("@/src/graphql/documentEmailQueries", () => ({
  GET_DOCUMENT_EMAIL_LOGS: "GET_DOCUMENT_EMAIL_LOGS",
  useDocumentEmailLog: () => ({
    data: queries.log ? { documentEmailLog: queries.log } : undefined,
    loading: false,
    error: queries.error,
  }),
  useDocumentEmailLogs: () => ({
    data: { documentEmailLogs: queries.logs },
  }),
}));

const apollo = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal()),
  useApolloClient: () => apollo,
}));

const toastError = vi.hoisted(() => vi.fn());
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: toastError, success: vi.fn() },
}));

import { TooltipProvider } from "@/src/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import EmailSentPage from "@/app/dashboard/emails-envoyes/[id]/page";
import { DocumentEmailHistory } from "@/src/components/document-email-history";
import { SentEmailMenuItem } from "@/src/components/sent-email-menu-item";
import { emailLogDocumentUrl } from "@/src/utils/document-email-log";

const LOG = {
  id: "log-1",
  workspaceId: "org-a",
  workspaceName: "Espace A",
  documentType: "invoice",
  documentId: "inv-1",
  documentNumber: "F-2026-000042",
  originalInvoiceId: null,
  sentAt: "2026-10-26T09:12:00.000Z",
  senderEmail: "emetteur@test.fr",
  from: "Société A <no-reply@newbi.fr>",
  replyTo: "contact@societe-a.fr",
  to: "client@test.fr",
  cc: ["compta@test.fr"],
  bcc: [],
  subject: "Facture F-2026-000042",
  html: "<html><body><p>Bonjour, voici votre facture.</p></body></html>",
  attachments: [
    { filename: "F-2026-000042.pdf", size: 52000, isDocument: true },
    { filename: "cgv.pdf", size: 1200, isDocument: false },
  ],
  deliveryStatus: "DELIVERED",
  deliveredAt: "2026-10-26T09:12:04.000Z",
  deliveryFailedAt: null,
  deliveryFailureReason: null,
  openedAt: null,
};

function renderPage() {
  return render(
    <TooltipProvider>
      <EmailSentPage />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  workspace.workspaceId = "org-a";
  queries.log = { ...LOG };
  queries.logs = [];
  queries.error = null;
});

describe("page d'un e-mail envoyé", () => {
  it("montre l'e-mail reçu par le client et ses détails", () => {
    const { container } = renderPage();

    expect(screen.getByText("E-mail envoyé")).toBeInTheDocument();
    expect(
      screen.getByText("Société A <no-reply@newbi.fr>"),
    ).toBeInTheDocument();
    expect(screen.getByText("compta@test.fr")).toBeInTheDocument();
    expect(screen.getByText("Facture F-2026-000042")).toBeInTheDocument();
    expect(screen.getByText("Envoyé")).toBeInTheDocument();
    expect(screen.getByText("Remis le")).toBeInTheDocument();
    expect(screen.getByText("cgv.pdf")).toBeInTheDocument();
    expect(
      screen.getByText(/ne sont pas conservés, seul leur nom est affiché/),
    ).toBeInTheDocument();

    const frame = container.querySelector("iframe");
    expect(frame.getAttribute("srcdoc")).toContain("voici votre facture");
    // Pas de script dans l'e-mail affiché
    expect(frame.getAttribute("sandbox")).toBe("allow-same-origin");
  });

  it("ouvre le document de l'espace actif", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le document" }));

    expect(push).toHaveBeenCalledWith("/dashboard/outils/factures?id=inv-1");
  });

  it("envoi d'un autre espace : lisible, sans lien vers le document", () => {
    workspace.workspaceId = "org-b";

    renderPage();

    expect(
      screen.queryByRole("button", { name: "Ouvrir le document" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Envoyé depuis l'espace Espace A/),
    ).toBeInTheDocument();
  });

  it("explique un rejet", () => {
    queries.log = {
      ...LOG,
      deliveryStatus: "FAILED",
      deliveredAt: null,
      deliveryFailureReason: "L'adresse e-mail n'existe pas",
    };

    renderPage();

    expect(
      screen.getByText("Cet e-mail n'a pas été remis à client@test.fr"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/L'adresse e-mail n'existe pas\. Vérifiez l'adresse/),
    ).toBeInTheDocument();
  });

  it("envoi introuvable ou inaccessible", () => {
    queries.log = null;
    queries.error = new Error("Cet envoi est introuvable.");

    renderPage();

    expect(
      screen.getByText("Cet envoi est introuvable ou vous n'y avez pas accès."),
    ).toBeInTheDocument();
  });
});

describe("historique des envois d'un document", () => {
  it("liste les envois et ouvre l'aperçu d'un envoi", () => {
    const onNavigate = vi.fn();
    queries.logs = [
      { ...LOG, id: "log-2", to: "nouvelle@test.fr" },
      { ...LOG, deliveryStatus: "FAILED" },
    ];

    render(
      <TooltipProvider>
        <DocumentEmailHistory
          documentType="invoice"
          documentId="inv-1"
          onNavigate={onNavigate}
        />
      </TooltipProvider>,
    );

    expect(screen.getByText("Envois par e-mail")).toBeInTheDocument();
    expect(screen.getByText("Rejeté")).toBeInTheDocument();
    fireEvent.click(screen.getByText("nouvelle@test.fr"));
    expect(push).toHaveBeenCalledWith("/dashboard/emails-envoyes/log-2");
    expect(onNavigate).toHaveBeenCalled();
  });

  it("n'affiche rien sans envoi journalisé", () => {
    const { container } = render(
      <DocumentEmailHistory documentType="invoice" documentId="inv-1" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("« Voir l'e-mail envoyé » du menu d'actions", () => {
  function renderMenuItem(document) {
    return render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <SentEmailMenuItem documentType="quote" document={document} />
        </DropdownMenuContent>
      </DropdownMenu>,
    );
  }

  it("absent pour un document jamais envoyé ou envoyé avant l'historique", () => {
    renderMenuItem({ id: "q-1", emailTracking: { emailSentAt: LOG.sentAt } });
    expect(screen.queryByText("Voir l'e-mail envoyé")).not.toBeInTheDocument();
  });

  it("ouvre le dernier envoi du document", async () => {
    apollo.query.mockResolvedValue({
      data: { documentEmailLogs: [{ id: "log-9" }, { id: "log-1" }] },
    });
    renderMenuItem({
      id: "q-1",
      emailTracking: { emailSentAt: LOG.sentAt, deliveryStatus: "DELIVERED" },
    });

    fireEvent.click(screen.getByText("Voir l'e-mail envoyé"));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/emails-envoyes/log-9"),
    );
    expect(apollo.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          workspaceId: "org-a",
          documentType: "quote",
          documentId: "q-1",
        },
        fetchPolicy: "network-only",
      }),
    );
  });

  it("prévient quand l'envoi n'a pas d'aperçu", async () => {
    apollo.query.mockResolvedValue({ data: { documentEmailLogs: [] } });
    renderMenuItem({
      id: "q-1",
      emailTracking: { emailSentAt: LOG.sentAt, deliveryStatus: "SENT" },
    });

    fireEvent.click(screen.getByText("Voir l'e-mail envoyé"));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Aucun aperçu disponible pour cet envoi",
      ),
    );
    expect(push).not.toHaveBeenCalled();
  });
});

describe("lien vers le document envoyé", () => {
  it("avoir : page rattachée à sa facture d'origine", () => {
    expect(
      emailLogDocumentUrl({
        documentType: "creditNote",
        documentId: "av-1",
        originalInvoiceId: "inv-1",
      }),
    ).toBe("/dashboard/outils/factures/inv-1/avoir/av-1");
    expect(
      emailLogDocumentUrl({ documentType: "deliveryNote", documentId: "bl-1" }),
    ).toBe("/dashboard/outils/bons-de-livraison?id=bl-1");
  });
});
