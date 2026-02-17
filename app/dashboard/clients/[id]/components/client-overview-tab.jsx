"use client";

import { useMemo } from "react";
import {
  Banknote,
  Clock,
  FileText,
  ClipboardList,
  ChevronRight,
  Activity,
  StickyNote,
} from "lucide-react";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function formatRelativeDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "Maintenant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `il y a ${diffD} jours`;
  if (diffD < 30) return `il y a ${Math.floor(diffD / 7)} sem.`;
  if (diffD < 365) return `il y a ${Math.floor(diffD / 30)} mois`;
  return `il y a ${Math.floor(diffD / 365)} an${Math.floor(diffD / 365) > 1 ? "s" : ""}`;
}

function getActionText(activity) {
  const meta = activity.metadata || {};
  const docNum = meta.documentNumber ? ` ${meta.documentNumber}` : "";
  const actions = {
    created: "a été créé",
    updated: "a été mis à jour",
    invoice_created: `a créé la facture${docNum}`,
    invoice_status_changed: `a modifié le statut de la facture${docNum}`,
    quote_created: `a créé le devis${docNum}`,
    quote_status_changed: `a modifié le statut du devis${docNum}`,
    credit_note_created: `a créé un avoir${docNum}`,
    note_added: "a ajouté une note",
    note_updated: "a modifié une note",
    note_deleted: "a supprimé une note",
    document_email_sent: `a envoyé un email`,
    invoice_reminder_sent: `a envoyé une relance`,
    reminder_created: "a créé un rappel",
  };
  return actions[activity.type] || "a effectué une action";
}

