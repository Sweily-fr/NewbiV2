"use client";

import Link from "next/link";
import { Callout } from "@/src/components/ui/callout";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";

const UNPAID = ["past_due", "unpaid", "incomplete"];

const longDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Paris",
      })
    : null;

/**
 * Lien du cabinet vers l'endroit où agir sur l'abonnement d'un espace qu'il
 * paie : le choix de l'offre (pas encore d'abonnement) ou ses dépenses
 * (abonnement en cours, carte à mettre à jour).
 */
export function cabinetActionFor(cabinet) {
  if (!cabinet?.viewerIsManager) return null;
  if (!cabinet.subscriptionStatus) {
    return {
      label: "Choisir l'offre",
      href: cabinet.linkId
        ? `${GESTIONNAIRE_PATH}?offre=${cabinet.linkId}`
        : GESTIONNAIRE_PATH,
    };
  }
  return {
    label: "Voir mes dépenses",
    href: `${GESTIONNAIRE_PATH}?parametres=depenses-clients`,
  };
}

/**
 * Paramètres > Abonnement / Facturation d'un espace dont le cabinet paie
 * l'abonnement : au client, que son cabinet s'en occupe ; au cabinet, où
 * agir.
 */
export default function PaidByCabinetNotice({
  cabinet,
  // Affiché au-dessus des offres (Paramètres > Abonnement)
  aboveOffers = false,
}) {
  if (!cabinet) return null;
  const unpaid = UNPAID.includes(cabinet.subscriptionStatus);
  const endsAt = longDate(cabinet.endsAt);
  const startsAt = longDate(cabinet.startsAt);

  // Le cabinet a arrêté sa prise en charge, sa dernière période court
  if (cabinet.handBack) {
    return (
      <Callout type="info" noMargin>
        <p>
          {cabinet.viewerIsManager
            ? `Vous ne payez plus l'abonnement de cet espace ${endsAt ? `après le ${endsAt}` : "après sa période en cours"}. Votre client choisit son offre d'ici là.`
            : `${cabinet.managerName} ne prend plus en charge votre abonnement ${endsAt ? `après le ${endsAt}` : "après sa période en cours"}. Choisissez votre offre dès maintenant ${aboveOffers ? "ci-dessous" : "dans l'onglet Abonnement"} : le premier prélèvement aura lieu ${endsAt ? `le ${endsAt}` : "à cette date"}, sans interruption.`}
        </p>
      </Callout>
    );
  }

  if (cabinet.viewerIsManager) {
    const action = cabinetActionFor(cabinet);
    return (
      <Callout type={unpaid ? "warning" : "info"} noMargin>
        <p>
          {unpaid
            ? "Le dernier paiement de cet espace n'est pas passé : mettez à jour votre carte pour que votre client garde son accès."
            : startsAt
              ? `Vous payez l'abonnement de cet espace à partir du ${startsAt}, à la fin de la période déjà payée par votre client.`
              : cabinet.subscriptionStatus
                ? "Vous payez l'abonnement de cet espace, avec votre remise de cabinet."
                : "Vous payez l'abonnement de cet espace : choisissez son offre avant la fin de l'essai pour que votre client ne soit pas interrompu."}{" "}
          {action && (
            <Link
              href={action.href}
              className="font-medium underline underline-offset-4"
            >
              {action.label}
            </Link>
          )}
        </p>
      </Callout>
    );
  }

  return (
    <Callout type={unpaid ? "warning" : "info"} noMargin>
      <p>
        L&apos;abonnement de cet espace est pris en charge par{" "}
        <strong>{cabinet.managerName}</strong>.{" "}
        {unpaid
          ? "Son dernier paiement n'est pas passé : c'est à votre cabinet de le régulariser."
          : startsAt
            ? `Il prend le relais le ${startsAt}, à la fin de la période que vous avez déjà payée : vous ne serez plus prélevé.`
            : "C'est votre cabinet qui choisit et gère votre offre : vous n'avez rien à faire."}
      </p>
    </Callout>
  );
}
