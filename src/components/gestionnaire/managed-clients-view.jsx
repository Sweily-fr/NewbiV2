"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CircleXIcon,
  HandCoins,
  Inbox,
  LoaderCircle,
  MailPlus,
  MoreHorizontal,
  Plus,
  Search,
  Undo2,
  WalletCards,
} from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { SearchExactToggle } from "@/src/components/search-exact-toggle";
import { createSearchMatcher } from "@/src/utils/search-text";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";
import ManagedPlanDialog from "./managed-plan-dialog";
import ManagedTakeoverDialog from "./managed-takeover-dialog";
import ManagedHandBackDialog from "./managed-handback-dialog";
import NoSubscriptionNotice from "./no-subscription-notice";
import { payerChangeMessage } from "./payer-change-messages";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Paris",
});
const formatDate = (value) =>
  value ? dateFormat.format(new Date(value)) : "-";

const BADGE =
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs whitespace-nowrap";
const TONES = {
  gray: "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
  amber:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  red: "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
  violet: "border-[#5b50fe]/20 bg-[#5b50fe]/10 text-[#5b50fe]",
};

const INVITATION_BADGES = {
  pending: { label: "Invitation envoyée", tone: "amber" },
  expired: { label: "Invitation expirée", tone: "gray" },
  declined: { label: "Invitation refusée", tone: "red" },
};

// Mêmes pastilles que le sélecteur d'espaces : PRO / Essai / Expiré, plus
// les paiements en échec ou à valider
function AccessBadge({ client }) {
  const badge = (label, tone) => (
    <span className={cn(BADGE, TONES[tone])}>{label}</span>
  );
  const invitation = INVITATION_BADGES[client.status];
  if (invitation) return badge(invitation.label, invitation.tone);
  if (client.status !== "active") return badge("Accès terminé", "gray");

  const { access } = client;
  if (access.type === "subscription") {
    if (["past_due", "unpaid"].includes(access.status)) {
      return badge("Paiement en échec", "red");
    }
    if (access.status === "incomplete") {
      return badge("Paiement à valider", "amber");
    }
    return badge("PRO", "gray");
  }
  if (access.type === "trial") {
    const days = Math.max(
      0,
      Math.ceil((new Date(access.endsAt) - new Date()) / 86_400_000),
    );
    return badge(`Essai · ${days}j`, "violet");
  }
  return badge("Expiré", "red");
}

const COLUMNS = [
  { key: "name", label: "Client", width: 260 },
  { key: "owner", label: "Dirigeant", width: 240 },
  { key: "payer", label: "Qui paie", width: 170 },
  { key: "access", label: "Abonnement", width: 150 },
  { key: "startedAt", label: "Depuis le", width: 110 },
  { key: "actions", label: "", width: 260 },
];

const canChoosePlan = (client) =>
  client.status === "active" &&
  Boolean(client.name) &&
  client.payer === "manager" &&
  client.access?.type !== "subscription";

// Qui paie, avec le changement à venir ou la reprise en attente de paiement
function PayerCell({ client }) {
  const label = client.payer === "manager" ? "Vous" : "Le client";
  const note = client.takeoverPending
    ? { text: "Reprise : paiement à valider", tone: "text-amber-600" }
    : client.payerChange
      ? {
          text: `à partir du ${formatDate(client.payerChange.effectiveAt)}`,
          tone: "text-muted-foreground",
        }
      : null;
  return (
    <div className="min-w-0">
      <div className="truncate">{label}</div>
      {note && (
        <div className={cn("truncate text-xs", note.tone)}>{note.text}</div>
      )}
    </div>
  );
}

/**
 * Espace gestionnaire, page « Clients » : même mise en page que les listes
 * du tableau de bord (titre, recherche, tableau pleine largeur). « Ouvrir »
 * bascule sur l'espace du client puis recharge son tableau de bord, comme le
 * sélecteur d'espaces. « Choisir l'offre » : espaces que le cabinet paie et
 * qui n'ont pas encore d'abonnement (aussi ouvert par ?offre=<fiche>).
 */
