"use client";

import { useState, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  SlidersHorizontal,
  ChevronDown,
  ExternalLink,
  Settings,
} from "lucide-react";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import InvoiceSidebar from "@/app/dashboard/outils/factures/components/invoice-sidebar";
import QuoteSidebar from "@/app/dashboard/outils/devis/components/quote-sidebar";

// Action text per activity type
function getActionText(activity) {
  const meta = activity.metadata || {};
  const docNum = meta.documentNumber ? ` ${meta.documentNumber}` : "";

  // Pour "updated", utiliser la description directement comme texte d'action
  // La description contient déjà "a modifié le nom, l'email..."
  if (activity.type === "updated" && activity.description) {
    return activity.description;
  }

  const actions = {
    created: "a créé le client",
    updated: "a mis à jour la fiche",
    invoice_created: `a créé la facture${docNum}`,
    invoice_status_changed: `a modifié le statut de la facture${docNum}`,
    quote_created: `a créé le devis${docNum}`,
    quote_status_changed: `a modifié le statut du devis${docNum}`,
    credit_note_created: `a créé un avoir${docNum}`,
    note_added: "a ajouté une note",
    note_updated: "a modifié une note",
    note_deleted: "a supprimé une note",
    document_email_sent: `a envoyé un email${docNum ? ` pour${docNum}` : ""}`,
    invoice_reminder_sent: `a envoyé une relance${docNum ? ` pour${docNum}` : ""}`,
    reminder_created: "a créé un rappel",
    crm_email_sent: `a reçu un email automatique${meta.automationName ? ` "${meta.automationName}"` : ""}`,
    blocked: "a été bloqué",
    unblocked: "a été débloqué",
  };
  return actions[activity.type] || "a effectué une action";
}

function isThisWeek(date) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return date >= monday;
}

function isThisMonth(date) {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function getPeriodLabel(dateString) {
  const date = new Date(dateString);
  if (isThisWeek(date)) return "Cette semaine";
  if (isThisMonth(date)) return "Ce mois-ci";
  const month = format(date, "MMMM", { locale: fr });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

function formatRelativeDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD === 1) return "hier";
  if (diffD < 7) return `il y a ${diffD} jours`;
  if (diffD < 30) return `il y a ${Math.floor(diffD / 7)} sem.`;
  if (diffD < 365) return `il y a ${Math.floor(diffD / 30)} mois`;
  return `il y a ${Math.floor(diffD / 365)} an${Math.floor(diffD / 365) > 1 ? "s" : ""}`;
}

const isSystemType = (type) =>
  type === "crm_email_sent" || type === "blocked" || type === "unblocked";

const FILTER_TYPES = [
  { label: "Tout", value: null },
  { label: "Factures", value: "invoice" },
  { label: "Devis", value: "quote" },
  { label: "Emails", value: "email" },
  { label: "Notes", value: "note" },
  { label: "Rappels", value: "reminder" },
];

