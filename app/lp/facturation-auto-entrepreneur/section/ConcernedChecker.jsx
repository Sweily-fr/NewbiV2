"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon, LoaderCircle, Check, Info } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import LpCtaButton from "../../_components/LpCtaButton";
import { WHATSAPP_CONTACT_URL } from "@/src/lib/whatsapp";
import { WhatsAppIcon } from "@/src/components/whatsapp-contact-button";

// Simulateur « Auto-entrepreneur, es-tu concerné ? » (copie de
// /lp/facturation-electronique, textes orientés micro-entreprise) : recherche
// d'entreprise (nom ou SIREN) via le proxy /api/search-companies (API
// recherche-entreprises.api.gouv.fr), puis résultat avec les échéances de la
// réforme selon la catégorie :
//  - réception : toutes les entreprises au 1er septembre 2026 ;
//  - émission : grandes entreprises et ETI au 1er septembre 2026,
//    PME / TPE / micro-entreprises au 1er septembre 2027.

const LEGAL_FORMS = {
  1000: "Entrepreneur individuel",
  5498: "EURL",
  5499: "SARL",
  5710: "SAS",
  5720: "SASU",
  5202: "SNC",
  5505: "SA",
  5510: "SA",
  5599: "SA",
  6540: "SCI",
  6220: "GIE",
  9220: "Association",
};

const CATEGORY_LABEL = {
  GE: "Grande entreprise",
  ETI: "ETI",
  PME: "PME / TPE",
};

function legalForm(code) {
  if (!code) return "Entreprise";
  if (LEGAL_FORMS[code]) return LEGAL_FORMS[code];
  const c = String(code);
  if (c.startsWith("1")) return "Entrepreneur individuel";
  if (c.startsWith("54")) return "SARL";
  if (c.startsWith("57")) return "SAS";
  if (c.startsWith("55") || c.startsWith("56")) return "SA";
  if (c.startsWith("65")) return "Société civile";
  if (c.startsWith("92")) return "Association";
  return "Société";
}

function formatSiren(siren = "") {
  return siren.replace(/(\d{3})(?=\d)/g, "$1 ");
}

function deadlines(company) {
  const cat = company.categorie_entreprise;
  const big = cat === "GE" || cat === "ETI";
  return {
    reception: {
      when: "sept. 2026",
      note: "Tous les auto-entrepreneurs, même en franchise en base de TVA, doivent pouvoir recevoir des factures électroniques via une plateforme agréée.",
    },
    emission: big
      ? {
          when: "sept. 2026",
          note: "Les grandes entreprises et ETI émettent leurs factures au format électronique dès le 1er septembre 2026.",
        }
      : {
          when: "sept. 2027",
          note: "Les micro-entreprises (auto-entrepreneurs), TPE et PME émettent leurs factures au format électronique à partir du 1er septembre 2027.",
        },
  };
}

