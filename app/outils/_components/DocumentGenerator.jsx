"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import { generatePDFFromElement } from "@/src/utils/generatePDF";
import { Plus, Trash2, Download, Loader2 } from "lucide-react";

/**
 * Générateur de document public (facture ou devis), utilisable sans compte.
 *
 * Tout se passe dans le navigateur : la saisie n'est jamais envoyée au
 * serveur et le PDF est produit localement (generatePDFFromElement, le même
 * utilitaire que le produit). Conséquence voulue : le coût serveur est nul
 * quel que soit le nombre de documents générés, et aucune donnée d'un
 * visiteur anonyme n'est stockée.
 *
 * L'aperçu réutilise UniversalPreviewPDF, le gabarit du produit : le document
 * téléchargé est exactement celui que Newbi génère. Le composant appelle
 * useSession/useWorkspace, qui renvoient simplement null hors connexion (la
 * page /pdf-generator/invoice/preview repose déjà sur ce comportement).
 *
 * Facture et devis partagent ce composant : ils ne diffèrent que par le type
 * passé au gabarit, le libellé de la seconde date (échéance ou validité), les
 * avertissements légaux et le texte d'accroche. Tout cela vient de `config`.
 */

const TVA_RATES = [20, 10, 5.5, 2.1, 0];

const ligneVide = () => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
  vatRate: 20,
  unit: "unité",
});

function aujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

