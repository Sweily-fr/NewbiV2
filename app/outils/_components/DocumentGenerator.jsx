"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import { generatePDFFromElement } from "@/src/utils/generatePDF";
import { capture } from "@/src/lib/analytics";
import {
  compterDocument,
  envoyerComptage,
  SEUIL_HABITUE,
} from "@/src/lib/outils-usage";
import { montantLigneHT, numeroSuivant, remiseBornee } from "./calculs";
import {
  ArrowRight,
  Download,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

/**
 * Générateur de document public (facture ou devis), utilisable sans compte.
 *
 * Tout se passe dans le navigateur : la saisie n'est jamais envoyée au
 * serveur et le PDF est produit localement (generatePDFFromElement, le même
 * utilitaire que le produit). Conséquence voulue : le coût serveur est nul
 * quel que soit le nombre de documents générés, et aucune donnée d'un
 * visiteur anonyme n'est stockée chez Newbi.
 *
 * L'aperçu réutilise UniversalPreviewPDF, le gabarit du produit : le document
 * téléchargé est exactement celui que Newbi génère. Le composant appelle
 * useSession/useWorkspace, qui renvoient simplement null hors connexion (la
 * page /pdf-generator/invoice/preview repose déjà sur ce comportement).
 *
 * Facture et devis partagent ce composant : ils ne diffèrent que par le type
 * passé au gabarit, le libellé de la seconde date (échéance ou validité), les
 * avertissements légaux et le texte d'accroche. Tout cela vient de `config`.
 *
 * Ajouts du 15/11/2026 (audit SEO, comparaison avec les outils classés en
 * tête de Google) : logo, remise par ligne, type de facture (acompte, pro
 * forma), mémorisation facultative de l'émetteur et du dernier numéro, et
 * passage du devis à la facture. Le gabarit savait déjà afficher le logo
 * (`companyInfo.logo`), la remise (`discount` + `discountType`), le titre
 * « Facture d'acompte » (`invoiceType: "deposit"`), « Facture proforma »
 * (`status: "DRAFT"`) et la référence (`purchaseOrderNumber`).
 *
 * Ce qui est mémorisé l'est dans le navigateur du visiteur (localStorage),
 * seulement s'il coche la case, et s'efface quand il la décoche : la
 * promesse « votre saisie n'est jamais envoyée à Newbi » reste vraie.
 */

const TVA_RATES = [20, 10, 5.5, 2.1, 0];

const TYPES_FACTURE = [
  { value: "standard", label: "Facture" },
  { value: "deposit", label: "Facture d'acompte" },
  { value: "proforma", label: "Facture pro forma" },
];

const AIDE_TYPE = {
  deposit:
    "Le titre devient « Facture d'acompte ». Indiquez le devis concerné et une ligne du type « Acompte de 30 % sur le devis D-2026-004 », avec le taux de TVA de la prestation. Elle suit la même numérotation que vos autres factures.",
  proforma:
    "Une facture pro forma annonce une vente sans valeur comptable : elle ne compte pas dans votre numérotation (préfixe PF) et ne remplace pas la facture définitive, à émettre une fois la vente réalisée.",
};

const MENTION_PRO_FORMA =
  "Facture pro forma : document sans valeur comptable, qui ne remplace pas la facture définitive.";

// Stockage local : le profil mémorisé (case « Mémoriser »), propre à chaque
// générateur, et le devis transmis au générateur de facture, le temps d'une
// navigation.
const cleProfil = (type) => `newbi-outil-${type}-profil`;
const CLE_DEVIS_VERS_FACTURE = "newbi-outil-devis-vers-facture";

const LOGO_POIDS_MAX = 5 * 1024 * 1024;
const LOGO_LARGEUR_MAX = 600;
const LOGO_HAUTEUR_MAX = 240;

const ligneVide = () => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  vatRate: 20,
  unit: "unité",
});

// Jour à Paris (AAAA-MM-JJ) : en UTC, entre minuit et 2 h, la date
// proposée était la veille
const PARIS_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
});

function aujourdhui() {
  return PARIS_DAY.format(new Date());
}

