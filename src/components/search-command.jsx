"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLazyQuery } from "@apollo/client";
import { SettingsModal } from "@/src/components/settings-modal";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/src/components/ui/command";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  Settings,
  CreditCard,
  Mail,
  Kanban,
  BarChart3,
  User,
  Package,
  UserCog,
  Workflow,
  Calendar,
  Share2,
  Upload,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { GET_CLIENTS } from "@/src/graphql/clientQueries";
import { GET_INVOICES, INVOICE_STATUS_LABELS } from "@/src/graphql/invoiceQueries";
import { GET_QUOTES, QUOTE_STATUS_LABELS } from "@/src/graphql/quoteQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";

// Helpers pour formater les montants et dates
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Icône de statut pour les factures
const InvoiceStatusIcon = ({ status }) => {
  const iconProps = { className: "mr-2 h-4 w-4" };
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 {...iconProps} className="mr-2 h-4 w-4 text-green-600" />;
    case "PENDING":
      return <Clock {...iconProps} className="mr-2 h-4 w-4 text-orange-600" />;
    case "CANCELED":
      return <XCircle {...iconProps} className="mr-2 h-4 w-4 text-red-600" />;
    default:
      return <Receipt {...iconProps} className="mr-2 h-4 w-4 text-gray-600" />;
  }
};

