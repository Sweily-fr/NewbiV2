"use client";

import { useEffect, useState } from "react";
import { Callout } from "@/src/components/ui/callout";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { NO_SUBSCRIPTION_NOTICE } from "@/src/lib/gestionnaire-paths";

/**
 * Le cabinet arrive ici parce que l'espace qu'il ouvrait (le sien en
 * général) n'a pas d'abonnement (app/dashboard/layout.jsx). On le lui dit,
 * et on lui laisse de quoi abonner cet espace s'il veut s'en servir.
 */
export default function NoSubscriptionNotice() {
  const { organization } = useActiveOrganization();
  const [visible, setVisible] = useState(false);

  // ?espace=sans-abonnement : affiché une fois, retiré de l'adresse
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("espace") !== NO_SUBSCRIPTION_NOTICE) return;
    url.searchParams.delete("espace");
    window.history.replaceState(null, "", url.pathname + url.search);
    setVisible(true);
  }, []);

  if (!visible || !organization?.name) return null;

  const openSubscription = () =>
    window.dispatchEvent(
      new CustomEvent("newbi:open-settings", {
        detail: { tab: "subscription" },
      }),
    );

  return (
    <Callout type="info" noMargin>
      <p>
        <strong>{organization.name}</strong> n&apos;a pas d&apos;abonnement
        Newbi : vous restez dans votre espace gestionnaire, qui n&apos;en a pas
        besoin pour suivre vos clients.{" "}
        <button
          type="button"
          onClick={openSubscription}
          className="cursor-pointer font-medium underline underline-offset-4"
        >
          Choisir une offre pour cet espace
        </button>
      </p>
    </Callout>
  );
}
