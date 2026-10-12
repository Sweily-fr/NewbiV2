"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CircleXIcon,
  Inbox,
  LoaderCircle,
  MailPlus,
  Plus,
  Search,
} from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";

const PLAN_LABELS = {
  freelance: "Freelance",
  pme: "TPE",
  entreprise: "Entreprise",
};
const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const formatDate = (value) =>
  value ? dateFormat.format(new Date(value)) : "-";

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Mêmes pastilles que le sélecteur d'espaces : PRO / Essai / Expiré
const INVITATION_BADGES = {
  pending: {
    label: "Invitation envoyée",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  },
  expired: {
    label: "Invitation expirée",
    className:
      "border-gray-200 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
  declined: {
    label: "Invitation refusée",
    className:
      "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
  },
};

function AccessBadge({ client }) {
  const invitation = INVITATION_BADGES[client.status];
  if (invitation) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs",
          invitation.className,
        )}
      >
        {invitation.label}
      </span>
    );
  }
  if (client.status !== "active") {
    return (
      <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Terminé
      </span>
    );
  }
  const { access } = client;
  if (access.type === "subscription") {
    return (
      <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        PRO
      </span>
    );
  }
  if (access.type === "trial") {
    const days = Math.max(
      0,
      Math.ceil((new Date(access.endsAt) - new Date()) / 86_400_000),
    );
    return (
      <span className="inline-flex items-center rounded-md border border-[#5b50fe]/20 bg-[#5b50fe]/10 px-2 py-0.5 text-xs text-[#5b50fe]">
        Essai · {days}j
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
      Expiré
    </span>
  );
}

const COLUMNS = [
  { key: "name", label: "Client", width: 260 },
  { key: "owner", label: "Dirigeant", width: 240 },
  { key: "plan", label: "Formule", width: 110 },
  { key: "payer", label: "Qui paie", width: 120 },
  { key: "access", label: "Abonnement", width: 120 },
  { key: "startedAt", label: "Depuis le", width: 110 },
  { key: "actions", label: "", width: 110 },
];

/**
 * Espace gestionnaire, page « Clients » : même mise en page que les listes
 * du tableau de bord (titre, recherche, tableau pleine largeur). « Ouvrir »
 * bascule sur l'espace du client puis recharge son tableau de bord, comme le
 * sélecteur d'espaces.
 */
export default function ManagedClientsView({ managerName, clients }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [opening, setOpening] = useState(null);
  const [canceling, setCanceling] = useState(null);
  const inputRef = useRef(null);

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.siret, c.ownerName, c.ownerEmail, c.invitedEmail].some((v) =>
        normalize(v).includes(q),
      ),
    );
  }, [clients, query]);
  const activeCount = clients.filter((c) => c.status === "active").length;

  // Invitation encore en attente : le cabinet peut la retirer
  const cancelInvitation = async (client) => {
    if (canceling) return;
    setCanceling(client.id);
    try {
      const response = await fetch(
        `/api/gestionnaire/invitations/${client.id}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || "Impossible d'annuler l'invitation");
      } else {
        toast.success("Invitation annulée");
        router.refresh();
      }
    } catch {
      toast.error("Impossible d'annuler l'invitation");
    } finally {
      setCanceling(null);
    }
  };

  const openClient = async (client) => {
    if (opening) return;
    setOpening(client.organizationId);
    try {
      await authClient.organization.setActive({
        organizationId: client.organizationId,
      });
      localStorage.setItem("active_organization_id", client.organizationId);
      window.location.assign("/dashboard");
    } catch (error) {
      console.error("Ouverture du dossier impossible:", error);
      toast.error("Impossible d'ouvrir ce dossier");
      setOpening(null);
    }
  };

  return (
    <div className="flex flex-col md:h-[calc(100vh-64px)] overflow-hidden">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-6">
        <div>
          <h1 className="text-2xl font-medium mb-0">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCount}{" "}
            {activeCount > 1 ? "dossiers suivis" : "dossier suivi"} par{" "}
            {managerName}
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <Link
            href={`${GESTIONNAIRE_PATH}/clients/inviter`}
            className={buttonVariants({ variant: "outline" })}
          >
            <MailPlus size={14} strokeWidth={2} aria-hidden="true" />
            Inviter un client
          </Link>
          <Link
            href={`${GESTIONNAIRE_PATH}/clients/nouveau`}
            className={buttonVariants({ variant: "primary" })}
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            Nouveau client
          </Link>
        </div>
      </div>

      {/* Recherche */}
      <div className="flex items-center gap-4 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="relative max-w-md">
          <Input
            ref={inputRef}
            className={cn("w-full sm:w-[320px] ps-9", query && "pe-9")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Recherchez par entreprise, dirigeant ou SIRET..."
            type="text"
            aria-label="Rechercher un client"
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
            <Search size={16} aria-hidden="true" />
          </div>
          {query && (
            <button
              type="button"
              className="text-muted-foreground/80 hover:text-foreground absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center outline-none"
              aria-label="Effacer la recherche"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <CircleXIcon size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="flex-1 min-h-0 overflow-auto border-t border-border">
        <table className="w-full table-fixed min-w-[1000px]">
          <thead className="sticky top-0 z-10 bg-background border-b border-border">
            <tr>
              {COLUMNS.map((col, index) => (
                <th
                  key={col.key}
                  style={{ width: `${col.width}px` }}
                  className={cn(
                    "h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground",
                    index === 0 && "pl-4 sm:pl-6",
                    index === COLUMNS.length - 1 && "pr-4 sm:pr-6",
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="p-12">
                  <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                    <Inbox className="size-6" />
                    {clients.length === 0
                      ? "Aucun client pour l'instant. Créez le premier avec « Nouveau client »."
                      : "Aucun client ne correspond à la recherche."}
                  </div>
                </td>
              </tr>
            )}
            {rows.map((client) => (
              <tr
                key={client.id}
                className="border-b hover:bg-muted/50 transition-colors"
              >
                <td className="p-2 pl-4 sm:pl-6 align-middle text-sm">
                  <div className="truncate font-normal">
                    {client.organizationId ? (
                      client.name || "Espace supprimé"
                    ) : (
                      <span className="italic text-muted-foreground">
                        Espace choisi par le client
                      </span>
                    )}
                  </div>
                  {client.siret && (
                    <div className="font-mono text-xs text-muted-foreground">
                      {client.siret}
                    </div>
                  )}
                </td>
                <td className="p-2 align-middle text-sm">
                  <div className="truncate">{client.ownerName || "-"}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {client.ownerEmail || client.invitedEmail}
                  </div>
                </td>
                <td className="p-2 align-middle text-sm">
                  {PLAN_LABELS[client.plan] || "-"}
                </td>
                <td className="p-2 align-middle text-sm">
                  {client.payer === "manager" ? "Vous" : "Le client"}
                </td>
                <td className="p-2 align-middle text-sm">
                  <AccessBadge client={client} />
                </td>
                <td className="p-2 align-middle text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(client.startedAt)}
                </td>
                <td className="p-2 pr-4 sm:pr-6 align-middle text-right">
                  {client.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => cancelInvitation(client)}
                      disabled={Boolean(canceling)}
                    >
                      {canceling === client.id && (
                        <LoaderCircle className="size-4 animate-spin" />
                      )}
                      Annuler
                    </Button>
                  )}
                  {client.status === "active" && client.name && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => openClient(client)}
                      disabled={Boolean(opening)}
                    >
                      {opening === client.organizationId ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                      Ouvrir
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
