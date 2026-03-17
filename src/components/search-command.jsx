"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLazyQuery } from "@apollo/client";
import { SettingsModal } from "@/src/components/settings-modal";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/src/components/ui/command";
import {
  Dialog,
  DialogContent,
} from "@/src/components/ui/dialog";
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
  Plus,
  CornerDownLeft,
  ArrowUpDown,
  ShoppingCart,
  RotateCcw,
  History,
} from "lucide-react";
import { GET_CLIENTS } from "@/src/graphql/clientQueries";
import { GET_INVOICES, INVOICE_STATUS_LABELS } from "@/src/graphql/invoiceQueries";
import { GET_QUOTES, QUOTE_STATUS_LABELS } from "@/src/graphql/quoteQueries";
import { GET_PRODUCTS } from "@/src/graphql/queries/products";
import { GET_PURCHASE_ORDERS, PURCHASE_ORDER_STATUS_LABELS } from "@/src/graphql/purchaseOrderQueries";
import { GET_CREDIT_NOTES } from "@/src/graphql/creditNoteQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";

// --- Helpers ---

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const formatRelativeDate = (date) => {
  if (!date) return "";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// --- Recents (localStorage) ---

const RECENTS_KEY = "newbi-search-recents";
const MAX_RECENTS = 5;

const getRecents = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  } catch {
    return [];
  }
};

const addRecent = (item) => {
  try {
    const recents = getRecents().filter((r) => r.id !== item.id);
    recents.unshift(item);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
  } catch {}
};

// --- Icon components ---

const IconWrapper = ({ children }) => (
  <div className="relative flex items-center justify-center size-7 rounded-md bg-muted/50 mr-0.5 shrink-0">
    {children}
    <span className="absolute inset-0 rounded-[inherit] border border-black/5 dark:border-white/10 pointer-events-none" />
  </div>
);

const StatusDot = ({ color }) => (
  <span className={`size-1.5 rounded-full ${color} shrink-0`} />
);

const InvoiceStatusIcon = ({ status }) => {
  const cls = "size-3.5";
  let icon;
  switch (status) {
    case "COMPLETED":
      icon = <CheckCircle2 className={`${cls} text-green-600`} />; break;
    case "PENDING":
      icon = <Clock className={`${cls} text-orange-600`} />; break;
    case "CANCELED":
      icon = <XCircle className={`${cls} text-red-600`} />; break;
    default:
      icon = <Receipt className={`${cls} text-gray-600`} />;
  }
  return <IconWrapper>{icon}</IconWrapper>;
};

const QuoteStatusIcon = ({ status }) => {
  const cls = "size-3.5";
  let icon;
  switch (status) {
    case "COMPLETED":
      icon = <CheckCircle2 className={`${cls} text-green-600`} />; break;
    case "PENDING":
      icon = <Clock className={`${cls} text-blue-600`} />; break;
    case "CANCELED":
      icon = <XCircle className={`${cls} text-red-600`} />; break;
    default:
      icon = <FileText className={`${cls} text-gray-600`} />;
  }
  return <IconWrapper>{icon}</IconWrapper>;
};

const PurchaseOrderStatusIcon = ({ status }) => {
  const cls = "size-3.5";
  let icon;
  switch (status) {
    case "DELIVERED":
      icon = <CheckCircle2 className={`${cls} text-green-600`} />; break;
    case "CONFIRMED":
    case "IN_PROGRESS":
      icon = <Clock className={`${cls} text-blue-600`} />; break;
    case "CANCELED":
      icon = <XCircle className={`${cls} text-red-600`} />; break;
    default:
      icon = <ShoppingCart className={`${cls} text-gray-600`} />;
  }
  return <IconWrapper>{icon}</IconWrapper>;
};

const CreditNoteStatusIcon = ({ status }) => {
  const cls = "size-3.5";
  let icon;
  switch (status) {
    case "COMPLETED":
      icon = <CheckCircle2 className={`${cls} text-green-600`} />; break;
    case "PENDING":
      icon = <Clock className={`${cls} text-orange-600`} />; break;
    case "CANCELED":
      icon = <XCircle className={`${cls} text-red-600`} />; break;
    default:
      icon = <RotateCcw className={`${cls} text-gray-600`} />;
  }
  return <IconWrapper>{icon}</IconWrapper>;
};

// Client initials avatar
const ClientAvatar = ({ name }) => {
  const initials = (name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="relative flex items-center justify-center size-7 rounded-md bg-[#5b4eff]/10 mr-0.5 shrink-0">
      <span className="text-[10px] font-medium text-[#5b4eff]">{initials}</span>
      <span className="absolute inset-0 rounded-[inherit] border border-black/5 dark:border-white/10 pointer-events-none" />
    </div>
  );
};

