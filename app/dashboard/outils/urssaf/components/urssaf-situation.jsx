"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";

// Ouvre les paramètres sur « Informations légales » (écouté par le layout)
export function openLegalSettings() {
  window.dispatchEvent(
    new CustomEvent("newbi:open-settings", {
      detail: { tab: "informations-legales" },
    }),
  );
}

/** Situation incomplète : ce qui manque, rien n'est deviné. */
export function UrssafSetupCard({ missing }) {
  return (
    <section className="max-w-2xl rounded-lg border p-5">
      <h2 className="text-base font-medium">
        Complétez votre situation de micro-entrepreneur
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Le rythme de vos déclarations et la case de chaque encaissement
        dépendent de vos informations légales. Newbi ne les suppose pas.
      </p>
      {missing.length > 0 && (
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm">
          {missing.map((item) => (
            <li key={item.code}>{item.label}</li>
          ))}
        </ul>
      )}
      <Button
        size="sm"
        className="mt-4 gap-1.5 bg-[#5a50ff] hover:bg-[#5a50ff]/90"
        onClick={openLegalSettings}
      >
        Ouvrir les informations légales
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Button>
    </section>
  );
}

/** Pas micro-entrepreneur : pas de déclaration de chiffre d'affaires. */
export function UrssafNotMicroCard({ rhythm }) {
  return (
    <section className="max-w-2xl rounded-lg border p-5">
      <h2 className="text-base font-medium">Aucune déclaration Urssaf</h2>
      <p className="text-muted-foreground mt-1 text-sm">{rhythm}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={openLegalSettings}
      >
        Vérifier mes informations légales
      </Button>
    </section>
  );
}

/**
 * Informations facultatives pour estimer les cotisations : sans elles, le
 * chiffre d'affaires reste calculé.
 */
export function UrssafEstimateNotice({ missing }) {
  if (!missing?.length) return null;
  return (
    <section className="rounded-lg border p-4 text-sm">
      <p className="font-medium">Pour estimer vos cotisations</p>
      <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
        {missing.map((item) => (
          <li key={item.code}>{item.label}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={openLegalSettings}
        className="mt-2 cursor-pointer text-[#5a50ff] hover:underline"
      >
        Compléter les informations légales
      </button>
    </section>
  );
}
