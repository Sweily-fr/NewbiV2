"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { cn } from "@/src/lib/utils";
import { franchiseGauge, formatVatEuros } from "@/src/utils/vat-declaration";

// Ouvre les paramètres sur « Informations légales » (écouté par le layout)
export function openLegalSettings() {
  window.dispatchEvent(
    new CustomEvent("newbi:open-settings", {
      detail: { tab: "informations-legales" },
    }),
  );
}

/** Situation de TVA incomplète : ce qui manque, rien n'est deviné. */
export function VatSetupCard({ missing }) {
  return (
    <section className="max-w-2xl rounded-lg border p-5">
      <h2 className="text-base font-medium">
        Complétez votre situation de TVA
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Le rythme et le calcul de vos déclarations dépendent de vos informations
        légales. Newbi ne les suppose pas.
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

function FranchiseRow({ title, revenue, threshold, upperThreshold }) {
  const gauge = franchiseGauge(revenue, threshold, upperThreshold);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{title}</span>
        <span className="text-muted-foreground tabular-nums">
          Seuil {formatVatEuros(threshold)}, majoré{" "}
          {formatVatEuros(upperThreshold)}
        </span>
      </div>
      <Progress
        value={gauge.percent}
        aria-label={`${title} : ${gauge.percent} % du seuil`}
        className={cn(
          "mt-2 h-2",
          gauge.tone === "warning" && "[&>*]:bg-amber-500",
          gauge.tone === "over" && "[&>*]:bg-red-600",
        )}
      />
      {gauge.label && (
        <p
          className={cn(
            "mt-1.5 text-xs",
            gauge.tone === "over"
              ? "text-red-600 dark:text-red-400"
              : "text-amber-700 dark:text-amber-400",
          )}
        >
          {gauge.label}
        </p>
      )}
    </div>
  );
}

/** Franchise en base : pas de déclaration, suivi des seuils de l'année. */
export function VatFranchiseCard({ franchise, rhythm }) {
  return (
    <section className="max-w-2xl rounded-lg border p-5">
      <h2 className="text-base font-medium">Vous êtes en franchise en base</h2>
      <p className="text-muted-foreground mt-1 text-sm">{rhythm}</p>
      <p className="mt-5 text-sm">
        Chiffre d'affaires HT facturé en {franchise.year}
      </p>
      <p className="mt-1 text-2xl font-medium tabular-nums">
        {formatVatEuros(franchise.revenueHT)}
      </p>
      <div className="mt-5 space-y-5">
        <FranchiseRow
          title="Si vous vendez des prestations de services"
          revenue={franchise.revenueHT}
          threshold={franchise.servicesThreshold}
          upperThreshold={franchise.servicesUpperThreshold}
        />
        <FranchiseRow
          title="Si vous vendez des marchandises ou de l'hébergement"
          revenue={franchise.revenueHT}
          threshold={franchise.goodsThreshold}
          upperThreshold={franchise.goodsUpperThreshold}
        />
      </div>
      <p className="text-muted-foreground mt-5 text-xs">
        Seuils {franchise.year} de l'article 293 B du CGI, à comparer à votre
        chiffre d'affaires de l'année en cours et de l'année précédente. En cas
        d'activité mixte, les deux seuils s'appliquent.
      </p>
    </section>
  );
}

/** Non assujetti : rien à déclarer. */
export function VatNotSubjectCard({ rhythm }) {
  return (
    <section className="max-w-2xl rounded-lg border p-5">
      <h2 className="text-base font-medium">Aucune déclaration de TVA</h2>
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