// Icône de statut pour les devis
const QuoteStatusIcon = ({ status }) => {
  const iconProps = { className: "mr-2 h-4 w-4" };
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 {...iconProps} className="mr-2 h-4 w-4 text-green-600" />;
    case "PENDING":
      return <Clock {...iconProps} className="mr-2 h-4 w-4 text-blue-600" />;
    case "CANCELED":
      return <XCircle {...iconProps} className="mr-2 h-4 w-4 text-red-600" />;
    default:
      return <FileText {...iconProps} className="mr-2 h-4 w-4 text-gray-600" />;
  }
};

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [settingsInitialTab, setSettingsInitialTab] =
    React.useState("preferences");
  const [searchQuery, setSearchQuery] = React.useState("");
  const router = useRouter();
  const { workspaceId } = useWorkspace();

  // Lazy queries pour la recherche
  const [searchClients, { data: clientsData, loading: clientsLoading }] =
    useLazyQuery(GET_CLIENTS, {
      fetchPolicy: "network-only",
    });

  const [searchInvoices, { data: invoicesData, loading: invoicesLoading }] =
    useLazyQuery(GET_INVOICES, {
      fetchPolicy: "network-only",
    });

  const [searchQuotes, { data: quotesData, loading: quotesLoading }] =
    useLazyQuery(GET_QUOTES, {
      fetchPolicy: "network-only",
    });

  const openSettings = React.useCallback((tab = "preferences") => {
    setSettingsInitialTab(tab);
    setSettingsModalOpen(true);
  }, []);

  // Debounce pour la recherche
  React.useEffect(() => {
    if (!workspaceId || !searchQuery || searchQuery.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      // Lancer les recherches en parallèle
      searchClients({
        variables: {
          workspaceId,
          search: searchQuery,
          limit: 5,
        },
      });

      searchInvoices({
        variables: {
          workspaceId,
          search: searchQuery,
          limit: 5,
        },
      });

      searchQuotes({
        variables: {
          workspaceId,
          search: searchQuery,
          limit: 5,
        },
      });
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [searchQuery, workspaceId, searchClients, searchInvoices, searchQuotes]);

  // Créer un événement global pour ouvrir la recherche
  React.useEffect(() => {
    const handleOpenSearch = () => {
      setOpen(true);
    };

    window.addEventListener("open-search-command", handleOpenSearch);

    // Raccourci clavier (Ctrl+K ou Cmd+K)
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-search-command", handleOpenSearch);
    };
  }, []);

  const runCommand = React.useCallback((command) => {
    setOpen(false);
    setSearchQuery(""); // Réinitialiser la recherche
    command();
  }, []);

  // Extraire les résultats
  const clients = clientsData?.clients?.items || [];
  const invoices = invoicesData?.invoices?.invoices || [];
  const quotes = quotesData?.quotes?.quotes || [];

  const isLoading = clientsLoading || invoicesLoading || quotesLoading;
  const hasResults = clients.length > 0 || invoices.length > 0 || quotes.length > 0;
  const isSearching = searchQuery.length >= 2;

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Tapez une commande ou recherchez..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching && !isLoading
              ? "Aucun résultat trouvé."
              : "Tapez au moins 2 caractères pour rechercher."}
          </CommandEmpty>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Recherche en cours...
              </span>
            </div>
          )}

          {/* Résultats de recherche dynamique */}
          {isSearching && hasResults && !isLoading && (
            <>
              {/* Clients */}
              {clients.length > 0 && (
                <>
                  <CommandGroup heading="Clients">
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        onSelect={() =>
                          runCommand(() =>
                            router.push(`/dashboard/clients?id=${client.id}`)
                          )
                        }
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">{client.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {client.email}
                            {client.address?.city && ` • ${client.address.city}`}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Factures */}
              {invoices.length > 0 && (
                <>
                  <CommandGroup heading="Factures">
                    {invoices.map((invoice) => (
                      <CommandItem
                        key={invoice.id}
                        onSelect={() =>
                          runCommand(() =>
                            router.push(
                              `/dashboard/outils/factures?id=${invoice.id}`
                            )
                          )
                        }
                      >
                        <InvoiceStatusIcon status={invoice.status} />
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {invoice.prefix}
                              {invoice.number}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                              {INVOICE_STATUS_LABELS[invoice.status]}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {invoice.client?.name} •{" "}
                            {formatCurrency(invoice.finalTotalTTC)} •{" "}
                            {formatDate(invoice.issueDate)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Devis */}
              {quotes.length > 0 && (
                <>
                  <CommandGroup heading="Devis">
                    {quotes.map((quote) => (
                      <CommandItem
                        key={quote.id}
                        onSelect={() =>
                          runCommand(() =>
                            router.push(`/dashboard/outils/devis?id=${quote.id}`)
                          )
                        }
                      >
                        <QuoteStatusIcon status={quote.status} />
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {quote.prefix}
                              {quote.number}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                              {QUOTE_STATUS_LABELS[quote.status]}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {quote.client?.name} •{" "}
                            {formatCurrency(quote.finalTotalTTC)} •{" "}
                            {formatDate(quote.issueDate)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
            </>
          )}

          {/* Navigation statique */}
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard"))}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Tableau de bord</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/clients"))
              }
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Clients</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/catalogues"))
              }
            >
              <Package className="mr-2 h-4 w-4" />
              <span>Catalogues</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/collaborateurs"))
              }
            >
              <UserCog className="mr-2 h-4 w-4" />
              <span>Collaborateurs</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/calendar"))
              }
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>Calendrier</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/analytics"))
              }
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/automatisation"))
              }
            >
              <Workflow className="mr-2 h-4 w-4" />
              <span>Automatisation</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => openSettings("preferences"))}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Mon compte</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Outils">
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/outils/factures"))
              }
            >
              <Receipt className="mr-2 h-4 w-4" />
              <span>Factures</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/outils/devis"))
              }
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Devis</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/outils/transactions"))
              }
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Transactions</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/outils/kanban"))
              }
            >
              <Kanban className="mr-2 h-4 w-4" />
              <span>Kanban</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push("/dashboard/outils/signatures-mail")
                )
              }
            >
              <Mail className="mr-2 h-4 w-4" />
              <span>Signatures de mail</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push("/dashboard/outils/documents-partages")
                )
              }
            >
              <Share2 className="mr-2 h-4 w-4" />
              <span>Documents partagés</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push("/dashboard/outils/transferts-fichiers")
                )
              }
            >
              <Upload className="mr-2 h-4 w-4" />
              <span>Transferts de fichiers</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Paramètres">
            <CommandItem
              onSelect={() => runCommand(() => openSettings("preferences"))}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres généraux</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => openSettings("generale"))}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Informations entreprise</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => openSettings("coordonnees-bancaires"))
              }
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Coordonnées bancaires</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => openSettings("informations-legales"))
              }
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Informations légales</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => openSettings("subscription"))}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Gérer mon abonnement</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Modal de paramètres */}
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialTab={settingsInitialTab}
      />
    </>
  );
}
