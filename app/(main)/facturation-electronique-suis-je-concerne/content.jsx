"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import ConcernedChecker from "@/app/lp/facturation-electronique/section/ConcernedChecker";
import LpFinalCta from "@/app/lp/_components/LpFinalCta";
import { FAQ } from "./faq";

// Page satellite du guide : elle répond à une seule question — « suis-je
// concerné, et à quelle date ? » — et met le simulateur tout en haut, juste
// sous le H1. Le reste développe la réponse cas par cas.

// Pastilles de réassurance sous le sous-titre : toutes en violet Newbi
// pastel, avec le point en violet plein.
const BADGES = ["Gratuit", "100 % conforme", "Plateforme compatible"];

// Les trois échéances, pour la section à volets. `who` distingue tout de
// suite qui est visé, puisque c'est la question que se pose le lecteur.
// Trois raisons, dans l'ordre des objections : « est-ce que ce sera
// conforme ? », « est-ce que ça couvre tout ? », « combien ça coûte ? ».
// Ressources du cluster « facturation électronique ». Visuels Unsplash
// (licence libre) servis en local depuis
// public/lp/facturation-electronique/ressources/ — pas de dépendance à un
// domaine externe et pas de décalage de mise en page au chargement.
const RESOURCES = [
  {
    title: "Le guide complet, en 20 pages",
    desc: "Calendrier, formats, PPF et PDP, obligations par statut et checklist à cocher. À télécharger gratuitement.",
    href: "/guide-facturation-electronique",
    image: "/lp/facturation-electronique/ressources/guide.jpg",
  },
  {
    title: "Dates, obligations et sanctions",
    desc: "Ce que dit la réforme, qui bascule quand, et ce qui arrive si tu n'es pas prêt le jour de l'échéance.",
    href: "/blog/facturation-electronique-obligatoire-2026",
    image: "/lp/facturation-electronique/ressources/reforme.jpg",
  },
  {
    title: "Bien choisir sa plateforme",
    desc: "PDP, OD, PPF : à quoi servent ces trois sigles, et sur quels critères comparer les plateformes agréées.",
    href: "/blog/comment-choisir-sa-pdp-plateforme-dematerialisation",
    image: "/lp/facturation-electronique/ressources/plateforme.jpg",
  },
];

const REASONS = [
  {
    title: "Conforme sans rien paramétrer",
    desc: "Factur-X, mentions obligatoires, numérotation continue, statuts du cycle de vie : tout est intégré. Tu factures comme avant, la conformité suit.",
    Icon: ShieldIcon,
  },
  {
    title: "Émission et réception au même endroit",
    desc: "Tes factures clients partent, celles de tes fournisseurs arrivent, et tout se rapproche de ta banque et de tes devis sans changer d'outil.",
    Icon: ExchangeIcon,
  },
  {
    title: "Compris dans l'abonnement",
    desc: "Pas de module en supplément ni de facturation à l'unité. 30 jours pour tester, sans carte bancaire et sans engagement.",
    Icon: WalletIcon,
  },
];

const DEADLINES = [
  {
    date: "1er septembre 2026",
    who: "toutes les entreprises",
    title: "Recevoir des factures électroniques",
    text: "Aucune exception : à cette date, tu dois pouvoir recevoir les factures de tes fournisseurs via une plateforme agréée.",
  },
  {
    date: "1er septembre 2026",
    who: "grandes entreprises et ETI",
    title: "Émettre, pour les plus grosses structures",
    text: "Elles basculent en premier. Si tu travailles avec elles, leurs factures t'arriveront au format électronique dès cette date.",
  },
  {
    date: "1er septembre 2027",
    who: "PME, TPE et micro-entreprises",
    title: "Émettre, pour tous les autres",
    text: "L'échéance de la grande majorité des indépendants. À partir de là, plus une seule facture B2B ne part en PDF par e-mail.",
  },
];

