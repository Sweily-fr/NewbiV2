"use client";

import Link from "next/link";
import { Callout } from "@/src/components/ui/callout";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";

const UNPAID = ["past_due", "unpaid", "incomplete"];

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
export default function PaidByCabinetNotice({ cabinet }) {
  if (!cabinet) return null;
  const unpaid = UNPAID.includes(cabinet.subscriptionStatus);

  if (cabinet.viewerIsManager) {
    const action = cabinetActionFor(cabinet);
    return (
      <Callout type={unpaid ? "warning" : "info"} noMargin>
        <p>
          {unpaid
            ? "Le dernier paiement de cet espace n'est pas passé : mettez à jour votre carte pour que votre client garde son accès."
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
          : "C'est votre cabinet qui choisit et gère votre offre : vous n'avez rien à faire."}
      </p>
    </Callout>
  );
}