function HighlightCard({ icon: Icon, label, value, highlighted }) {
  return (
    <div
      className={`rounded-lg p-4 flex flex-col gap-2.5 border border-[#eeeff1] dark:border-[#232323] dark:border-[#232323] ${
        highlighted ? "bg-[rgba(90,80,255,0.03)] dark:bg-[rgba(90,80,255,0.06)]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#606164] dark:text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-[#b0b0b0] dark:text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-[#242529] dark:text-foreground dark:text-foreground">{value}</span>
    </div>
  );
}

export default function ClientOverviewTab({
  client,
  invoices = [],
  quotes = [],
  onSwitchTab,
}) {
  const clientInvoices = useMemo(
    () => invoices.filter((inv) => inv.client?.id === client.id),
    [invoices, client.id]
  );

  const clientQuotes = useMemo(
    () => quotes.filter((q) => q.client?.id === client.id),
    [quotes, client.id]
  );

  const invoiceStats = useMemo(() => {
    const total = clientInvoices.reduce(
      (sum, inv) => sum + (inv.finalTotalTTC || inv.totalTTC || 0),
      0
    );
    const pending = clientInvoices.filter((inv) => inv.status === "PENDING");
    const pendingTotal = pending.reduce(
      (sum, inv) => sum + (inv.finalTotalTTC || inv.totalTTC || 0),
      0
    );
    return { count: clientInvoices.length, total, pendingCount: pending.length, pendingTotal };
  }, [clientInvoices]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  // Recent activities (max 3)
  const recentActivities = useMemo(() => {
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
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  }, [client?.activity, client?.notes]);

  // Recent notes (max 3)
  const recentNotes = useMemo(() => {
    return [...(client?.notes || [])]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  }, [client?.notes]);

  const notesCount = client?.notes?.length || 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Highlights */}
      <div className="px-4 sm:px-6 pt-5 pb-2">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGridIcon className="h-4 w-4 text-[#242529] dark:text-foreground" strokeWidth={1.5} />
          <h3 className="text-sm font-medium text-[#242529] dark:text-foreground">Résumé</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <HighlightCard
            icon={Banknote}
            label="Total facturé"
            value={formatCurrency(invoiceStats.total)}
            highlighted
          />
          <HighlightCard
            icon={Clock}
            label="En attente"
            highlighted
            value={
              invoiceStats.pendingCount > 0
                ? formatCurrency(invoiceStats.pendingTotal)
                : "Aucune"
            }
          />
          <HighlightCard
            icon={FileText}
            label="Factures"
            value={invoiceStats.count.toString()}
          />
          <HighlightCard
            icon={ClipboardList}
            label="Devis"
            value={clientQuotes.length.toString()}
          />
          <HighlightCard
            icon={StickyNote}
            label="Notes"
            value={notesCount.toString()}
          />
          <HighlightCard
            icon={FileText}
            label="Dernière facture"
            value={(() => {
              if (clientInvoices.length === 0) return "Aucune";
              const sorted = [...clientInvoices]
                .filter((inv) => inv.createdAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              if (sorted.length === 0) return "Aucune";
              const date = new Date(sorted[0].createdAt);
              if (isNaN(date.getTime())) return "Aucune";
              return format(date, "d MMM yyyy", { locale: fr });
            })()}
          />
        </div>
      </div>

      {/* Activity preview */}
      <div className="px-4 sm:px-6 pt-6 pb-2">
        <button
          onClick={() => onSwitchTab?.("activity")}
          className="flex items-center gap-2 mb-3 cursor-pointer group rounded-md px-2 py-1 -ml-2 hover:bg-[#f8f9fa] dark:hover:bg-gray-800/50 transition-colors"
        >
          <Activity className="h-4 w-4 text-[#242529] dark:text-foreground" strokeWidth={1.5} />
          <h3 className="text-sm font-medium text-[#242529] dark:text-foreground">Activité</h3>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>
        <div className="rounded-lg border border-[#eeeff1] dark:border-[#232323]">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune activité
            </p>
          ) : (
            <>
              {recentActivities.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-center gap-2.5 px-4 py-2"
                >
                  <UserAvatar
                    name={item.userName}
                    src={item.userImage}
                    size="xs"
                    className="h-5 w-5 rounded-full flex-shrink-0"
                    fallbackClassName="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-[9px]"
                  />
                  <p className="text-sm flex-1 min-w-0 truncate">
                    <span className="font-medium text-[#242529] dark:text-foreground">
                      {item.userName || "Système"}
                    </span>{" "}
                    <span className="text-[#737373] dark:text-muted-foreground">{getActionText(item)}</span>
                  </p>
                  <span className="text-xs text-[#999999] dark:text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatRelativeDate(item.createdAt)}
                  </span>
                </div>
              ))}
              {(client?.activity?.length || 0) + (client?.notes?.length || 0) > 3 && (
                <button
                  onClick={() => onSwitchTab?.("activity")}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#737373] dark:text-muted-foreground hover:text-[#242529] dark:hover:text-foreground dark:text-foreground cursor-pointer transition-colors"
                >
                  Voir tout <ChevronRight className="h-3 w-3 inline ml-0.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notes preview */}
      <div className="px-4 sm:px-6 pt-6 pb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onSwitchTab?.("notes")}
            className="flex items-center gap-2 cursor-pointer group rounded-md px-2 py-1 -ml-2 hover:bg-[#f8f9fa] dark:hover:bg-gray-800/50 transition-colors"
          >
            <StickyNote className="h-4 w-4 text-[#242529] dark:text-foreground" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-[#242529] dark:text-foreground">Notes</h3>
            {notesCount > 0 && (
              <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                {notesCount}
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        <div className="rounded-lg border border-[#eeeff1] dark:border-[#232323]">
          {recentNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune note
            </p>
          ) : (
            <>
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center gap-2.5 px-4 py-2"
                >
                  <UserAvatar
                    name={note.userName}
                    src={note.userImage}
                    size="xs"
                    className="h-5 w-5 rounded-full flex-shrink-0"
                    fallbackClassName="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-[9px]"
                  />
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-sm font-medium text-[#242529] dark:text-foreground flex-shrink-0">
                      {note.userName}
                    </span>
                    <span className="text-sm text-[#737373] dark:text-muted-foreground truncate">
                      {(note.content || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim() || "Note sans contenu"}
                    </span>
                  </div>
                  <span className="text-xs text-[#999999] dark:text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatRelativeDate(note.createdAt)}
                  </span>
                </div>
              ))}
              {notesCount > 3 && (
                <button
                  onClick={() => onSwitchTab?.("notes")}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#737373] dark:text-muted-foreground hover:text-[#242529] dark:hover:text-foreground dark:text-foreground cursor-pointer transition-colors"
                >
                  Voir tout <ChevronRight className="h-3 w-3 inline ml-0.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LayoutGridIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