export default function ConcernePage() {
  const [step, setStep] = React.useState(0);

  return (
    <>
      <NewHeroNavbar solidBackground />

      {/* Hero + simulateur : l'ensemble occupe toute la hauteur d'écran,
          centré verticalement sous la navbar fixe (68 px). */}
      <div className="flex min-h-svh flex-col justify-center pt-[68px] pb-8">
        <section className="px-5 pt-6 pb-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] font-medium tracking-tight leading-[1.08] text-balance text-gray-950 mb-5">
              Es-tu concerné par la facturation électronique&nbsp;?
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-gray-700">
              Vérifie en quelques secondes si ton entreprise est concernée par
              la réforme, et repars avec tes échéances personnalisées :
              réception, émission et inscription à une plateforme agréée.
            </p>

            {/* Même pastille que le H1 de la home — point coloré sur fond pastel —
              mais figée : ici elles servent de réassurance, pas d'animation. */}
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              {BADGES.map((label) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2.5 rounded-full bg-[#E4E2FF] px-5 py-2 text-[15px] text-gray-950"
                >
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full bg-[#5A50FF]"
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Le H2 porte les variantes « simulateur / vérifier / entreprise » que
          le H1 ne peut pas accueillir sans s'alourdir. */}
        <ConcernedChecker
          title={
            <span className="text-2xl md:text-3xl">
              Le simulateur : vérifie ton entreprise en 10 secondes
            </span>
          }
          subtitle={null}
          maxWidth="max-w-7xl"
          compact
        />
      </div>

      {/* Ce que Newbi fait pour toi : trois volets illustrés, puis un CTA */}
      <section className="px-5 py-14 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
              Le jour J, tu n&apos;auras rien à changer
            </h2>
            <p className="text-base md:text-lg text-gray-700">
              Newbi couvre déjà les trois moments où la réforme te touche : ce
              que tu reçois, ce que tu envoies, ce que tu encaisses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-x-5 gap-y-10">
            <article>
              <div className="relative h-[260px] rounded-2xl bg-[#EBE6FD] overflow-hidden">
                <PurchaseVisual />
              </div>
              <h3 className="mt-6 text-xl font-medium tracking-tight text-gray-950 mb-3">
                Fini la chasse aux factures fournisseurs
              </h3>
              <p className="text-[15px] leading-relaxed text-gray-600">
                Elles atterrissent seules au bon endroit, d&apos;où
                qu&apos;elles viennent. Plus de pièce jointe oubliée au fond
                d&apos;une boîte mail : tu vois ce qui est dû, et quand.
              </p>
            </article>

            <article>
              <div className="relative h-[260px] rounded-2xl bg-[#EBE6FD] overflow-hidden">
                <IssueVisual />
              </div>
              <h3 className="mt-6 text-xl font-medium tracking-tight text-gray-950 mb-3">
                Tes factures partent déjà au bon format
              </h3>
              <p className="text-[15px] leading-relaxed text-gray-600">
                Factur-X, mentions obligatoires, numérotation continue : Newbi
                s&apos;en occupe pendant que tu écris ta ligne de prestation.
                Toi, tu cliques sur Envoyer.
              </p>
            </article>

            <article>
              <div className="relative h-[260px] rounded-2xl bg-[#EBE6FD] overflow-hidden">
                <TrackingVisual />
              </div>
              <h3 className="mt-6 text-xl font-medium tracking-tight text-gray-950 mb-3">
                Tu sais qui t&apos;a payé sans chercher
              </h3>
              <p className="text-[15px] leading-relaxed text-gray-600">
                Chaque virement se colle à la bonne facture en arrivant. Il ne
                te reste que la liste de ceux qui traînent — et le bouton pour
                les relancer.
              </p>
            </article>
          </div>

          {/* Même gabarit que le CTA du hero de la home : Button primary,
              taille md, px-4 py-1.5, texte 17px. */}
          <div className="mt-12 md:mt-14 flex justify-center">
            <Button
              asChild
              size="md"
              variant="primary"
              className="h-auto w-auto px-4 py-1.5 text-[17px]"
            >
              <Link href="/auth/signup">
                <span>Essayer Newbi gratuitement</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Les trois échéances, en volets : la liste à gauche pilote la
          maquette de droite. */}
      <section className="px-5 py-14 md:py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-tight text-balance text-gray-950">
              Trois échéances.
              <br />
              Une seule à retenir pour toi.
            </h2>

            <div className="mt-10">
              {DEADLINES.map((d, i) => {
                const on = i === step;
                return (
                  <button
                    key={d.date + d.who}
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={on}
                    className={`block w-full border-l-2 pl-6 py-6 text-left transition-colors ${
                      on ? "border-gray-900" : "border-gray-200"
                    }`}
                  >
                    <p
                      className={`text-[13px] font-medium mb-1.5 transition-colors ${
                        on ? "text-[#5B46B8]" : "text-gray-400"
                      }`}
                    >
                      {d.date} · {d.who}
                    </p>
                    <p
                      className={`text-xl font-medium tracking-tight mb-2 transition-colors ${
                        on ? "text-gray-950" : "text-gray-400"
                      }`}
                    >
                      {d.title}
                    </p>
                    <p
                      className={`text-[15px] leading-relaxed transition-colors ${
                        on ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {d.text}
                    </p>
                  </button>
                );
              })}
            </div>

            <a
              href="#concerne"
              className="mt-10 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-3.5 text-[15px] text-gray-900 transition-colors hover:bg-gray-50"
            >
              Vérifier mon entreprise
            </a>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <div className="relative flex min-h-[620px] lg:min-h-[720px] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#EBE6FD] via-[#F4F2FF] to-[#DCEBFF] p-6 md:p-8">
              <Grain />
              <div className="relative flex w-full justify-center">
                <DeadlineVisual step={step} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Même forme que « À tes côtés, dès la première facture » sur la home :
          titre centré, trois colonnes à pictogramme, un seul bouton. */}
      <section className="relative overflow-hidden px-0 py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-5 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-12 md:mb-16">
            Pourquoi faire ta facturation électronique avec Newbi ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {REASONS.map(({ title, desc, Icon }) => (
              <div key={title} className="flex flex-col items-center">
                <span className="grid place-items-center size-16 rounded-2xl bg-[#F4F4F6] text-gray-900 mb-5">
                  <Icon />
                </span>
                <h3 className="text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3">
                  {title}
                </h3>
                <p className="text-[17px] leading-relaxed text-gray-600">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 md:mt-14">
            <Link
              href="/auth/signup"
              className="inline-block rounded-xl border border-gray-300 px-7 py-3.5 text-[15px] text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Essayer Newbi gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* Ressources : même forme que « Des outils pour piloter » sur la home —
          titre à gauche, trois cartes photo portrait avec voile sombre. */}
      <section className="relative overflow-hidden px-0 py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-5">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 max-w-3xl mb-10 md:mb-14">
            Nos ressources sur la facturation électronique
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {RESOURCES.map(({ title, desc, href, image }) => (
              <Link
                key={href}
                href={href}
                className="group relative rounded-3xl overflow-hidden aspect-[5/4] bg-gradient-to-br from-[#D8D8DE] to-[#9A9AA5]"
              >
                {image && (
                  <img
                    src={image}
                    alt=""
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
                {/* Voile sombre en haut, pour que le texte reste lisible quelle
                    que soit l'image */}
                <div className="absolute inset-x-0 top-0 h-3/4 bg-gradient-to-b from-black/85 via-black/55 to-transparent" />
                <div className="relative p-7 md:p-8 text-white">
                  <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3">
                    {title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-white/85 max-w-xs">
                    {desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ : même accordéon que la home, pour rester cohérent */}
      <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-16 pb-16">
        <div className="space-y-2 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
            Tout ce qu&apos;on nous demande sur la réforme. Si ta situation
            n&apos;est pas là, n&apos;hésite pas à{" "}
            <a href="/contact" className="underline underline-offset-4">
              nous contacter
            </a>
            .
          </p>
        </div>
        <Accordion
          type="single"
          collapsible
          className="bg-card w-full -space-y-px rounded-lg"
          defaultValue="faq-0"
        >
          {FAQ.map((item, i) => (
            <AccordionItem
              value={`faq-${i}`}
              key={item.q}
              className="relative border-x first:rounded-t-lg first:border-t last:rounded-b-lg last:border-b"
            >
              <AccordionTrigger className="px-4 py-4 text-[15px] leading-6 hover:no-underline font-normal">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 px-4 whitespace-pre-line">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="text-muted-foreground">
          Tu ne trouves pas ce que tu cherches ? Contacte notre{" "}
          <a
            href="/contact"
            className="text-primary underline underline-offset-4"
          >
            équipe support
          </a>
        </p>
      </div>

      {/* Bannière finale : même composant que « Ferme ton Excel, ouvre
          Newbi » sur la home. */}
      <LpFinalCta
        title={
          <>
            Être conforme,
            <br className="hidden md:block" /> sans y passer tes soirées
          </>
        }
        subtitle="Newbi émet et reçoit tes factures au format exigé et garde tes mentions à jour. 30 jours pour tester, sans carte bancaire."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Une indépendante gère ses factures électroniques dans Newbi sur son ordinateur portable"
        maxWidth="max-w-7xl"
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Visuels des trois volets : maquettes en HTML, ancrées et rognées    */
/* par leur panneau pastel.                                            */
/* ------------------------------------------------------------------ */

const SHEET =
  "absolute rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)]";

function PurchaseVisual() {
  return (
    <>
      <div className={`${SHEET} left-6 top-9 w-[74%] p-4`}>
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-[#EBE6FD] text-[11px] font-medium text-[#5B46B8]">
            AB
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-gray-950">
              Atelier Boréal
            </p>
            <p className="text-[10px] text-gray-500">14 rue de la Fonderie</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] font-medium text-gray-950">
          Facture F-202609-0087
        </p>
        <p className="text-[10.5px] text-gray-500">
          Aménagement de l&apos;espace d&apos;accueil
        </p>
        <div className="mt-3 border-t border-gray-100 pt-2.5 text-[10.5px]">
          <div className="flex justify-between py-1 text-gray-500">
            <span>Libellé</span>
            <span>Total HT</span>
          </div>
          <div className="flex justify-between py-1 text-gray-900">
            <span>Conception et plans</span>
            <span>1 200,00 €</span>
          </div>
          <div className="flex justify-between py-1 text-gray-900">
            <span>Mobilier sur mesure</span>
            <span>2 250,00 €</span>
          </div>
        </div>
      </div>

      {/* Le badge officiel, posé par-dessus comme sur la référence */}
      <img
        src="/logo-facturation-electronique.png"
        alt="Solution compatible facturation électronique"
        className="absolute right-4 top-5 h-[52px] w-auto rounded-md bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      />
    </>
  );
}

function IssueVisual() {
  return (
    <>
      <div className={`${SHEET} left-5 top-8 w-[70%] p-4`}>
        <p className="text-[12px] font-medium text-gray-950">
          Nouvelle facture
        </p>
        <p className="mt-3 text-[10px] text-gray-500">Client</p>
        <div className="mt-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-900">
          Camille Moreau
        </div>
        <p className="mt-3 text-[10px] text-gray-500">Prestation</p>
        <div className="mt-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-900">
          Consulting · septembre
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="text-gray-500">Total TTC</span>
          <span className="font-medium text-gray-950">3 000,00 €</span>
        </div>
        <span className="mt-3 block rounded-lg bg-gray-900 py-2 text-center text-[11px] text-white">
          Envoyer la facture
        </span>
      </div>

      {/* Sélecteur de format, en surimpression à droite */}
      <div className={`${SHEET} right-3 top-20 w-[58%] p-3`}>
        <p className="text-[10px] font-medium text-gray-950">
          Format d&apos;envoi
        </p>
        <div className="mt-2 space-y-1.5">
          {[
            ["Factur-X", true],
            ["UBL", false],
            ["CII", false],
          ].map(([label, on]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 text-[10.5px] text-gray-800"
            >
              {label}
              <span
                className={`size-3.5 rounded-full ${on ? "bg-[#5A50FF]" : "border border-gray-300"}`}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TrackingVisual() {
  return (
    <>
      <div className={`${SHEET} left-5 top-10 w-[76%] p-4`}>
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-medium text-gray-950">
            Factures payées
          </p>
          <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-600">
            2
          </span>
        </div>
        <div className="mt-3 text-[10.5px]">
          <div className="flex justify-between border-b border-gray-100 py-1.5 text-gray-500">
            <span>Titre</span>
            <span>Total TTC</span>
          </div>
          {[
            ["Refonte du site", "2 500,00 €"],
            ["Audit SEO", "3 650,00 €"],
          ].map(([t, v]) => (
            <div key={t} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-gray-900">
                {t}
                <span className="rounded bg-[#DDF3E4] px-1.5 py-0.5 text-[9px] font-medium text-[#1c7a4e]">
                  Payé
                </span>
              </span>
              <span className="text-gray-900">{v}</span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1.5 text-gray-600">
            En attente de paiement
            <span className="rounded bg-[#FDE9E7] px-1.5 py-0.5 text-[9px] font-medium text-[#b0322a]">
              33 j de retard
            </span>
          </div>
        </div>
      </div>

      {/* Virement rapproché, en surimpression */}
      <div className={`${SHEET} right-3 top-5 w-[56%] p-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-full bg-[#DDF3E4] text-[11px] text-[#1c7a4e]">
              ↓
            </span>
            <div>
              <p className="text-[11px] font-medium text-gray-950">
                Virement reçu
              </p>
              <p className="text-[9.5px] text-gray-500">15 septembre</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-medium text-gray-950">2 500 €</p>
            <p className="text-[9.5px] text-[#1c7a4e]">Rapproché</p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Maquettes de droite : une par échéance, chacune avec sa propre       */
/* animation. Elles rejouent au changement d'onglet, puisque React      */
/* remonte le composant.                                               */
/* ------------------------------------------------------------------ */

function DeadlineVisual({ step }) {
  if (step === 0) return <ReceiveVisual />;
  if (step === 1) return <PipelineVisual />;
  return <DraftVisual />;
}

const CARD =
  "w-full max-w-[400px] overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-[0_24px_60px_-12px_rgba(16,16,24,0.18)]";
const HEAD =
  "flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5";

// Chrome minimal en haut de chaque maquette, dans l'esprit des captures
// produit de Linear ou Notion : un titre, une action discrète, rien d'autre.
function Head({ title, right }) {
  return (
    <div className={HEAD}>
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-gray-300" />
        <p className="text-[13px] font-medium text-gray-950">{title}</p>
      </div>
      {right}
    </div>
  );
}

function VisualStyles() {
  return (
    <style>{`
      @keyframes vRowIn   { from { opacity: 0; transform: translateY(-12px) } to { opacity: 1; transform: none } }
      @keyframes vPush    { from { transform: translateY(-46px) } to { transform: none } }
      @keyframes vPop     { 0% { opacity: 0; transform: scale(.5) } 60% { transform: scale(1.18) } 100% { opacity: 1; transform: scale(1) } }
      @keyframes vFadeUp  { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
      @keyframes vStep    { to { background-color: #EBE6FD; color: #5B46B8 } }
      @keyframes vDot     { to { background-color: #5A50FF } }
      @keyframes vBar     { from { transform: scaleX(0) } to { transform: scaleX(1) } }
      @keyframes vType    { from { width: 0 } to { width: var(--w, 100%) } }
      @keyframes vOut     { 0%, 42% { opacity: 1 } 52%, 100% { opacity: 0 } }
      @keyframes vIn      { 0%, 42% { opacity: 0 } 52%, 100% { opacity: 1 } }
      @keyframes vPulse   { 0%, 100% { opacity: .35 } 50% { opacity: 1 } }
      @media (prefers-reduced-motion: reduce) {
        [data-anim] { animation: none !important }
      }
    `}</style>
  );
}

/* 1 — Réception : une facture fournisseur tombe dans la boîte, le compteur
   s'incrémente et les lignes déjà présentes glissent vers le bas. */
function ReceiveVisual() {
  return (
    <div className={CARD}>
      <VisualStyles />
      <Head
        title="Factures reçues"
        right={
          <span
            data-anim
            className="rounded-full bg-[#EBE6FD] px-2 py-0.5 text-[11px] font-medium text-[#5B46B8]"
            style={{ animation: "vPop .5s .45s both" }}
          >
            +1
          </span>
        }
      />
      <div className="p-3">
        <div
          data-anim
          className="flex items-center gap-3 rounded-xl bg-[#F4F2FF] px-3 py-3"
          style={{ animation: "vRowIn .55s .35s both" }}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[11px] font-medium text-[#5B46B8] ring-1 ring-black/[0.05]">
            AB
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-gray-950">Atelier Boréal</p>
            <p className="text-[11px] text-gray-500">
              Reçue à l&apos;instant · Factur-X
            </p>
          </div>
          <p className="text-[13px] tabular-nums text-gray-950">3 450,00 €</p>
        </div>

        <div data-anim style={{ animation: "vPush .55s .35s both" }}>
          {[
            ["OV", "OVHcloud", "Hier", "21,12 €"],
            ["OR", "Orange", "Lundi", "39,99 €"],
            ["FG", "Figma", "Lundi", "13,50 €"],
          ].map(([ini, name, when, amount]) => (
            <div key={name} className="flex items-center gap-3 px-3 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gray-50 text-[11px] font-medium text-gray-500 ring-1 ring-black/[0.04]">
                {ini}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-gray-800">{name}</p>
                <p className="text-[11px] text-gray-400">{when}</p>
              </div>
              <p className="text-[13px] tabular-nums text-gray-500">{amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 2 — Émission côté grande entreprise : le cycle de vie de la facture
   s'allume étape par étape, la barre de progression suit. */
function PipelineVisual() {
  const STEPS = ["Émise", "Transmise", "Reçue"];
  return (
    <div className={CARD}>
      <VisualStyles />
      <Head
        title="F-2026-0142"
        right={
          <span className="text-[12px] tabular-nums text-gray-500">
            7 200,00 €
          </span>
        }
      />
      <div className="px-5 py-5">
        <p className="text-[12px] text-gray-500">Novacom Agency · ETI</p>

        <div className="relative mt-6">
          <div className="absolute left-0 right-0 top-[9px] h-px bg-gray-200" />
          <div
            data-anim
            className="absolute left-0 right-0 top-[9px] h-px origin-left"
            /* même remarque : couleur posée en hex, pas via une classe */
            style={{
              backgroundColor: "#5A50FF",
              animation: "vBar 2.1s .3s both linear",
            }}
          />
          <div className="relative flex justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-2.5">
                {/* Couleurs de départ en hexadécimal, comme celles des
                    images-clés : Chrome interpole mal entre une couleur
                    oklch de Tailwind et un hex. */}
                <span
                  data-anim
                  className="size-[18px] rounded-full ring-4 ring-white"
                  style={{
                    backgroundColor: "#e4e4e7",
                    animation: `vDot .3s ${0.4 + i * 0.7}s both`,
                  }}
                />
                <span
                  data-anim
                  className="rounded-md px-2 py-1 text-[11px]"
                  style={{
                    backgroundColor: "#f4f4f5",
                    color: "#71717a",
                    animation: `vStep .3s ${0.4 + i * 0.7}s both`,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 space-y-2">
          {[
            ["Format", "Factur-X (UBL disponible)"],
            ["Transmission", "Plateforme agréée"],
            ["Accusé de réception", "Horodaté"],
          ].map(([k, v], i) => (
            <div
              key={k}
              data-anim
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-[12px]"
              style={{ animation: `vFadeUp .45s ${0.9 + i * 0.15}s both` }}
            >
              <span className="text-gray-500">{k}</span>
              <span className="text-gray-900">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 3 — Émission côté micro-entreprise : la facture s'écrit, la mention
   légale apparaît, puis le statut bascule de brouillon à envoyée. */
function DraftVisual() {
  return (
    <div className={CARD}>
      <VisualStyles />
      <Head
        title="Nouvelle facture"
        right={
          <span className="relative inline-flex h-[22px] w-[74px] items-center justify-center">
            <span
              data-anim
              className="absolute inset-0 grid place-items-center rounded-md bg-gray-100 text-[11px] font-medium text-gray-500"
              style={{ animation: "vOut 3s 1.2s both" }}
            >
              Brouillon
            </span>
            <span
              data-anim
              className="absolute inset-0 grid place-items-center rounded-md bg-[#DDF3E4] text-[11px] font-medium text-[#1c7a4e]"
              style={{ animation: "vIn 3s 1.2s both" }}
            >
              Envoyée
            </span>
          </span>
        }
      />
      <div className="px-5 py-5">
        {[
          ["Client", "Camille Moreau", "72%"],
          ["Prestation", "Création d'identité visuelle", "88%"],
        ].map(([k, v, w], i) => (
          <div key={k} className="mb-3">
            <p className="text-[11px] text-gray-400">{k}</p>
            <div className="relative mt-1 overflow-hidden">
              <p
                data-anim
                className="overflow-hidden whitespace-nowrap text-[13px] text-gray-950"
                style={{
                  "--w": w,
                  animation: `vType .7s ${0.25 + i * 0.5}s both steps(24)`,
                }}
              >
                {v}
              </p>
            </div>
          </div>
        ))}

        <div className="mt-5 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-gray-500">Total net de taxe</span>
            <span className="font-medium tabular-nums text-gray-950">
              1 200,00 €
            </span>
          </div>
          <p
            data-anim
            className="mt-2 text-[11px] text-gray-500"
            style={{ animation: "vFadeUp .5s 1.4s both" }}
          >
            TVA non applicable, art. 293 B du CGI
          </p>
        </div>

        <div
          data-anim
          className="mt-5 flex items-center gap-2 rounded-xl bg-[#EBE6FD] px-3.5 py-2.5 text-[12px] text-[#5B46B8]"
          style={{ animation: "vFadeUp .5s 2.4s both" }}
        >
          <span
            data-anim
            className="size-1.5 rounded-full bg-[#5A50FF]"
            style={{ animation: "vPulse 1.6s 2.9s infinite" }}
          />
          Transmise à la plateforme agréée
        </div>
      </div>
    </div>
  );
}

// Grain : bruit fractal SVG en data-URI, désaturé puis multiplié sur le
// dégradé. Pas d'image à charger, et `img-src data:` est déjà autorisé par la
// CSP du site.
const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E";

function Grain() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 mix-blend-multiply"
      style={{
        backgroundImage: `url("${NOISE}")`,
        backgroundSize: "180px 180px",
        opacity: 0.3,
      }}
    />
  );
}

/* Pictogrammes au trait de la section « Pourquoi choisir Newbi » */

const SVG = {
  width: 32,
  height: 32,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function ShieldIcon() {
  return (
    <svg {...SVG}>
      <path d="M12 2.8 20 6v6.2c0 4.3-3.2 7.7-8 9.1-4.8-1.4-8-4.8-8-9.1V6z" />
      <path d="m8.6 12.2 2.4 2.4 4.4-4.8" />
    </svg>
  );
}

function ExchangeIcon() {
  return (
    <svg {...SVG}>
      <path d="M3.5 8.5h14M14 5l3.5 3.5L14 12" />
      <path d="M20.5 15.5h-14M10 12l-3.5 3.5L10 19" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg {...SVG}>
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h11a2 2 0 0 1 2 2v1" />
      <path d="M3.5 7.5v9A2.5 2.5 0 0 0 6 19h12.5a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 18.5 9H6" />
      <circle cx="16.4" cy="14" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
