"use client";

import { useMemo, useState } from "react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Check, Copy } from "lucide-react";

// Calcul des pénalités de retard entre professionnels.
//
// Règles appliquées (Code de commerce, articles L441-10 et D441-5) :
// - les pénalités courent le jour suivant la date d'échéance, sans rappel ;
// - elles se calculent sur le montant TTC resté impayé ;
// - l'indemnité forfaitaire de recouvrement est de 40 euros PAR FACTURE.
//
// Le taux reste saisi par l'utilisateur : le taux d'intérêt légal est publié
// par arrêté chaque semestre et le taux directeur de la BCE change, les coder
// en dur reviendrait à afficher un chiffre faux quelques mois plus tard.

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

function parseNombre(valeur) {
  const n = Number.parseFloat(String(valeur).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function aujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

export default function PenaltyCalculator() {
  const [montant, setMontant] = useState("");
  const [echeance, setEcheance] = useState("");
  const [paiement, setPaiement] = useState(aujourdhui());
  const [taux, setTaux] = useState("");
  const [indemnite, setIndemnite] = useState(true);
  const [copie, setCopie] = useState(false);

  const resultat = useMemo(() => {
    const montantTTC = parseNombre(montant);
    const tauxAnnuel = parseNombre(taux);
    if (!montantTTC || !echeance || !paiement) return null;

    const fin = new Date(`${paiement}T00:00:00`);
    const debut = new Date(`${echeance}T00:00:00`);
    if (Number.isNaN(fin.getTime()) || Number.isNaN(debut.getTime())) return null;

    // Les pénalités courent à partir du lendemain de l'échéance : un paiement
    // le jour même de l'échéance n'est pas en retard.
    const jours = Math.max(
      0,
      Math.round((fin - debut) / (24 * 60 * 60 * 1000))
    );
    const penalites = (montantTTC * (tauxAnnuel / 100) * jours) / 365;
    const forfait = indemnite && jours > 0 ? 40 : 0;

    return {
      jours,
      penalites,
      forfait,
      total: montantTTC + penalites + forfait,
      montantTTC,
      tauxAnnuel,
    };
  }, [montant, echeance, paiement, taux, indemnite]);

  const texteRelance = resultat
    ? `Sauf erreur de notre part, la facture d'un montant de ${EUR.format(
        resultat.montantTTC
      )} arrivée à échéance le ${new Date(
        `${echeance}T00:00:00`
      ).toLocaleDateString("fr-FR")} demeure impayée à ce jour, soit ${
        resultat.jours
      } jour${resultat.jours > 1 ? "s" : ""} de retard.

Conformément à l'article L441-10 du Code de commerce et à nos conditions générales de vente, des pénalités de retard au taux annuel de ${resultat.tauxAnnuel
        .toString()
        .replace(".", ",")} % sont exigibles de plein droit, soit ${EUR.format(
        resultat.penalites
      )}${
        resultat.forfait
          ? `, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de ${EUR.format(
              resultat.forfait
            )}`
          : ""
      }.

Le montant total dû s'élève donc à ${EUR.format(
        resultat.total
      )}. Nous vous remercions de bien vouloir procéder à son règlement dans les meilleurs délais.`
    : "";

  async function copier() {
    try {
      await navigator.clipboard.writeText(texteRelance);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers refusé (Safari sans geste utilisateur, http) : on laisse
      // l'utilisateur sélectionner le texte à la main, il est affiché.
      setCopie(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="montant">Montant TTC resté impayé</Label>
            <div className="relative">
              <Input
                id="montant"
                inputMode="decimal"
                placeholder="1 200"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                €
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="echeance">Date d&apos;échéance</Label>
              <Input
                id="echeance"
                type="date"
                value={echeance}
                onChange={(e) => setEcheance(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paiement">Date de paiement</Label>
              <Input
                id="paiement"
                type="date"
                value={paiement}
                onChange={(e) => setPaiement(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taux">Taux annuel des pénalités</Label>
            <div className="relative">
              <Input
                id="taux"
                inputMode="decimal"
                placeholder="Ex. 12"
                value={taux}
                onChange={(e) => setTaux(e.target.value)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                %
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Le taux de vos conditions générales de vente. La clause la plus
              répandue retient trois fois le taux d&apos;intérêt légal, publié
              chaque semestre au Journal officiel. Sans clause, c&apos;est le
              taux directeur de la BCE majoré de dix points qui s&apos;applique.
            </p>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <Checkbox
              id="indemnite"
              checked={indemnite}
              onCheckedChange={(v) => setIndemnite(v === true)}
            />
            <Label
              htmlFor="indemnite"
              className="text-sm font-normal leading-snug text-gray-600"
            >
              Ajouter l&apos;indemnité forfaitaire de recouvrement de 40 euros,
              due pour chaque facture payée en retard
            </Label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {!resultat ? (
          <p className="text-sm text-gray-500">
            Renseignez le montant, les deux dates et votre taux : le calcul se
            fait au fur et à mesure, rien n&apos;est envoyé ni enregistré.
          </p>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {resultat.jours === 0
                ? "Aucun retard"
                : `${resultat.jours} jour${resultat.jours > 1 ? "s" : ""} de retard`}
            </p>
            <p className="mt-2 text-3xl font-medium tracking-tight text-gray-900">
              {EUR.format(resultat.total)}
            </p>
            <p className="text-sm text-gray-500">montant total dû</p>

            <dl className="mt-6 divide-y divide-gray-100 border-y border-gray-100 text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-gray-600">Facture impayée</dt>
                <dd className="text-gray-900">
                  {EUR.format(resultat.montantTTC)}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-gray-600">Pénalités de retard</dt>
                <dd className="text-gray-900">
                  {EUR.format(resultat.penalites)}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-gray-600">Indemnité forfaitaire</dt>
                <dd className="text-gray-900">{EUR.format(resultat.forfait)}</dd>
              </div>
            </dl>

            {resultat.jours > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    Paragraphe de relance
                  </p>
                  <button
                    type="button"
                    onClick={copier}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:border-[#5a50ff] hover:text-[#5a50ff] transition-colors"
                  >
                    {copie ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copie ? "Copié" : "Copier"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-xs leading-relaxed text-gray-700 font-sans">
                  {texteRelance}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