function dansNJours(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return PARIS_DAY.format(d);
}

// localStorage / sessionStorage peuvent être absents ou lever une exception
// (navigation privée, cookies bloqués) : l'outil doit marcher sans eux.
function stockage(nom) {
  try {
    return typeof window === "undefined" ? null : window[nom];
  } catch {
    return null;
  }
}

function lire(store, cle) {
  if (!store) return null;
  try {
    const v = store.getItem(cle);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function ecrire(store, cle, valeur) {
  if (!store) return false;
  try {
    if (valeur === null) store.removeItem(cle);
    else store.setItem(cle, JSON.stringify(valeur));
    return true;
  } catch {
    return false;
  }
}

/**
 * Image choisie par le visiteur, réduite à 600 × 240 px au plus et convertie
 * en PNG (transparence gardée). Une petite image en `data:` tient dans le
 * stockage local et ne dépend d'aucun réseau au moment de faire le PDF.
 */
function preparerLogo(fichier) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onerror = () => reject(new Error("lecture"));
    lecteur.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image"));
      img.onload = () => {
        const l0 = img.naturalWidth || LOGO_LARGEUR_MAX;
        const h0 = img.naturalHeight || LOGO_HAUTEUR_MAX;
        const r = Math.min(1, LOGO_LARGEUR_MAX / l0, LOGO_HAUTEUR_MAX / h0);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(l0 * r));
        canvas.height = Math.max(1, Math.round(h0 * r));
        canvas
          .getContext("2d")
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = lecteur.result;
    };
    lecteur.readAsDataURL(fichier);
  });
}

// Chaque bloc du formulaire est un <fieldset> titré par sa <legend> : ces
// intitulés (« Votre entreprise », « Lignes »…) étaient des <h2> et ouvraient
// le plan de la page avant les vrais titres du guide.
function Section({ title, children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}
    >
      <fieldset className="min-w-0">
        {/* float + w-full : la légende se comporte comme un bloc ordinaire
            (marge basse respectée) au lieu de chevaucher le cadre */}
        <legend className="float-left w-full text-sm font-medium text-gray-900 mb-4">
          {title}
        </legend>
        <div className="clear-left">{children}</div>
      </fieldset>
    </section>
  );
}

