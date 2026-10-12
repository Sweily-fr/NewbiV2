"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { PLANS_DISPLAY } from "@/src/lib/plans-display";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const cents = (value) => euros.format((value || 0) / 100);
const shortDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const formatDate = (value) => (value ? shortDate.format(new Date(value)) : "-");
const planLabel = (key) =>
  PLANS_DISPLAY.find((p) => p.key === key)?.displayName || key || "-";

const SUBSCRIPTION_STATUS = {
  active: {
    label: "Actif",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  },
  trialing: {
    label: "En essai",
    className: "bg-[#5b50fe]/10 text-[#5b50fe] border-[#5b50fe]/20",
  },
  past_due: {
    label: "Impayé",
    className:
      "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  },
  unpaid: {
    label: "Impayé",
    className:
      "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  },
  incomplete: {
    label: "Paiement à valider",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  },
};
const INVOICE_STATUS = {
  paid: "Payée",
  open: "À payer",
  uncollectible: "Irrécouvrable",
  void: "Annulée",
};

function Badge({ status }) {
  const config = SUBSCRIPTION_STATUS[status] || {
    label: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs whitespace-nowrap",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-medium">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Paramètres > Dépenses clients (comptes gestionnaires) : ce que le cabinet
 * paie pour les espaces de ses clients.
 */
export default function ManagerSpendingSection() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/gestionnaire/depenses")
      .then((response) =>
        response.json().then((body) => ({ ok: response.ok, body })),
      )
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (ok) setData(body);
        else setError(body.error || "Récapitulatif indisponible.");
      })
      .catch(() => !cancelled && setError("Le serveur ne répond pas."));
    return () => {
      cancelled = true;
    };
  }, []);

  const openPortal = async () => {
    if (portalLoading) return;
    setPortalLoading(true);
    try {
      const response = await fetch("/api/gestionnaire/portail", {
        method: "POST",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.url) {
        toast.error(body.error || "Le portail de paiement est indisponible.");
        setPortalLoading(false);
        return;
      }
      window.location.assign(body.url);
    } catch {
      toast.error("Le portail de paiement est indisponible.");
      setPortalLoading(false);
    }
  };

  const header = (
    <div>
      <h2 className="text-lg font-medium mb-1 hidden md:block">
        Dépenses clients
      </h2>
      <p className="text-sm text-muted-foreground mb-4 hidden md:block">
        Les abonnements que votre cabinet paie pour les espaces de ses clients.
        Montants TTC.
      </p>
      <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
    </div>
  );

  if (error) {
    return (
      <div className="space-y-8">
        {header}
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-8">
        {header}
        <div className="flex justify-center py-12">
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const paidCount = data.subscriptions.length;

  return (
    <div className="space-y-8">
      {header}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Par mois aujourd'hui"
          value={cents(data.monthlyTotal)}
          hint={
            data.upcomingMonthlyTotal > 0
              ? `+ ${cents(data.upcomingMonthlyTotal)} à la fin des essais`
              : "Abonnements annuels ramenés au mois"
          }
        />
        <Stat
          label="Espaces payés"
          value={paidCount}
          hint={
            data.toChoose.length > 0
              ? `${data.toChoose.length} offre${data.toChoose.length > 1 ? "s" : ""} à choisir`
              : null
          }
        />
        <Stat
          label="Remise du cabinet"
          value={`${data.discountPercent} %`}
          hint="Appliquée à chaque abonnement"
        />
      </div>

      {data.toChoose.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Offres à choisir</h3>
            <p className="text-xs text-muted-foreground">
              Vous payez ces espaces mais leur offre n&apos;est pas encore
              choisie. Sans offre à la fin de l&apos;essai, l&apos;espace passe
              en lecture seule.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] divide-y divide-gray-200 dark:divide-[#2c2c2c]">
            {data.toChoose.map((item) => (
              <div
                key={item.linkId}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <span className="truncate">{item.name}</span>
                <span className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  {item.trialEndsAt
                    ? `Essai jusqu'au ${formatDate(item.trialEndsAt)}`
                    : "Essai terminé"}
                  <a
                    href={GESTIONNAIRE_PATH}
                    className="font-medium text-[#5b50fe] hover:underline"
                  >
                    Choisir
                  </a>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Abonnements</h3>
        {paidCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun abonnement pour l&apos;instant. Choisissez l&apos;offre
            d&apos;un client depuis votre liste de clients.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2c2c2c]">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2c2c2c] text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-normal">Espace</th>
                  <th className="px-3 py-2 font-normal">Offre</th>
                  <th className="px-3 py-2 font-normal text-right">Montant</th>
                  <th className="px-3 py-2 font-normal">Prochaine échéance</th>
                  <th className="px-3 py-2 font-normal">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.subscriptions.map((item) => (
                  <tr
                    key={`${item.organizationId}-${item.plan}`}
                    className="border-b last:border-0 border-gray-200 dark:border-[#2c2c2c]"
                  >
                    <td className="px-3 py-2.5">
                      <span className="block max-w-[180px] truncate">
                        {item.name}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {planLabel(item.plan)}
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        · {item.interval === "year" ? "annuel" : "mensuel"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {cents(item.amount)}
                      <span className="text-xs text-muted-foreground">
                        {item.interval === "year" ? " / an" : " / mois"}
                      </span>
                      {item.discountPercent > 0 && (
                        <span className="block text-xs text-muted-foreground line-through">
                          {cents(item.unitAmount)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {item.cancelAtPeriodEnd
                        ? `Fin le ${formatDate(item.nextPaymentAt)}`
                        : formatDate(item.nextPaymentAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Moyen de paiement</h3>
            <p className="text-xs text-muted-foreground">
              {data.card
                ? `${data.card.brand?.toUpperCase()} •••• ${data.card.last4}, expire le ${String(data.card.expMonth).padStart(2, "0")}/${data.card.expYear}`
                : "Aucune carte enregistrée : elle le sera à votre premier abonnement."}
            </p>
          </div>
          {data.hasCustomer && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openPortal}
              disabled={portalLoading}
              className="cursor-pointer shrink-0"
            >
              {portalLoading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              Gérer la carte et l&apos;adresse
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Factures</h3>
        {data.invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune facture pour l&apos;instant.
          </p>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] divide-y divide-gray-200 dark:divide-[#2c2c2c]">
            {data.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate">
                    {invoice.name || invoice.number || "Facture"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(invoice.createdAt)}
                    {invoice.number ? ` · ${invoice.number}` : ""}
                    {" · "}
                    {INVOICE_STATUS[invoice.status] || invoice.status}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span>{cents(invoice.total)}</span>
                  {(invoice.pdf || invoice.url) && (
                    <a
                      href={invoice.pdf || invoice.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Télécharger la facture"
                    >
                      <Download className="size-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