export default function ClientActivityTab({ client }) {
  const [filterType, setFilterType] = useState(null);
  const [collapsedPeriods, setCollapsedPeriods] = useState(new Set());

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isInvoiceSidebarOpen, setIsInvoiceSidebarOpen] = useState(false);
  const [isQuoteSidebarOpen, setIsQuoteSidebarOpen] = useState(false);

  const allActivities = useMemo(() => {
    const activities = [...(client?.activity || [])].filter((a) => a.type !== "note_added");
    const notes = (client?.notes || []).map((note) => ({
      id: note.id,
      type: "note_added",
      description: note.content,
      userName: note.userName,
      userImage: note.userImage,
      createdAt: note.createdAt,
      metadata: {},
    }));
    return [...activities, ...notes]
      .filter((item) => item.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [client?.activity, client?.notes]);

  const filtered = useMemo(() => {
    let items = allActivities;

    if (filterType) {
      items = items.filter((item) => {
        if (filterType === "invoice")
          return item.type.startsWith("invoice") || item.type === "credit_note_created";
        if (filterType === "quote") return item.type.startsWith("quote");
        if (filterType === "email") return item.type === "document_email_sent" || item.type === "crm_email_sent";
        if (filterType === "note") return item.type.startsWith("note");
        if (filterType === "reminder")
          return item.type === "reminder_created" || item.type === "invoice_reminder_sent";
        return true;
      });
    }

    return items;
  }, [allActivities, filterType]);

  // Group by year → period
  const grouped = useMemo(() => {
    const yearMap = new Map();

    filtered.forEach((item) => {
      const date = new Date(item.createdAt);
      const year = date.getFullYear();
      const period = getPeriodLabel(item.createdAt);

      if (!yearMap.has(year)) yearMap.set(year, new Map());
      const periodMap = yearMap.get(year);
      if (!periodMap.has(period)) periodMap.set(period, []);
      periodMap.get(period).push(item);
    });

    return Array.from(yearMap.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, periodMap]) => ({
        year,
        periods: Array.from(periodMap.entries()).map(([name, items]) => ({
          name,
          items,
        })),
      }));
  }, [filtered]);

  const togglePeriod = (key) => {
    setCollapsedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleViewDocument = (docType, docId) => {
    if (docType === "invoice") {
      setSelectedInvoice({ id: docId });
      setIsInvoiceSidebarOpen(true);
    } else if (docType === "quote") {
      setSelectedQuote({ id: docId });
      setIsQuoteSidebarOpen(true);
    }
  };

  const activeFilterLabel = FILTER_TYPES.find((f) => f.value === filterType)?.label || "Filtres";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <h3 className="text-base font-medium text-[#242529]">Activité</h3>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilterLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {FILTER_TYPES.map((f) => (
              <DropdownMenuItem
                key={f.label}
                onClick={() => setFilterType(f.value)}
                className={`cursor-pointer text-sm ${filterType === f.value ? "font-medium" : ""}`}
              >
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Timeline */}
      <div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Aucune activité trouvée
          </p>
        ) : (
          <div className="pb-6">
            {grouped.map(({ year, periods }) => (
              <div key={year}>
                {/* Year header */}
                <div className="px-4 sm:px-6 pt-5 pb-1">
                  <span className="text-base text-muted-foreground font-light">{year}</span>
                </div>

                {periods.map(({ name, items }) => {
                  const periodKey = `${year}-${name}`;
                  const isCollapsed = collapsedPeriods.has(periodKey);

                  return (
                    <div key={periodKey}>
                      {/* Period header with pill label */}
                      <button
                        onClick={() => togglePeriod(periodKey)}
                        className="flex items-center gap-3 w-full px-4 sm:px-6 py-2 cursor-pointer"
                      >
                        <span
                          className="inline-flex items-center text-xs font-medium whitespace-nowrap rounded-md px-3 py-1 bg-[#f8f9fa] dark:bg-[#1a1a1a] text-[#505154] dark:text-muted-foreground shadow-[inset_0_0_0_1px_#eeeff1] dark:shadow-[inset_0_0_0_1px_#232323]"
                        >
                          {name}
                        </span>
                        <div className="flex-1 h-px bg-[#f8f9fa] dark:bg-[#232323]" />
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                            isCollapsed ? "-rotate-90" : ""
                          }`}
                        />
                      </button>

                      {/* Activity items */}
                      {!isCollapsed && (
                        <div className="relative">
                          {/* Vertical connecting line */}
                          {items.length > 1 && (
                            <div
                              className="absolute w-px bg-[#eeeff1] dark:bg-[#232323] left-[27px] sm:left-[35px]"
                              style={{ top: "24px", bottom: "24px" }}
                            />
                          )}

                          {items.map((item, index) => {
                            const meta = item.metadata || {};
                            const actionText = getActionText(item);
                            const isSystem = isSystemType(item.type);
                            // Pour les types système, afficher le nom du client (c'est le sujet de l'action)
                            // Pour les actions utilisateur, afficher le nom de l'utilisateur qui a fait l'action
                            const displayName = isSystem
                              ? client?.name || "Client"
                              : item.userName || "Système";
                            // Ne pas afficher la description séparément quand elle est déjà dans le texte d'action
                            const hideDescription =
                              item.type === "updated" || item.type === "crm_email_sent";

                            return (
                              <div
                                key={item.id || index}
                                className="relative flex items-start gap-3 py-3 px-4 sm:px-6"
                              >
                                {/* Avatar or system icon */}
                                <div className="relative z-10 flex-shrink-0">
                                  {isSystem ? (
                                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                      <Settings className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <UserAvatar
                                      name={item.userName}
                                      src={item.userImage}
                                      size="xs"
                                      className="rounded-full"
                                      fallbackClassName="bg-gray-100 text-gray-500 rounded-full text-[10px]"
                                    />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {/* Title line + time */}
                                  <div className="flex items-baseline justify-between gap-4">
                                    <p className="text-sm">
                                      <span className="font-medium text-[#242529] dark:text-foreground">
                                        {displayName}
                                      </span>{" "}
                                      <span className="text-[#737373] dark:text-muted-foreground">
                                        {actionText}
                                      </span>
                                    </p>
                                    <span className="text-xs text-[#999999] whitespace-nowrap flex-shrink-0">
                                      {formatRelativeDate(item.createdAt)}
                                    </span>
                                  </div>

                                  {/* Note card */}
                                  {item.type === "note_added" && item.description && (
                                    <div className="mt-2 rounded-lg border border-[#eeeff1] dark:border-[#232323] p-3">
                                      {/<[a-z][\s\S]*>/i.test(item.description) ? (
                                        <div
                                          className="text-sm text-[#1a1a1a] dark:text-foreground line-clamp-4 leading-relaxed [&_b]:font-bold [&_i]:italic [&_u]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#eeeff1] dark:border-[#232323] [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:bg-[#f8f9fa] [&_pre]:rounded [&_pre]:px-2 [&_pre]:py-1 [&_pre]:font-mono [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#5a50ff] [&_a]:underline [&_[data-mention-id]]:bg-[#5a50ff]/10 [&_[data-mention-id]]:text-[#5a50ff] [&_[data-mention-id]]:rounded [&_[data-mention-id]]:px-1.5 [&_[data-mention-id]]:py-0.5 [&_[data-mention-id]]:text-xs [&_[data-mention-id]]:font-medium"
                                          dangerouslySetInnerHTML={{ __html: item.description }}
                                        />
                                      ) : (
                                        <p className="text-sm text-[#1a1a1a] dark:text-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Description for non-note types (sauf quand déjà dans le texte d'action) */}
                                  {item.type !== "note_added" && !hideDescription && item.description && (
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                      {item.description}
                                    </p>
                                  )}

                                  {/* Document link */}
                                  {meta.documentType &&
                                    meta.documentType !== "creditNote" &&
                                    meta.documentId && (
                                      <button
                                        className="mt-1.5 text-sm text-[#5a50ff] hover:underline flex items-center gap-1 cursor-pointer"
                                        onClick={() =>
                                          handleViewDocument(meta.documentType, meta.documentId)
                                        }
                                      >
                                        {meta.documentType === "invoice"
                                          ? "Voir la facture"
                                          : "Voir le devis"}
                                        <ExternalLink className="h-3 w-3" />
                                      </button>
                                    )}

                                  {/* Reminder details */}
                                  {meta.eventId && meta.eventTitle && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {meta.eventTitle}
                                      {meta.eventDate && (
                                        <span className="text-xs ml-2">
                                          {format(new Date(meta.eventDate), "d MMM yyyy 'à' HH:mm", {
                                            locale: fr,
                                          })}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document sidebars */}
      <InvoiceSidebar
        invoice={selectedInvoice}
        isOpen={isInvoiceSidebarOpen}
        onClose={() => {
          setIsInvoiceSidebarOpen(false);
          setSelectedInvoice(null);
        }}
      />
      <QuoteSidebar
        quote={selectedQuote}
        isOpen={isQuoteSidebarOpen}
        onClose={() => {
          setIsQuoteSidebarOpen(false);
          setSelectedQuote(null);
        }}
      />
    </div>
  );
}