export default function ManagedClientsView({
  managerName,
  discountPercent = 0,
  clients,
  // Cabinet suspendu par Newbi : consultation seulement
  readOnly = false,
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchExact, setSearchExact] = useState(false);
  const [opening, setOpening] = useState(null);
  const [busy, setBusy] = useState(null);
  const [planFor, setPlanFor] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelFor, setCancelFor] = useState(null);
  const [takeoverFor, setTakeoverFor] = useState(null);
  const [handBackFor, setHandBackFor] = useState(null);
  const inputRef = useRef(null);

  // Retour de Stripe Checkout (?abonnement=) : l'abonnement est enregistré
  // tout de suite, sans attendre le webhook. Lien « Choisir l'offre »
  // depuis les paramètres ou un bandeau (?offre=) : ouvre le choix.
  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("abonnement");
    const offre = url.searchParams.get("offre");
    if (!sessionId && !offre) return;
    url.searchParams.delete("abonnement");
    url.searchParams.delete("offre");
    window.history.replaceState(null, "", url.pathname + url.search);

    if (offre) {
      const client = clients.find((c) => c.id === offre);
      if (client && canChoosePlan(client) && !readOnly) setPlanFor(client);
      else if (client) {
        toast.info(
          `L'offre de ${client.name || "ce client"} est déjà choisie.`,
        );
      }
    }
    if (!sessionId) return;

    setConfirming(true);
    fetch("/api/gestionnaire/abonnements/confirmer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) {
          toast.error(data.error || "Le paiement n'a pas pu être vérifié.");
        } else if (data.status === "active" && data.takeover) {
          // Reprise de l'abonnement d'un client, payée sur Stripe
          const client = clients.find(
            (c) => c.organizationId === data.organizationId,
          );
          const message = payerChangeMessage(client?.name, data.takeover);
          toast[message.tone](message.text);
          router.refresh();
        } else if (data.status === "active") {
          toast.success("Abonnement enregistré, votre carte est conservée.");
          router.refresh();
        } else {
          toast.info(
            "Paiement en cours de validation : l'abonnement apparaîtra dans quelques instants.",
          );
          setTimeout(() => router.refresh(), 4000);
        }
      })
      .catch(() => toast.error("Le paiement n'a pas pu être vérifié."))
      .finally(() => setConfirming(false));
    // Une seule fois, à l'arrivée sur la page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    if (!query.trim()) return clients;
    // Sans accents ni majuscules, sauf bouton « Aa » coché
    const match = createSearchMatcher(query, { exact: searchExact });
    return clients.filter((c) =>
      match(c.name, c.siret, c.ownerName, c.ownerEmail, c.invitedEmail),
    );
  }, [clients, query, searchExact]);
  const activeCount = clients.filter((c) => c.status === "active").length;

  // Action d'une ligne, avec retour à l'utilisateur
  const runAction = async (
    client,
    { url, method = "POST", success, failure },
  ) => {
    if (busy) return;
    setBusy(client.id);
    try {
      const response = await fetch(url, { method });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || failure);
      } else {
        toast.success(typeof success === "function" ? success(data) : success);
        router.refresh();
      }
    } catch {
      toast.error(failure);
    } finally {
      setBusy(null);
    }
  };

  const cancelInvitation = (client) =>
    runAction(client, {
      url: `/api/gestionnaire/invitations/${client.id}`,
      method: "DELETE",
      success:
        client.status === "pending"
          ? "Invitation annulée"
          : "Invitation retirée",
      failure: "Impossible de retirer l'invitation",
    });

  const relaunchInvitation = (client) =>
    runAction(client, {
      url: `/api/gestionnaire/invitations/${client.id}/relancer`,
      success: (data) =>
        data.invitation?.emailSent === false
          ? "Invitation relancée, mais l'e-mail n'est pas parti : le client la verra dans ses notifications Newbi."
          : `Nouvelle invitation envoyée à ${client.invitedEmail}.`,
      failure: "Impossible de relancer l'invitation",
    });

  const resendWelcome = (client) =>
    runAction(client, {
      url: `/api/gestionnaire/clients/${client.id}/bienvenue`,
      success: (data) =>
        data.emailSent
          ? `E-mail renvoyé à ${data.email} : le lien est valable 7 jours.`
          : `L'e-mail à ${data.email} n'est pas parti. Vérifiez l'adresse ou réessayez plus tard.`,
      failure: "Impossible de renvoyer l'e-mail",
    });

  const openClient = async (client) => {
    if (opening) return;
    setOpening(client.organizationId);
    try {
      await authClient.organization.setActive({
        organizationId: client.organizationId,
      });
      localStorage.setItem("active_organization_id", client.organizationId);
      // État d'abonnement mis en cache 5 min : il a pu changer (offre
      // choisie depuis l'espace gestionnaire)
      localStorage.removeItem(`subscription-${client.organizationId}`);
      window.location.assign("/dashboard");
    } catch (error) {
      console.error("Ouverture de l'espace du client impossible:", error);
      toast.error("Impossible d'ouvrir l'espace de ce client");
      setOpening(null);
    }
  };

  return (
    <div className="flex flex-col md:h-[calc(100vh-64px)] overflow-hidden">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-6">
        <div>
          <h1 className="text-2xl font-medium mb-0">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCount} {activeCount > 1 ? "clients suivis" : "client suivi"}{" "}
            par {managerName}
          </p>
        </div>
        <div
          className={cn(
            "flex flex-wrap gap-2 self-start",
            readOnly && "hidden",
          )}
        >
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

      {/* Renvoyé ici depuis un espace sans abonnement */}
      <div className="px-4 sm:px-6 pt-4 empty:hidden">
        <NoSubscriptionNotice />
      </div>

      {/* Recherche */}
      <div className="flex items-center gap-4 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="relative w-full max-w-md sm:w-[320px]">
          <Input
            ref={inputRef}
            className={cn("w-full sm:w-[320px] ps-9 pe-9", query && "pe-16")}
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
              className="text-muted-foreground/80 hover:text-foreground absolute inset-y-0 end-7 flex h-full w-9 items-center justify-center outline-none"
              aria-label="Effacer la recherche"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <CircleXIcon size={16} aria-hidden="true" />
            </button>
          )}
          <div className="absolute inset-y-0 end-1.5 flex items-center">
            <SearchExactToggle
              pressed={searchExact}
              onPressedChange={setSearchExact}
            />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="flex-1 min-h-0 overflow-auto border-t border-border">
        <table className="w-full table-fixed min-w-[1130px]">
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
                      ? "Aucun client pour l'instant. Créez l'espace d'un client avec « Nouveau client », ou invitez un client qui utilise déjà Newbi."
                      : "Aucun client ne correspond à la recherche."}
                  </div>
                </td>
              </tr>
            )}
            {rows.map((client) => {
              const isInvitation = !client.organizationId;
              const isOpenInvitation = client.status === "pending";
              const isClosedInvitation =
                isInvitation && ["expired", "declined"].includes(client.status);
              // Prendre en charge l'abonnement, ou ne plus le payer (encore
              // possible pour un cabinet suspendu)
              const canSwitchPayer =
                client.status === "active" &&
                Boolean(client.name) &&
                (!readOnly || client.payer === "manager");
              return (
                <tr
                  key={client.id}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <td className="p-2 pl-4 sm:pl-6 align-middle text-sm">
                    <div className="truncate font-normal">
                      {!isInvitation ? (
                        client.name || "Espace supprimé"
                      ) : (
                        <span className="italic text-muted-foreground">
                          {isOpenInvitation
                            ? "En attente de réponse"
                            : "Aucun espace confié"}
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
                    <PayerCell client={client} />
                  </td>
                  <td className="p-2 align-middle text-sm">
                    <AccessBadge client={client} />
                  </td>
                  <td className="p-2 align-middle text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(client.startedAt)}
                  </td>
                  <td className="p-2 pr-4 sm:pr-6 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      {canChoosePlan(client) && !readOnly && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => setPlanFor(client)}
                          disabled={confirming}
                        >
                          <WalletCards className="size-4" />
                          Choisir l&apos;offre
                        </Button>
                      )}
                      {isOpenInvitation && !readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => setCancelFor(client)}
                          disabled={Boolean(busy)}
                        >
                          {busy === client.id && (
                            <LoaderCircle className="size-4 animate-spin" />
                          )}
                          Annuler l&apos;invitation
                        </Button>
                      )}
                      {isClosedInvitation && !readOnly && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => relaunchInvitation(client)}
                            disabled={Boolean(busy)}
                          >
                            {busy === client.id && (
                              <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Relancer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => cancelInvitation(client)}
                            disabled={Boolean(busy)}
                          >
                            Retirer
                          </Button>
                        </>
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
                      {(canSwitchPayer ||
                        (client.canResendWelcome && !readOnly)) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 cursor-pointer"
                              aria-label={`Autres actions pour ${client.name}`}
                              disabled={Boolean(busy)}
                            >
                              {busy === client.id ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="size-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canSwitchPayer && client.payer !== "manager" && (
                              <DropdownMenuItem
                                onClick={() => setTakeoverFor(client)}
                              >
                                <HandCoins className="size-4" />
                                Prendre en charge l&apos;abonnement
                              </DropdownMenuItem>
                            )}
                            {canSwitchPayer && client.payer === "manager" && (
                              <DropdownMenuItem
                                onClick={() => setHandBackFor(client)}
                              >
                                <Undo2 className="size-4" />
                                Ne plus payer l&apos;abonnement
                              </DropdownMenuItem>
                            )}
                            {client.canResendWelcome && !readOnly && (
                              <DropdownMenuItem
                                onClick={() => resendWelcome(client)}
                              >
                                <MailPlus className="size-4" />
                                Renvoyer l&apos;e-mail de bienvenue
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ManagedPlanDialog
        key={planFor?.id || "none"}
        client={planFor}
        discountPercent={discountPercent}
        open={Boolean(planFor)}
        onOpenChange={(value) => !value && setPlanFor(null)}
      />

      <ManagedTakeoverDialog
        key={`reprise-${takeoverFor?.id || "none"}`}
        client={takeoverFor}
        discountPercent={discountPercent}
        open={Boolean(takeoverFor)}
        onOpenChange={(value) => !value && setTakeoverFor(null)}
      />

      <ManagedHandBackDialog
        key={`rendu-${handBackFor?.id || "none"}`}
        client={handBackFor}
        open={Boolean(handBackFor)}
        onOpenChange={(value) => !value && setHandBackFor(null)}
      />

      <AlertDialog
        open={Boolean(cancelFor)}
        onOpenChange={(value) => !value && setCancelFor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler l&apos;invitation ?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelFor?.invitedEmail} ne pourra plus l&apos;accepter. Vous
              pourrez l&apos;inviter à nouveau plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Garder l&apos;invitation</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const client = cancelFor;
                setCancelFor(null);
                if (client) cancelInvitation(client);
              }}
            >
              Annuler l&apos;invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