// Kbd component
const Kbd = ({ children, className = "" }) => (
  <kbd className={`inline-flex items-center justify-center h-5 min-w-5 px-1 rounded border border-border/60 bg-muted/60 text-[10px] font-medium text-muted-foreground ${className}`}>
    {children}
  </kbd>
);

// --- Main component ---

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = React.useState("preferences");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [recents, setRecents] = React.useState([]);
  const router = useRouter();
  const { workspaceId } = useWorkspace();

  // Lazy queries
  const [searchClients, { data: clientsData, loading: clientsLoading }] =
    useLazyQuery(GET_CLIENTS, { fetchPolicy: "cache-and-network" });

  const [searchInvoices, { data: invoicesData, loading: invoicesLoading }] =
    useLazyQuery(GET_INVOICES, { fetchPolicy: "cache-and-network" });

  const [searchQuotes, { data: quotesData, loading: quotesLoading }] =
    useLazyQuery(GET_QUOTES, { fetchPolicy: "cache-and-network" });

  const [searchProducts, { data: productsData, loading: productsLoading }] =
    useLazyQuery(GET_PRODUCTS, { fetchPolicy: "cache-and-network" });

  const [searchPurchaseOrders, { data: purchaseOrdersData, loading: purchaseOrdersLoading }] =
    useLazyQuery(GET_PURCHASE_ORDERS, { fetchPolicy: "cache-and-network" });

  const [searchCreditNotes, { data: creditNotesData, loading: creditNotesLoading }] =
    useLazyQuery(GET_CREDIT_NOTES, { fetchPolicy: "cache-and-network" });

  const openSettings = React.useCallback((tab = "preferences") => {
    setSettingsInitialTab(tab);
    setSettingsModalOpen(true);
  }, []);

  // Load recents on open
  React.useEffect(() => {
    if (open) {
      setRecents(getRecents());
    }
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    if (!workspaceId || !searchQuery || searchQuery.length < 2) return;

    const timer = setTimeout(() => {
      const vars = { variables: { workspaceId, search: searchQuery, limit: 4 } };
      searchClients(vars);
      searchInvoices(vars);
      searchQuotes(vars);
      searchProducts(vars);
      searchPurchaseOrders(vars);
      searchCreditNotes(vars);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, workspaceId, searchClients, searchInvoices, searchQuotes, searchProducts, searchPurchaseOrders, searchCreditNotes]);

  // Global events + keyboard shortcut
  React.useEffect(() => {
    const handleOpenSearch = () => setOpen(true);
    window.addEventListener("open-search-command", handleOpenSearch);

    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-search-command", handleOpenSearch);
    };
  }, []);

  const runCommand = React.useCallback((command, recentItem) => {
    setOpen(false);
    setSearchQuery("");
    if (recentItem) addRecent(recentItem);
    command();
  }, []);

  // Extract results
  const clients = clientsData?.clients?.items || [];
  const invoices = invoicesData?.invoices?.invoices || [];
  const quotes = quotesData?.quotes?.quotes || [];
  const products = productsData?.products?.products || [];
  const purchaseOrders = purchaseOrdersData?.purchaseOrders?.purchaseOrders || [];
  const creditNotes = creditNotesData?.creditNotes?.creditNotes || [];

  const isLoading = clientsLoading || invoicesLoading || quotesLoading || productsLoading || purchaseOrdersLoading || creditNotesLoading;
  const hasResults = clients.length > 0 || invoices.length > 0 || quotes.length > 0 || products.length > 0 || purchaseOrders.length > 0 || creditNotes.length > 0;
  const isSearching = searchQuery.length >= 2;

  // Status label for credit notes (no export from queries)
  const creditNoteStatusLabel = (status) => {
    switch (status) {
      case "COMPLETED": return "Finalisé";
      case "PENDING": return "En attente";
      case "CANCELED": return "Annulé";
      case "DRAFT": return "Brouillon";
      default: return status;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
          <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1] flex flex-col">
            <Command className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]]:rounded-lg">
              <CommandInput
                placeholder="Rechercher ou aller à..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="min-h-[360px] max-h-[360px] [&_[cmdk-empty]]:flex [&_[cmdk-empty]]:items-center [&_[cmdk-empty]]:justify-center [&_[cmdk-empty]]:h-full [&_[cmdk-empty]]:min-h-[360px]">
                <CommandEmpty>
                  {isSearching && !isLoading
                    ? "Aucun résultat trouvé."
                    : "Tapez pour rechercher des clients, factures, devis..."}
                </CommandEmpty>

                {/* Loading */}
                {isLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-xs text-muted-foreground">Recherche...</span>
                  </div>
                )}

                {/* --- Search results --- */}
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
                                runCommand(
                                  () => router.push(`/dashboard/clients?id=${client.id}`),
                                  { id: `client-${client.id}`, label: client.name, type: "client", url: `/dashboard/clients?id=${client.id}` }
                                )
                              }
                            >
                              <ClientAvatar name={client.name} />
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium truncate">{client.name}</span>
                                <span className="text-xs text-muted-foreground truncate">
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
                                runCommand(
                                  () => router.push(`/dashboard/outils/factures?id=${invoice.id}`),
                                  { id: `inv-${invoice.id}`, label: `${invoice.prefix}${invoice.number}`, type: "facture", url: `/dashboard/outils/factures?id=${invoice.id}` }
                                )
                              }
                            >
                              <InvoiceStatusIcon status={invoice.status} />
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{invoice.prefix}{invoice.number}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {INVOICE_STATUS_LABELS[invoice.status]}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground truncate">
                                  {invoice.client?.name} • {formatCurrency(invoice.finalTotalTTC)} • {formatRelativeDate(invoice.issueDate)}
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
                                runCommand(
                                  () => router.push(`/dashboard/outils/devis?id=${quote.id}`),
                                  { id: `quote-${quote.id}`, label: `${quote.prefix}${quote.number}`, type: "devis", url: `/dashboard/outils/devis?id=${quote.id}` }
                                )
                              }
                            >
                              <QuoteStatusIcon status={quote.status} />
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{quote.prefix}{quote.number}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {QUOTE_STATUS_LABELS[quote.status]}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground truncate">
                                  {quote.client?.name} • {formatCurrency(quote.finalTotalTTC)} • {formatRelativeDate(quote.issueDate)}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandSeparator />
                      </>
                    )}

                    {/* Bons de commande */}
                    {purchaseOrders.length > 0 && (
                      <>
                        <CommandGroup heading="Bons de commande">
                          {purchaseOrders.map((po) => (
                            <CommandItem
                              key={po.id}
                              onSelect={() =>
                                runCommand(
                                  () => router.push(`/dashboard/outils/bons-commande?id=${po.id}`),
                                  { id: `po-${po.id}`, label: `${po.prefix}${po.number}`, type: "bon", url: `/dashboard/outils/bons-commande?id=${po.id}` }
                                )
                              }
                            >
                              <PurchaseOrderStatusIcon status={po.status} />
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{po.prefix}{po.number}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {PURCHASE_ORDER_STATUS_LABELS[po.status]}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground truncate">
                                  {po.client?.name} • {formatCurrency(po.finalTotalTTC)} • {formatRelativeDate(po.issueDate)}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandSeparator />
                      </>
                    )}

                    {/* Avoirs */}
                    {creditNotes.length > 0 && (
                      <>
                        <CommandGroup heading="Avoirs">
                          {creditNotes.map((cn) => (
                            <CommandItem
                              key={cn.id}
                              onSelect={() =>
                                runCommand(
                                  () => router.push(`/dashboard/outils/factures?avoir=${cn.id}`),
                                  { id: `cn-${cn.id}`, label: `${cn.prefix}${cn.number}`, type: "avoir", url: `/dashboard/outils/factures?avoir=${cn.id}` }
                                )
                              }
                            >
                              <CreditNoteStatusIcon status={cn.status} />
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{cn.prefix}{cn.number}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {creditNoteStatusLabel(cn.status)}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground truncate">
                                  {cn.client?.name} • {formatCurrency(cn.finalTotalTTC)} • {formatRelativeDate(cn.issueDate)}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandSeparator />
                      </>
                    )}

                    {/* Produits */}
                    {products.length > 0 && (
                      <>
                        <CommandGroup heading="Produits">
                          {products.map((product) => (
                            <CommandItem
                              key={product.id}
                              onSelect={() =>
                                runCommand(
                                  () => router.push(`/dashboard/catalogues?id=${product.id}`),
                                  { id: `prod-${product.id}`, label: product.name, type: "produit", url: `/dashboard/catalogues?id=${product.id}` }
                                )
                              }
                            >
                              <IconWrapper><Package className="size-3.5" /></IconWrapper>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium truncate">{product.name}</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {product.reference && `${product.reference} • `}{formatCurrency(product.unitPrice)}
                                  {product.category && ` • ${product.category}`}
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

                {/* --- Recents (when not searching) --- */}
                {!isSearching && recents.length > 0 && (
                  <>
                    <CommandGroup heading="Récents">
                      {recents.map((item) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => runCommand(() => router.push(item.url), item)}
                        >
                          <IconWrapper><History className="size-3.5 text-muted-foreground" /></IconWrapper>
                          <span className="flex-1 truncate">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground capitalize">{item.type}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

                {/* --- Quick actions (when not searching) --- */}
                {!isSearching && (
                  <>
                    <CommandGroup heading="Actions rapides">
                      <CommandItem
                        onSelect={() => runCommand(() => router.push("/dashboard/outils/factures?new=true"))}
                      >
                        <IconWrapper><Plus className="size-3.5 text-[#5b4eff]" /></IconWrapper>
                        <span>Nouvelle facture</span>
                      </CommandItem>
                      <CommandItem
                        onSelect={() => runCommand(() => router.push("/dashboard/outils/devis?new=true"))}
                      >
                        <IconWrapper><Plus className="size-3.5 text-[#5b4eff]" /></IconWrapper>
                        <span>Nouveau devis</span>
                      </CommandItem>
                      <CommandItem
                        onSelect={() => runCommand(() => router.push("/dashboard/outils/bons-commande?new=true"))}
                      >
                        <IconWrapper><Plus className="size-3.5 text-[#5b4eff]" /></IconWrapper>
                        <span>Nouveau bon de commande</span>
                      </CommandItem>
                      <CommandItem
                        onSelect={() => runCommand(() => router.push("/dashboard/clients?new=true"))}
                      >
                        <IconWrapper><Plus className="size-3.5 text-[#5b4eff]" /></IconWrapper>
                        <span>Nouveau client</span>
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

                {/* --- Navigation --- */}
                <CommandGroup heading="Navigation">
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                        <IconWrapper><LayoutDashboard className="size-3.5" /></IconWrapper>
                        <span>Tableau de bord</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/clients"))}>
                        <IconWrapper><Users className="size-3.5" /></IconWrapper>
                        <span>Clients</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/catalogues"))}>
                        <IconWrapper><Package className="size-3.5" /></IconWrapper>
                        <span>Catalogues</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => openSettings("espaces"))}>
                        <IconWrapper><UserCog className="size-3.5" /></IconWrapper>
                        <span>Collaborateurs</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/calendar"))}>
                        <IconWrapper><Calendar className="size-3.5" /></IconWrapper>
                        <span>Calendrier</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/analytics"))}>
                        <IconWrapper><BarChart3 className="size-3.5" /></IconWrapper>
                        <span>Analytics</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/automatisation"))}>
                        <IconWrapper><Workflow className="size-3.5" /></IconWrapper>
                        <span>Automatisation</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => openSettings("preferences"))}>
                        <IconWrapper><User className="size-3.5" /></IconWrapper>
                        <span>Mon compte</span>
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Outils">
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/factures"))}>
                        <IconWrapper><Receipt className="size-3.5" /></IconWrapper>
                        <span>Factures</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/devis"))}>
                        <IconWrapper><FileText className="size-3.5" /></IconWrapper>
                        <span>Devis</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/bons-commande"))}>
                        <IconWrapper><ShoppingCart className="size-3.5" /></IconWrapper>
                        <span>Bons de commande</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/transactions"))}>
                        <IconWrapper><CreditCard className="size-3.5" /></IconWrapper>
                        <span>Transactions</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/kanban"))}>
                        <IconWrapper><Kanban className="size-3.5" /></IconWrapper>
                        <span>Kanban</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/signatures-mail"))}>
                        <IconWrapper><Mail className="size-3.5" /></IconWrapper>
                        <span>Signatures de mail</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/documents-partages"))}>
                        <IconWrapper><Share2 className="size-3.5" /></IconWrapper>
                        <span>Documents partagés</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/transferts-fichiers"))}>
                        <IconWrapper><Upload className="size-3.5" /></IconWrapper>
                        <span>Transferts de fichiers</span>
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Paramètres">
                      <CommandItem onSelect={() => runCommand(() => openSettings("preferences"))}>
                        <IconWrapper><Settings className="size-3.5" /></IconWrapper>
                        <span>Paramètres généraux</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => openSettings("generale"))}>
                        <IconWrapper><User className="size-3.5" /></IconWrapper>
                        <span>Informations entreprise</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => openSettings("coordonnees-bancaires"))}>
                        <IconWrapper><CreditCard className="size-3.5" /></IconWrapper>
                        <span>Coordonnées bancaires</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => openSettings("informations-legales"))}>
                        <IconWrapper><FileText className="size-3.5" /></IconWrapper>
                        <span>Informations légales</span>
                      </CommandItem>
                      <CommandItem onSelect={() => runCommand(() => openSettings("subscription"))}>
                        <IconWrapper><CreditCard className="size-3.5" /></IconWrapper>
                        <span>Gérer mon abonnement</span>
                      </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>

            {/* Footer */}
            <div className="flex items-center gap-3 px-3 py-2 border-t border-border/40 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ArrowUpDown className="size-3" />
                Naviguer
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="size-3" />
                Ouvrir
              </span>
              <span className="flex items-center gap-1">
                <Kbd>Esc</Kbd>
                Fermer
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialTab={settingsInitialTab}
      />
    </>
  );
}