function dansNJours(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function Section({ title, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}>
      <h2 className="text-sm font-medium text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Champ({ label, value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <div className={className}>
      <Label className="text-xs text-gray-600 mb-1.5 block">{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9"
      />
    </div>
  );
}

export default function DocumentGenerator({ config }) {
  const isQuote = config.type === "quote";
  const previewRef = useRef(null);
  const frameRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [consent, setConsent] = useState(false);

  // L'aperçu est rendu à sa largeur réelle (794 px, soit une page A4) puis
  // réduit par transform. Comme transform ne change pas la taille occupée
  // dans la mise en page, la largeur du cadre et sa hauteur sont calculées
  // ici, sinon le document déborde et se retrouve coupé à droite.
  const [frame, setFrame] = useState({ scale: 1, height: 0 });
  useEffect(() => {
    const el = frameRef.current;
    const content = previewRef.current;
    if (!el || !content) return;
    const measure = () => {
      const scale = Math.min(1, el.clientWidth / 794);
      setFrame({ scale, height: content.offsetHeight * scale });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  const [emetteur, setEmetteur] = useState({
    name: "",
    street: "",
    postalCode: "",
    city: "",
    email: "",
    phone: "",
    siren: "",
    vatNumber: "",
    legalForm: "",
    franchise: false,
  });

  const [client, setClient] = useState({
    name: "",
    street: "",
    postalCode: "",
    city: "",
    email: "",
    siret: "",
  });

  const [doc, setDoc] = useState({
    prefix: `${config.prefix}-${new Date().getFullYear()}`,
    number: "001",
    issueDate: aujourdhui(),
    secondDate: dansNJours(config.secondDate.defaultDays),
    terms: config.defaultTerms,
  });

  const [items, setItems] = useState([ligneVide()]);

  const setItem = (i, patch) =>
    setItems((prev) => prev.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  const totals = useMemo(() => {
    let ht = 0;
    let tva = 0;
    for (const it of items) {
      const l = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      ht += l;
      tva += emetteur.franchise ? 0 : (l * (Number(it.vatRate) || 0)) / 100;
    }
    return { ht, tva, ttc: ht + tva };
  }, [items, emetteur.franchise]);

  /** Données au format attendu par le gabarit du produit. */
  const previewData = useMemo(
    () => ({
      prefix: doc.prefix,
      number: doc.number,
      status: "PENDING",
      issueDate: doc.issueDate,
      executionDate: doc.issueDate,
      // Le gabarit lit `validUntil` pour un devis et `dueDate` pour une
      // facture : une seule saisie alimente l'un ou l'autre.
      ...(isQuote ? { validUntil: doc.secondDate } : { dueDate: doc.secondDate }),
      companyInfo: {
        name: emetteur.name || "Votre entreprise",
        address: {
          street: emetteur.street,
          postalCode: emetteur.postalCode,
          city: emetteur.city,
          country: "France",
        },
        email: emetteur.email,
        phone: emetteur.phone,
        siren: emetteur.siren,
        legalForm: emetteur.legalForm,
        ...(emetteur.franchise
          ? { vatFranchise: true }
          : { vatNumber: emetteur.vatNumber }),
      },
      client: {
        name: client.name || "Votre client",
        address: {
          street: client.street,
          postalCode: client.postalCode,
          city: client.city,
          country: "France",
        },
        email: client.email,
        siret: client.siret,
      },
      items: items.map((it) => ({
        description: it.description || "Prestation",
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        vatRate: emetteur.franchise ? 0 : Number(it.vatRate) || 0,
        unit: it.unit || "unité",
      })),
      // La mention d'origine est ajoutée au bloc des conditions plutôt qu'aux
      // `footerNotes` : le gabarit impose une hauteur de 1200 px pour une page
      // A4 qui en fait 1123, si bien qu'un bloc supplémentaire en pied de
      // document tombe sur le bord de la page et n'est pas lisible.
      termsAndConditions: [
        emetteur.franchise
          ? "TVA non applicable, article 293 B du Code général des impôts."
          : null,
        doc.terms,
        "Document créé gratuitement sur newbi.fr",
      ]
        .filter(Boolean)
        .join("\n"),
    }),
    [emetteur, client, doc, items, isQuote]
  );

  const telecharger = useCallback(async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const bytes = await generatePDFFromElement(previewRef.current);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.prefix}-${doc.number}.pdf`.replace(/^-/, "");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Génération du PDF impossible", e);
      alert(
        "La génération du PDF a échoué. Réessayez, et si le problème persiste, utilisez un autre navigateur."
      );
    } finally {
      setDownloading(false);
    }
  }, [doc.prefix, doc.number]);

  const fmt = (n) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8">
      {/* ------------------------------ Formulaire ------------------------------ */}
      <div className="space-y-5">
        <Section title="Votre entreprise">
          <div className="grid sm:grid-cols-2 gap-3">
            <Champ
              label="Dénomination ou nom et prénom"
              value={emetteur.name}
              onChange={(v) => setEmetteur({ ...emetteur, name: v })}
              placeholder="Atelier Dupont"
              className="sm:col-span-2"
            />
            <Champ
              label="Adresse"
              value={emetteur.street}
              onChange={(v) => setEmetteur({ ...emetteur, street: v })}
              placeholder="12 rue des Lilas"
              className="sm:col-span-2"
            />
            <Champ
              label="Code postal"
              value={emetteur.postalCode}
              onChange={(v) => setEmetteur({ ...emetteur, postalCode: v })}
              placeholder="75011"
            />
            <Champ
              label="Ville"
              value={emetteur.city}
              onChange={(v) => setEmetteur({ ...emetteur, city: v })}
              placeholder="Paris"
            />
            <Champ
              label="SIREN"
              value={emetteur.siren}
              onChange={(v) => setEmetteur({ ...emetteur, siren: v })}
              placeholder="123456789"
            />
            <Champ
              label="Forme juridique"
              value={emetteur.legalForm}
              onChange={(v) => setEmetteur({ ...emetteur, legalForm: v })}
              placeholder="SASU, EI, micro-entreprise…"
            />
            <Champ
              label="Courriel"
              value={emetteur.email}
              onChange={(v) => setEmetteur({ ...emetteur, email: v })}
              placeholder="contact@exemple.fr"
            />
            <Champ
              label="Téléphone"
              value={emetteur.phone}
              onChange={(v) => setEmetteur({ ...emetteur, phone: v })}
              placeholder="01 23 45 67 89"
            />
          </div>

          <div className="mt-4 flex items-start gap-2">
            <Checkbox
              id="franchise"
              checked={emetteur.franchise}
              onCheckedChange={(v) => setEmetteur({ ...emetteur, franchise: !!v })}
              className="mt-0.5"
            />
            <label htmlFor="franchise" className="text-sm text-gray-700 leading-snug">
              Je suis en franchise en base de TVA
              <span className="block text-xs text-gray-500">
                La mention de l'article 293 B est ajoutée et les montants sont
                affichés sans TVA.
              </span>
            </label>
          </div>

          {!emetteur.franchise && (
            <Champ
              label="Numéro de TVA intracommunautaire"
              value={emetteur.vatNumber}
              onChange={(v) => setEmetteur({ ...emetteur, vatNumber: v })}
              placeholder="FR00123456789"
              className="mt-3"
            />
          )}
        </Section>

        <Section title="Votre client">
          <div className="grid sm:grid-cols-2 gap-3">
            <Champ
              label="Dénomination ou nom et prénom"
              value={client.name}
              onChange={(v) => setClient({ ...client, name: v })}
              placeholder="Société Martin"
              className="sm:col-span-2"
            />
            <Champ
              label="Adresse"
              value={client.street}
              onChange={(v) => setClient({ ...client, street: v })}
              placeholder="5 avenue de la République"
              className="sm:col-span-2"
            />
            <Champ
              label="Code postal"
              value={client.postalCode}
              onChange={(v) => setClient({ ...client, postalCode: v })}
              placeholder="69003"
            />
            <Champ
              label="Ville"
              value={client.city}
              onChange={(v) => setClient({ ...client, city: v })}
              placeholder="Lyon"
            />
            <Champ
              label="SIRET (client professionnel)"
              value={client.siret}
              onChange={(v) => setClient({ ...client, siret: v })}
              placeholder="12345678900012"
            />
            <Champ
              label="Courriel"
              value={client.email}
              onChange={(v) => setClient({ ...client, email: v })}
              placeholder="contact@client.fr"
            />
          </div>
        </Section>

        <Section title={config.sectionTitle}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Champ
              label="Préfixe"
              value={doc.prefix}
              onChange={(v) => setDoc({ ...doc, prefix: v })}
              placeholder="F-2026"
            />
            <Champ
              label="Numéro"
              value={doc.number}
              onChange={(v) => setDoc({ ...doc, number: v })}
              placeholder="001"
            />
            <Champ
              label="Date d'émission"
              type="date"
              value={doc.issueDate}
              onChange={(v) => setDoc({ ...doc, issueDate: v })}
            />
            <Champ
              label={config.secondDate.label}
              type="date"
              value={doc.secondDate}
              onChange={(v) => setDoc({ ...doc, secondDate: v })}
            />
          </div>
          <div className="mt-3">
            <Label className="text-xs text-gray-600 mb-1.5 block">
              Conditions de règlement et mentions
            </Label>
            <textarea
              value={doc.terms}
              onChange={(e) => setDoc({ ...doc, terms: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </Section>

        <Section title="Lignes">
          <div className="space-y-3">
            {items.map((it, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-end rounded-lg bg-gray-50 p-3"
              >
                <div className="col-span-12 sm:col-span-5">
                  <Label className="text-xs text-gray-600 mb-1.5 block">
                    Désignation
                  </Label>
                  <Input
                    value={it.description}
                    placeholder="Prestation de conseil"
                    onChange={(e) => setItem(i, { description: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Label className="text-xs text-gray-600 mb-1.5 block">Qté</Label>
                  <Input
                    type="number"
                    min="0"
                    // Une quantité se compte en unités : les flèches montent
                    // de 1 en 1. La saisie de décimales reste possible pour
                    // les heures ou les mètres carrés.
                    step="1"
                    value={it.quantity}
                    onChange={(e) => setItem(i, { quantity: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Label className="text-xs text-gray-600 mb-1.5 block">
                    Prix unitaire
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.unitPrice}
                    onChange={(e) => setItem(i, { unitPrice: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Label className="text-xs text-gray-600 mb-1.5 block">TVA</Label>
                  <select
                    value={it.vatRate}
                    disabled={emetteur.franchise}
                    onChange={(e) => setItem(i, { vatRate: e.target.value })}
                    className="h-9 w-full rounded-md border border-gray-200 px-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {TVA_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r} %
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Supprimer la ligne"
                    disabled={items.length === 1}
                    onClick={() => setItems(items.filter((_, k) => k !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setItems([...items, ligneVide()])}
          >
            <Plus className="size-4 mr-1" /> Ajouter une ligne
          </Button>

          <dl className="mt-5 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Total HT</dt>
              <dd>{fmt(totals.ht)} €</dd>
            </div>
            {!emetteur.franchise && (
              <div className="flex justify-between text-gray-600">
                <dt>TVA</dt>
                <dd>{fmt(totals.tva)} €</dd>
              </div>
            )}
            <div className="flex justify-between font-medium text-gray-900 pt-1.5 border-t border-gray-200">
              <dt>{emetteur.franchise ? "Total à payer" : "Total TTC"}</dt>
              <dd>{fmt(totals.ttc)} €</dd>
            </div>
          </dl>
        </Section>

        {/* ------------------------- Téléchargement ------------------------- */}
        <Section title={config.downloadTitle}>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <p className="font-medium mb-2">{config.warnings.title}</p>
            <ul className="space-y-1.5 list-disc pl-5">
              {config.warnings.items.map((w) => (
                <li key={w.label}>
                  <strong>{w.label}</strong> {w.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex items-start gap-2">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(v) => setConsent(!!v)}
              className="mt-0.5"
            />
            <label htmlFor="consent" className="text-sm text-gray-700 leading-snug">
{config.warnings.consent}
            </label>
          </div>

          <Button
            type="button"
            size="lg"
            className="mt-4 w-full"
            disabled={!consent || downloading}
            onClick={telecharger}
          >
            {downloading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" /> Génération…
              </>
            ) : (
              <>
                <Download className="size-4 mr-2" /> {config.downloadLabel}
              </>
            )}
          </Button>

          <p className="mt-3 text-xs text-gray-500">
            Gratuit, sans inscription. Votre saisie reste dans votre navigateur
            et n'est jamais envoyée à Newbi.
          </p>
        </Section>

        {/* ---------------------------- Accroche ---------------------------- */}
        <div className="rounded-xl bg-[#5A50FF] p-6 text-white">
          <p className="text-lg font-medium leading-snug">{config.cta.title}</p>
          <p className="mt-2 text-sm text-white/85">{config.cta.subtitle}</p>
          <Button asChild variant="secondary" size="lg" className="mt-4">
            <Link href="/auth/signup">Créer mon compte gratuitement</Link>
          </Button>
        </div>
      </div>

      {/* -------------------------------- Aperçu -------------------------------- */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-sm font-medium text-gray-900 mb-3">Aperçu en direct</p>
        <div
          ref={frameRef}
          className="rounded-xl border border-gray-200 overflow-hidden bg-white"
          style={frame.height ? { height: frame.height } : undefined}
        >
          <div
            className="w-[794px] origin-top-left"
            style={{ transform: `scale(${frame.scale})` }}
          >
            <div ref={previewRef}>
              <UniversalPreviewPDF
                data={previewData}
                type={config.type}
                ignoreOrganization
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
