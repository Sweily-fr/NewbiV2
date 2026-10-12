"use client";

import { useState } from "react";
import { ArrowUpRight, Inbox, LoaderCircle } from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";

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

function AccessBadge({ client }) {
  if (client.status !== "active") {
    return (
      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-900/20">
        Terminé
      </span>
    );
  }
  const { access } = client;
  if (access.type === "subscription") {
    return (
      <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
        Abonnement actif
      </span>
    );
  }
  if (access.type === "trial") {
    return (
      <span className="rounded-md bg-[#5a50ff]/10 px-2 py-1 text-xs font-medium text-[#5a50ff]">
        Essai jusqu&apos;au {formatDate(access.endsAt)}
      </span>
    );
  }
  return (
    <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
      Sans abonnement
    </span>
  );
}

/**
 * Liste des clients du gestionnaire. « Ouvrir » bascule sur l'espace du
 * client (organisation active) puis recharge le tableau de bord, comme le
 * sélecteur d'espaces, pour repartir d'un cache vierge.
 */
export default function ManagedClientsTable({ clients }) {
  const [opening, setOpening] = useState(null);

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

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background p-12 text-center text-sm text-muted-foreground">
        <Inbox className="size-6" />
        Aucun client pour l&apos;instant. Créez le premier avec « Nouveau client
        ».
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-border">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="h-10 p-2 pl-4 font-normal sm:pl-6">Client</th>
              <th className="h-10 p-2 font-normal">Dirigeant</th>
              <th className="h-10 p-2 font-normal">Formule</th>
              <th className="h-10 p-2 font-normal">Qui paie</th>
              <th className="h-10 p-2 font-normal">Accès</th>
              <th className="h-10 p-2 font-normal">Depuis le</th>
              <th className="h-10 p-2 pr-4 font-normal sm:pr-6" />
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                className="border-b text-[13px] last:border-b-0"
              >
                <td className="p-2 pl-4 sm:pl-6">
                  <div className="font-medium">
                    {client.name || "Espace supprimé"}
                  </div>
                  {client.siret && (
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {client.siret}
                    </div>
                  )}
                </td>
                <td className="p-2">
                  <div>{client.ownerName || "-"}</div>
                  <div className="text-xs text-muted-foreground">
                    {client.ownerEmail}
                  </div>
                </td>
                <td className="p-2">{PLAN_LABELS[client.plan] || "-"}</td>
                <td className="p-2">
                  {client.payer === "manager" ? "Vous" : "Le client"}
                </td>
                <td className="p-2">
                  <AccessBadge client={client} />
                </td>
                <td className="p-2 whitespace-nowrap text-muted-foreground">
                  {formatDate(client.startedAt)}
                </td>
                <td className="p-2 pr-4 text-right sm:pr-6">
                  {client.status === "active" && client.name && (
                    <Button
                      variant="outline"
                      size="sm"
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