export default function ConcernedChecker() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);
  // Inscription à l'annuaire (plateforme agréée) : null = en cours,
  // { available:false } = vérification indisponible, sinon { registered, pdpName }
  const [directory, setDirectory] = useState(null);
  const boxRef = useRef(null);
  const resultRef = useRef(null);

  // Recherche avec délai pendant la saisie (pas de nouvelle recherche quand
  // le champ vient d'être rempli par la sélection d'une entreprise)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    if (company) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/search-companies?q=${encodeURIComponent(q)}&limite=6`,
          { signal: ctrl.signal },
        );
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch (e) {
        if (e.name !== "AbortError")
          setError(
            "La recherche est indisponible pour le moment. Réessaie dans un instant.",
          );
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, company]);

  // Ferme la liste au clic à l'extérieur
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Vérifie l'inscription à l'annuaire dès qu'une entreprise est sélectionnée
  useEffect(() => {
    if (!company?.siren) return;
    const ctrl = new AbortController();
    setDirectory(null);
    fetch(`/api/einvoicing-directory?siren=${company.siren}`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((data) => setDirectory(data))
      .catch((e) => {
        if (e.name !== "AbortError") setDirectory({ available: false });
      });
    return () => ctrl.abort();
  }, [company]);

  const select = (c) => {
    setCompany(c);
    setQuery(c.nom_raison_sociale || c.nom_complet);
    setOpen(false);
    setTimeout(
      () =>
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        }),
      50,
    );
  };

  const submit = (e) => {
    e.preventDefault();
    if (results[0]) select(results[0]);
  };

  const d = company ? deadlines(company) : null;

  return (
    <section id="concerne" className="px-5 py-14 md:py-20 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-5">
            Auto-entrepreneur, es-tu concerné par la facturation électronique ?
          </h2>
          <p className="text-base md:text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Tape ton nom ou ton SIREN : en quelques secondes, tu sais si tu es
            concerné, même en franchise de TVA, et à quelles dates.
          </p>

          {/* Recherche */}
          <form onSubmit={submit} ref={boxRef} className="relative">
            {/* Input + bouton du design system (même pattern que InputLoader) */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  size="lg"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCompany(null);
                  }}
                  onFocus={() => results.length && setOpen(true)}
                  placeholder="Ton nom, ta micro-entreprise ou ton SIREN"
                  aria-label="Ton nom, ta micro-entreprise ou ton SIREN"
                  autoComplete="off"
                  className="peer ps-10 h-12 bg-white"
                />
                <div className="text-[rgba(0,0,0,0.35)] pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5 peer-disabled:opacity-50">
                  {loading ? (
                    <LoaderCircle
                      className="animate-spin"
                      size={18}
                      role="status"
                      aria-label="Recherche en cours"
                    />
                  ) : (
                    <SearchIcon size={18} aria-hidden="true" />
                  )}
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-6 text-base rounded-[9px] w-full sm:w-auto"
              >
                Vérifier
              </Button>
            </div>

            {open && results.length > 0 && (
              <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-lg text-left">
                {results.map((c) => (
                  <li key={c.siren}>
                    <button
                      type="button"
                      onClick={() => select(c)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left hover:bg-gray-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium text-gray-950">
                          {c.nom_raison_sociale || c.nom_complet}
                        </span>
                        <span className="block text-[13px] text-gray-500">
                          {legalForm(c.nature_juridique)} · SIREN{" "}
                          {formatSiren(c.siren)}
                          {c.siege?.libelle_commune
                            ? ` · ${c.siege.libelle_commune}`
                            : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {open &&
              !loading &&
              query.trim().length >= 2 &&
              results.length === 0 &&
              !error && (
                <p className="mt-3 text-sm text-gray-500">
                  Aucune micro-entreprise trouvée. Essaie avec ton SIREN.
                </p>
              )}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </form>
        </div>

        {/* Résultat */}
        {company && d && (
          <div
            ref={resultRef}
            className="mt-10 md:mt-14 grid lg:grid-cols-2 gap-8 lg:gap-12 rounded-3xl bg-[#F4F4F5] p-7 md:p-10"
          >
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-500 mb-4">Résultat</p>
              <h3 className="text-2xl md:text-3xl font-medium tracking-tight leading-snug text-gray-950 text-balance">
                Tu es{" "}
                <span className="inline-block rounded-lg bg-[#202020] px-2 text-white">
                  concerné
                </span>{" "}
                par la facturation électronique, même en franchise de TVA
              </h3>
              <p className="mt-5 text-[15px] leading-relaxed text-gray-700">
                Avec Newbi, tes factures partent au bon format, avec la mention
                « TVA non applicable » déjà en place, sans surcoût. Crée ton
                compte, ton SIRET pré-remplit le reste, et ta première facture
                conforme part dans la matinée.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-center gap-3">
                <LpCtaButton
                  dark
                  sublabel={null}
                  className="w-full sm:w-auto whitespace-nowrap px-6"
                />
                <a
                  href={WHATSAPP_CONTACT_URL}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap rounded-xl px-6 py-3 text-base font-medium text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 transition"
                >
                  <WhatsAppIcon className="size-5 text-[#25D366]" />
                  Une question ? WhatsApp
                </a>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 md:p-7">
              <p className="text-xl font-medium text-gray-950">
                {company.nom_raison_sociale || company.nom_complet}
              </p>
              <p className="mt-1.5 text-sm text-gray-500">
                {legalForm(company.nature_juridique)} · SIREN{" "}
                {formatSiren(company.siren)}
                {CATEGORY_LABEL[company.categorie_entreprise]
                  ? ` · ${CATEGORY_LABEL[company.categorie_entreprise]}`
                  : ""}
                {directory?.available
                  ? ` · Plateforme agréée : ${directory.registered ? "inscrite" : "non inscrite"}`
                  : ""}
              </p>

              {/* Inscription à l'annuaire (plateforme agréée) */}
              {directory === null ? (
                <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-gray-100 px-4 py-3 text-[15px] text-gray-600">
                  <LoaderCircle className="size-4 shrink-0 animate-spin" />
                  Vérification de l'inscription à une plateforme agréée…
                </div>
              ) : directory.available && directory.registered ? (
                <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-green-50 px-4 py-3 text-[15px] text-green-800">
                  <Check className="size-4 shrink-0 text-green-600" />
                  <span>
                    Inscrite à une plateforme agréée
                    {directory.pdpName ? ` (${directory.pdpName})` : ""} : tu
                    peux déjà recevoir des factures électroniques.
                  </span>
                </div>
              ) : directory.available ? (
                <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
                  <Info className="size-4 shrink-0 text-amber-600" />
                  <span>
                    Pas encore inscrite à une plateforme agréée. Avec Newbi,
                    l'inscription se fait à la création du compte, 30 jours
                    offerts.
                  </span>
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-[#E4E2FF]/60 px-4 py-3 text-[15px] text-gray-900">
                  <Check className="size-4 shrink-0 text-[#5A50FF]" />
                  Compatible Newbi : tu peux émettre et recevoir dès
                  aujourd'hui, mention TVA comprise.
                </div>
              )}

              <dl className="mt-4 divide-y divide-gray-200">
                {[
                  ["Réception des factures électroniques", d.reception],
                  ["Émission des factures électroniques", d.emission],
                ].map(([label, item]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-3.5"
                  >
                    <dt className="text-[15px] text-gray-800">{label}</dt>
                    <dd className="flex items-center gap-2">
                      <span className="rounded-md bg-[#E4E2FF] px-2.5 py-1 text-[13px] font-medium text-[#5A50FF] whitespace-nowrap">
                        Concerné dès {item.when}
                      </span>
                      <span title={item.note} className="text-gray-400">
                        <Info className="size-4" />
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