function Champ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}) {
  // Libellé relié au champ (lu par les lecteurs d'écran)
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-xs text-gray-600 mb-1.5 block">
        {label}
      </Label>
      <Input
        id={id}
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
  const router = useRouter();
  // Préfixe des identifiants qui relient libellés et champs
  const fieldId = useId();
  const previewRef = useRef(null);
  const frameRef = useRef(null);
  const logoInputRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  // Combien de documents ce visiteur a créés (src/lib/outils-usage.js) : à
  // partir du 3e, l'encart des habitués remplace l'encart habituel.
  const [rangDocument, setRangDocument] = useState(0);
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

  const annee = new Date().getFullYear();
  const prefixeParDefaut = useCallback(
    (type) => `${type === "proforma" ? "PF" : config.prefix}-${annee}`,
    [config.prefix, annee],
  );

  // Facture : "standard", "deposit" (acompte) ou "proforma"
  const [docType, setDocType] = useState("standard");

  const [doc, setDoc] = useState({
    prefix: `${config.prefix}-${annee}`,
    number: "001",
    // Posées dans le navigateur (effet ci-dessous)
    issueDate: "",
    secondDate: "",
    reference: "",
    terms: config.defaultTerms,
  });

  // Dates du jour posées dans le navigateur : la page est pré-rendue à la
  // mise en ligne du site, des dates calculées au rendu seraient celles de
  // ce jour-là (dates fausses, erreur d'hydratation)
  useEffect(() => {
    setDoc((d) => ({
      ...d,
      issueDate: d.issueDate || aujourdhui(),
      secondDate: d.secondDate || dansNJours(config.secondDate.defaultDays),
    }));
  }, [config.secondDate.defaultDays]);

  const [items, setItems] = useState([ligneVide()]);

  const [logo, setLogo] = useState("");
  const [erreurLogo, setErreurLogo] = useState("");
  const [memoriser, setMemoriser] = useState(false);
  // Vrai une fois le profil mémorisé relu : avant, ne rien écrire (sinon la
  // case encore décochée effacerait le profil au premier rendu)
  const [profilLu, setProfilLu] = useState(false);
  // Référence du devis repris depuis le générateur de devis
  const [repriseDevis, setRepriseDevis] = useState(null);

  // Au montage : profil mémorisé, puis devis transmis par le générateur de
  // devis (il passe après : ce sont les informations du document en cours)
  useEffect(() => {
    const profil = lire(stockage("localStorage"), cleProfil(config.type));
    if (profil) {
      setMemoriser(true);
      if (profil.emetteur) setEmetteur((e) => ({ ...e, ...profil.emetteur }));
      if (profil.logo) setLogo(profil.logo);
      if (profil.dernierNumero) {
        setDoc((d) => ({
          ...d,
          prefix: profil.prefixe || d.prefix,
          number: numeroSuivant(profil.dernierNumero),
        }));
      }
    }

    if (config.acceptsQuoteHandoff) {
      const session = stockage("sessionStorage");
      const reprise = lire(session, CLE_DEVIS_VERS_FACTURE);
      if (reprise) {
        ecrire(session, CLE_DEVIS_VERS_FACTURE, null);
        if (reprise.emetteur) {
          setEmetteur((e) => ({ ...e, ...reprise.emetteur }));
        }
        if (reprise.client) setClient((c) => ({ ...c, ...reprise.client }));
        if (Array.isArray(reprise.items) && reprise.items.length > 0) {
          setItems(reprise.items.map((it) => ({ ...ligneVide(), ...it })));
        }
        if (reprise.logo) setLogo(reprise.logo);
        if (reprise.reference) {
          setDoc((d) => ({ ...d, reference: reprise.reference }));
        }
        setRepriseDevis(reprise.reference || "votre devis");
      }
    }

    setProfilLu(true);
  }, [config.type, config.acceptsQuoteHandoff]);

  // Profil tenu à jour tant que la case est cochée, effacé quand elle ne
  // l'est plus. Si le stockage est plein, on retente sans le logo.
  useEffect(() => {
    if (!profilLu) return;
    const local = stockage("localStorage");
    if (!local) return;
    const cle = cleProfil(config.type);
    if (!memoriser) {
      ecrire(local, cle, null);
      return;
    }
    const actuel = lire(local, cle) || {};
    if (!ecrire(local, cle, { ...actuel, emetteur, logo })) {
      ecrire(local, cle, { ...actuel, emetteur, logo: "" });
    }
  }, [profilLu, memoriser, emetteur, logo, config.type]);

  const choisirLogo = useCallback(async (e) => {
    const fichier = e.target.files?.[0];
    // Vider le champ permet de choisir à nouveau le même fichier
    e.target.value = "";
    if (!fichier) return;
    setErreurLogo("");
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(fichier.type)) {
      setErreurLogo("Format non pris en charge : PNG, JPG, WebP ou SVG.");
      return;
    }
    if (fichier.size > LOGO_POIDS_MAX) {
      setErreurLogo("Image trop lourde : 5 Mo au maximum.");
      return;
    }
    try {
      setLogo(await preparerLogo(fichier));
    } catch {
      setErreurLogo(
        "Cette image n'a pas pu être lue. Essayez un autre fichier.",
      );
    }
  }, []);

  const changerType = (nouveau) => {
    // Le préfixe suit le type tant que le visiteur ne l'a pas modifié
    setDoc((d) =>
      d.prefix === prefixeParDefaut(docType)
        ? { ...d, prefix: prefixeParDefaut(nouveau) }
        : d,
    );
    setDocType(nouveau);
  };

  const setItem = (i, patch) =>
    setItems((prev) =>
      prev.map((it, k) => (k === i ? { ...it, ...patch } : it)),
    );

  const totals = useMemo(() => {
    let ht = 0;
    let tva = 0;
    for (const it of items) {
      const l = montantLigneHT(it);
      ht += l;
      tva += emetteur.franchise ? 0 : (l * (Number(it.vatRate) || 0)) / 100;
    }
    return { ht, tva, ttc: ht + tva };
  }, [items, emetteur.franchise]);

  const estProForma = !isQuote && docType === "proforma";
  const estAcompte = !isQuote && docType === "deposit";

  /** Données au format attendu par le gabarit du produit. */
  const previewData = useMemo(
    () => ({
      prefix: doc.prefix,
      number: doc.number,
      // Le gabarit titre « Facture proforma » une facture au statut DRAFT
      status: estProForma ? "DRAFT" : "PENDING",
      ...(estAcompte ? { invoiceType: "deposit", isDepositInvoice: true } : {}),
      ...(doc.reference ? { purchaseOrderNumber: doc.reference } : {}),
      issueDate: doc.issueDate,
      executionDate: doc.issueDate,
      // Le gabarit lit `validUntil` pour un devis et `dueDate` pour une
      // facture : une seule saisie alimente l'un ou l'autre.
      ...(isQuote
        ? { validUntil: doc.secondDate }
        : { dueDate: doc.secondDate }),
      companyInfo: {
        name: emetteur.name || "Votre entreprise",
        ...(logo ? { logo } : {}),
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
        discount: remiseBornee(it.discount),
        discountType: "PERCENTAGE",
        vatRate: emetteur.franchise ? 0 : Number(it.vatRate) || 0,
        unit: it.unit || "unité",
      })),
      // La mention d'origine est ajoutée au bloc des conditions plutôt qu'aux
      // `footerNotes` : le gabarit impose une hauteur de 1200 px pour une page
      // A4 qui en fait 1123, si bien qu'un bloc supplémentaire en pied de
      // document tombe sur le bord de la page et n'est pas lisible.
      termsAndConditions: [
        estProForma ? MENTION_PRO_FORMA : null,
        emetteur.franchise
          ? "TVA non applicable, article 293 B du Code général des impôts."
          : null,
        doc.terms,
        "Document créé gratuitement sur newbi.fr",
      ]
        .filter(Boolean)
        .join("\n"),
    }),
    [emetteur, client, doc, items, isQuote, logo, estProForma, estAcompte],
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
      setDownloaded(true);
      // Comptage sans donnée personnelle : jamais la saisie, seulement l'outil
      // et le rang du document. Au mieux : ne bloque jamais le téléchargement.
      try {
        const outil = isQuote ? "devis" : "facture";
        const { rang, portee } = compterDocument();
        setRangDocument(rang);
        envoyerComptage({ outil, rang, portee });
        capture("generateur_document_telecharge", {
          outil,
          type: isQuote ? "devis" : docType,
          rang,
          portee,
        });
      } catch {
        // Mesure au mieux
      }
      // Numéro retenu pour proposer le suivant à la prochaine visite. Une
      // pro forma n'entre pas dans la séquence des factures.
      if (memoriser && !estProForma) {
        const local = stockage("localStorage");
        const cle = cleProfil(config.type);
        const actuel = lire(local, cle) || {};
        ecrire(local, cle, {
          ...actuel,
          prefixe: doc.prefix,
          dernierNumero: doc.number,
        });
      }
    } catch (e) {
      console.error("Génération du PDF impossible", e);
      alert(
        "La génération du PDF a échoué. Réessayez, et si le problème persiste, utilisez un autre navigateur.",
      );
    } finally {
      setDownloading(false);
    }
  }, [
    doc.prefix,
    doc.number,
    memoriser,
    estProForma,
    config.type,
    isQuote,
    docType,
  ]);

  /** Ouvre le générateur de facture prérempli avec ce devis. */
  const versFacture = () => {
    ecrire(stockage("sessionStorage"), CLE_DEVIS_VERS_FACTURE, {
      emetteur,
      client,
      items,
      logo,
      reference: `${doc.prefix}-${doc.number}`.replace(/^-/, ""),
    });
    router.push("/outils/generateur-de-facture");
  };

  const fmt = (n) =>
    n.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8">
      {/* ------------------------------ Formulaire ------------------------------ */}
      <div className="space-y-5">
        {repriseDevis && (
          <div
            role="status"
            className="rounded-xl border border-[#5A50FF]/30 bg-[#5A50FF]/[0.04] p-4 text-sm text-gray-700"
          >
            Informations reprises du devis {repriseDevis}. Vérifiez le numéro de
            facture, puis choisissez « Facture » ou « Facture d&apos;acompte ».
          </div>
        )}

        {config.documentTypes && (
          <Section title="Type de document">
            <div
              role="radiogroup"
              aria-label="Type de document"
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              {TYPES_FACTURE.map((t) => (
                <label
                  key={t.value}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-colors focus-within:ring-2 focus-within:ring-[#5A50FF]/40 ${
                    docType === t.value
                      ? "border-[#5A50FF] bg-[#5A50FF]/[0.06] font-medium text-gray-900"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${fieldId}-type`}
                    value={t.value}
                    checked={docType === t.value}
                    onChange={() => changerType(t.value)}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
            {AIDE_TYPE[docType] && (
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                {AIDE_TYPE[docType]}
              </p>
            )}
          </Section>
        )}

        <Section title="Votre entreprise">
          <div className="mb-4 flex items-start gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt="Votre logo"
                className="h-12 w-auto max-w-[120px] rounded border border-gray-200 bg-white object-contain p-1"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex size-12 flex-none items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400"
              >
                <ImagePlus className="size-5" />
              </div>
            )}
            <div className="min-w-0">
              <input
                ref={logoInputRef}
                id={`${fieldId}-logo`}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                // Masqué : le bouton « Ajouter votre logo » l'ouvre, et il
                // n'est pas annoncé deux fois aux lecteurs d'écran
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={choisirLogo}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logo ? "Changer le logo" : "Ajouter votre logo"}
                </Button>
                {logo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLogo("")}
                  >
                    Retirer
                  </Button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Facultatif. PNG, JPG, WebP ou SVG ; l&apos;image reste dans
                votre navigateur.
              </p>
              {erreurLogo && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {erreurLogo}
                </p>
              )}
            </div>
          </div>

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
              onCheckedChange={(v) =>
                setEmetteur({ ...emetteur, franchise: !!v })
              }
              className="mt-0.5"
            />
            <label
              htmlFor="franchise"
              className="text-sm text-gray-700 leading-snug"
            >
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

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3">
            <Checkbox
              id="memoriser"
              checked={memoriser}
              onCheckedChange={(v) => setMemoriser(!!v)}
              className="mt-0.5"
            />
            <label
              htmlFor="memoriser"
              className="text-sm text-gray-700 leading-snug"
            >
              Mémoriser mes coordonnées, mon logo et mon dernier numéro sur cet
              appareil
              <span className="block text-xs text-gray-500">
                Gardés dans ce navigateur seulement, jamais envoyés à Newbi. Le
                numéro suivant vous sera proposé à la prochaine visite. Décochez
                pour tout effacer.
              </span>
            </label>
          </div>
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
            {config.referenceField && (
              <Champ
                label={
                  estAcompte
                    ? "Devis ou commande concerné"
                    : "Référence du devis ou de la commande (facultatif)"
                }
                value={doc.reference}
                onChange={(v) => setDoc({ ...doc, reference: v })}
                placeholder="D-2026-004"
                className="sm:col-span-2"
              />
            )}
          </div>
          <div className="mt-3">
            <Label
              htmlFor={`${fieldId}-conditions`}
              className="text-xs text-gray-600 mb-1.5 block"
            >
              Conditions de règlement et mentions
            </Label>
            <textarea
              id={`${fieldId}-conditions`}
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
              <div key={i} className="rounded-lg bg-gray-50 p-3 space-y-2">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Label
                      htmlFor={`${fieldId}-ligne-${i}-designation`}
                      className="text-xs text-gray-600 mb-1.5 block"
                    >
                      Désignation
                    </Label>
                    <Input
                      id={`${fieldId}-ligne-${i}-designation`}
                      value={it.description}
                      placeholder={
                        estAcompte
                          ? "Acompte de 30 % sur le devis D-2026-004"
                          : "Prestation de conseil"
                      }
                      onChange={(e) =>
                        setItem(i, { description: e.target.value })
                      }
                      className="h-9"
                    />
                  </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <Label
                      htmlFor={`${fieldId}-ligne-${i}-quantite`}
                      className="text-xs text-gray-600 mb-1.5 block"
                    >
                      Qté
                    </Label>
                    <Input
                      id={`${fieldId}-ligne-${i}-quantite`}
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
                  <div>
                    <Label
                      htmlFor={`${fieldId}-ligne-${i}-prix`}
                      className="text-xs text-gray-600 mb-1.5 block"
                    >
                      Prix unitaire HT
                    </Label>
                    <Input
                      id={`${fieldId}-ligne-${i}-prix`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) =>
                        setItem(i, { unitPrice: e.target.value })
                      }
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`${fieldId}-ligne-${i}-remise`}
                      className="text-xs text-gray-600 mb-1.5 block"
                    >
                      Remise (%)
                    </Label>
                    <Input
                      id={`${fieldId}-ligne-${i}-remise`}
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={it.discount}
                      onChange={(e) => setItem(i, { discount: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`${fieldId}-ligne-${i}-tva`}
                      className="text-xs text-gray-600 mb-1.5 block"
                    >
                      TVA
                    </Label>
                    <select
                      id={`${fieldId}-ligne-${i}-tva`}
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
            <label
              htmlFor="consent"
              className="text-sm text-gray-700 leading-snug"
            >
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

          {config.toInvoice && (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="mt-3 w-full"
                onClick={versFacture}
              >
                Transformer ce devis en facture
                <ArrowRight className="size-4 ml-2" />
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                Le générateur de facture s&apos;ouvre avec votre entreprise,
                votre client et vos lignes déjà remplis.
              </p>
            </>
          )}

          <p className="mt-3 text-xs text-gray-500">
            Gratuit, sans inscription. Votre saisie reste dans votre navigateur
            et n'est jamais envoyée à Newbi.
          </p>

          {downloaded &&
            (rangDocument >= SEUIL_HABITUE && config.regularUser ? (
              // Habitué (3e document ou plus) : encart plus visible, le
              // téléchargement reste libre
              <div
                role="status"
                className="mt-4 rounded-xl bg-[#5A50FF] p-5 text-white"
              >
                <p className="text-base font-medium leading-snug">
                  {config.regularUser.title.replace("{n}", rangDocument)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/85">
                  {config.regularUser.text}
                </p>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="mt-4 w-full"
                >
                  <Link
                    href="/auth/signup"
                    onClick={() =>
                      capture("generateur_encart_clic", {
                        outil: isQuote ? "devis" : "facture",
                        encart: "habitue",
                        rang: rangDocument,
                      })
                    }
                  >
                    {config.regularUser.cta}
                  </Link>
                </Button>
                <p className="mt-2 text-xs text-white/80">
                  {config.regularUser.note}
                </p>
              </div>
            ) : (
              <div
                role="status"
                className="mt-4 rounded-lg border border-[#5A50FF]/30 bg-[#5A50FF]/[0.04] p-4"
              >
                <p className="text-sm font-medium text-gray-900">
                  {config.afterDownload.title}
                </p>
                <ul className="mt-2 space-y-1 list-disc pl-5 text-sm text-gray-700">
                  {config.afterDownload.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Button asChild size="sm" className="mt-3">
                  <Link
                    href="/auth/signup"
                    onClick={() =>
                      capture("generateur_encart_clic", {
                        outil: isQuote ? "devis" : "facture",
                        encart: "habituel",
                        rang: rangDocument,
                      })
                    }
                  >
                    {config.afterDownload.cta}
                  </Link>
                </Button>
                <p className="mt-2 text-xs text-gray-500">
                  7 jours gratuits, sans engagement.
                </p>
              </div>
            ))}
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
        <p className="text-sm font-medium text-gray-900 mb-3">
          Aperçu en direct
        </p>
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
