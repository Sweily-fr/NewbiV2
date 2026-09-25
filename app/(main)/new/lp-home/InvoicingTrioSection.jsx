import React from "react";
import Link from "next/link";

// Trois cartes côte à côte, dans la continuité du bento du dessus : titre à
// gauche, bouton « Découvrir » à droite, et un visuel par carte qui déborde du
// bas. Chaque carte est cliquable et mène à la page produit correspondante.
const CARD =
  "group relative rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 pb-0 flex flex-col overflow-hidden min-h-[560px]";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 leading-snug";
const TEXT = "text-[15px] leading-relaxed text-gray-700 mt-4";

export default function InvoicingTrioSection() {
  return (
    <section className="relative overflow-hidden px-0 py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 md:mb-14">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950">
            Tes factures, conformes et gérées sans effort
          </h2>
          <Link
            href="/produits/factures"
            className="flex-none self-start md:self-auto rounded-xl border border-gray-300 px-7 py-3.5 text-[15px] text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Découvrir
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <Card
            href="/produits/facturation-electronique"
            title={
              <>
                Anticipe la facturation
                <br className="hidden lg:block" /> électronique
              </>
            }
            text="Newbi est prêt pour la réforme de septembre 2026 : émets et reçois des factures au format exigé, sans changer ta façon de travailler."
          >
            <NewInvoiceVisual />
          </Card>

          <Card
            href="/produits/factures"
            title={
              <>
                Devis et factures
                <br className="hidden lg:block" /> en un clic
              </>
            }
            text="Le devis signé devient une facture, le lien de paiement part avec. Tu vois ce qui est ouvert, payé ou en retard."
          >
            <PhoneVisual />
          </Card>

          <Card
            href="/produits/gestion-des-achats"
            title={
              <>
                Tes factures fournisseurs,
                <br className="hidden lg:block" /> sans la paperasse
              </>
            }
            text="Photographie un reçu : Newbi lit le montant, la TVA et le fournisseur, puis le rapproche tout seul de la bonne transaction."
          >
            <InvoiceDocVisual />
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({ href, title, text, children }) {
  return (
    <Link href={href} className={CARD}>
      <div className="flex items-start justify-between gap-4">
        <h3 className={TITLE}>{title}</h3>
        <span className="flex-none grid place-items-center size-9 rounded-full bg-white text-gray-900 ring-1 ring-black/[0.06] opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </span>
      </div>
      <p className={TEXT}>{text}</p>
      <div className="relative flex-1 min-h-[300px] mt-8 -mx-7 md:-mx-8">
        {children}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Visuels — chacun est ancré en bas et sort du cadre de sa carte      */
/* ------------------------------------------------------------------ */

const SHEET =
  "absolute left-8 right-4 -bottom-8 rounded-2xl bg-white ring-1 ring-black/[0.07] shadow-sm overflow-hidden";
// La première carte a une maquette plus étroite et remontée
const SHEET_SM = SHEET.replace(
  "left-8 right-4 -bottom-8",
  "left-14 right-10 bottom-2",
);

function NewInvoiceVisual() {
  return (
    <div className={SHEET_SM}>
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center size-7 rounded-lg bg-gray-100 text-gray-700">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3h9l4 4v14H6z" />
              <path d="M9 10h7M9 14h7M9 18h4" />
            </svg>
          </span>
          <span className="text-[14px] font-medium text-gray-950">
            Nouvelle facture
          </span>
        </div>
        <img
          src="/logo-facturation-electronique.png"
          alt="Solution compatible facturation électronique"
          width={86}
          height={34}
          className="h-[34px] w-auto object-contain"
        />
      </div>

      <div className="px-4 pt-4">
        <p className="text-[12px] text-gray-500 mb-1.5">
          Coordonnées du client
        </p>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
          <span className="text-[13px] text-gray-950">Camille Moreau</span>
          <span className="grid place-items-center size-5 rounded-full bg-gray-900 text-white text-[13px] leading-none">
            +
          </span>
        </div>
      </div>

      <div className="px-4 pt-4">
        <p className="text-[12px] text-gray-500 mb-1.5">Date d&apos;échéance</p>
        <div className="flex gap-2 text-[12px]">
          <span className="rounded-lg bg-gray-100 text-gray-600 px-3 py-2">
            À l&apos;émission
          </span>
          <span className="rounded-lg bg-[#5A50FF] text-white px-3 py-2">
            Dans 30 jours
          </span>
          <span className="rounded-lg bg-gray-100 text-gray-600 px-3 py-2 whitespace-nowrap">
            Choisir
          </span>
        </div>
      </div>

      <div className="p-4">
        <span className="block rounded-lg bg-gray-900 text-white text-[13px] text-center py-2.5">
          Créer la facture
        </span>
      </div>
    </div>
  );
}

// Maquette mobile de création de facture : ancrée en haut, elle dépasse
// du bas de la carte.
function PhoneVisual() {
  return (
    <img
      src="/lp/home/trio/nouvelle-facture.png"
      alt="Création d'une facture depuis l'application mobile Newbi"
      className="absolute left-1/2 -translate-x-1/2 top-6 w-[98%] max-w-none"
    />
  );
}

// Reproduction de l'aperçu PDF d'une facture : mise en page identique
// (en-tête, bloc émetteur, tableau à en-tête noir, totaux, mentions légales,
// bandeau gris des coordonnées bancaires), avec des données d'exemple.
// Le document est composé à sa taille naturelle puis réduit, pour garder des
// proportions justes ; il sort du bas de la carte.
const L = "font-medium text-[#17171a]"; // libellés en gras

function InvoiceDocVisual() {
  return (
    <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[520px] origin-top scale-[0.5] rounded-sm bg-white shadow-[0_10px_40px_rgba(0,0,0,0.10)] overflow-hidden text-[#17171a]">
      <div className="px-10 pt-9 pb-8">
        {/* En-tête : logo à gauche, intitulé et références à droite */}
        <div className="flex items-start justify-between gap-6">
          <span className="text-[26px] font-semibold tracking-tight leading-none mt-1">
            Atelier&nbsp;Boréal
          </span>
          <div className="text-right">
            <h4 className="text-[30px] font-medium tracking-tight leading-none mb-3">
              Facture
            </h4>
            <p className="text-[11px] leading-5">
              <span className={L}>Numéro de facture&nbsp;:</span> F-202609-0087
            </p>
            <p className="text-[11px] leading-5">
              <span className={L}>Date d&apos;émission&nbsp;:</span> 18/09/2026
            </p>
            <p className="text-[11px] leading-5">
              <span className={L}>Date d&apos;échéance&nbsp;:</span> 18/10/2026
            </p>
          </div>
        </div>

        {/* Émetteur */}
        <div className="mt-12 text-[11px] leading-[18px]">
          <p className={`${L} mb-3`}>Atelier Boréal</p>
          <p>14 RUE DE LA FONDERIE</p>
          <p>69007 LYON</p>
          <p>France</p>
          <p>contact@atelier-boreal.fr</p>
          <p>SIREN : 842 517 963</p>
          <p>N° TVA : FR41 842 517 963</p>
        </div>

        <p className="mt-8 text-[11px]">
          Aménagement de l&apos;espace d&apos;accueil
        </p>

        {/* Tableau */}
        <table className="mt-4 w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-[#17171a] text-white text-left">
              <th className="font-normal py-2.5 pl-3">Description</th>
              <th className="font-normal py-2.5 text-right">Qté</th>
              <th className="font-normal py-2.5 text-right">Prix unitaire</th>
              <th className="font-normal py-2.5 text-right">TVA (%)</th>
              <th className="font-normal py-2.5 pr-3 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3 pl-3">Conception et plans</td>
              <td className="py-3 text-right">1</td>
              <td className="py-3 text-right">1 200,00 €</td>
              <td className="py-3 text-right">20 %</td>
              <td className="py-3 pr-3 text-right">1 200,00 €</td>
            </tr>
            <tr className="border-b border-[#d4d4d8]">
              <td className="py-3 pl-3">Mobilier sur mesure</td>
              <td className="py-3 text-right">1</td>
              <td className="py-3 text-right">2 250,00 €</td>
              <td className="py-3 text-right">20 %</td>
              <td className="py-3 pr-3 text-right">2 250,00 €</td>
            </tr>
          </tbody>
        </table>

        {/* Totaux */}
        <div className="mt-8 flex justify-end">
          <div className="w-[62%] text-[11px]">
            <div className="flex justify-between px-3 py-2.5">
              <span className={L}>Total HT</span>
              <span className={L}>3 450,00 €</span>
            </div>
            <div className="flex justify-between bg-[#e7e7ea] px-3 py-2.5">
              <span className={L}>Total TTC</span>
              <span className={L}>4 140,00 €</span>
            </div>
          </div>
        </div>

        {/* Mentions légales */}
        <div className="mt-10 text-[10.5px] leading-[17px] space-y-3">
          <p>Pas d&apos;escompte accordé pour paiement anticipé.</p>
          <p>
            En cas de non-paiement à la date d&apos;échéance, et conformément au
            code de commerce, des pénalités seront appliquées. Tout montant non
            réglé sera majoré d&apos;un intérêt annuel de trois fois le taux
            d&apos;intérêt légal.
            <br />
            Tout retard de paiement entraînera une indemnité forfaitaire pour
            frais de recouvrement de 40&nbsp;€.
          </p>
        </div>
      </div>

      {/* Bandeau gris des coordonnées bancaires */}
      <div className="bg-[#d4d4d8] px-10 py-8 text-[11px]">
        <p className={`${L} text-[14px] mb-4`}>Détails du paiement</p>
        {[
          ["Nom du bénéficiaire", "Atelier Boréal"],
          ["Nom de la banque", "QONTO"],
          ["BIC", "QNTOFRP1XXX"],
          ["IBAN", "FR76 3000 4000 0312 3456 7890 143"],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-6 leading-[22px]">
            <span className={`${L} w-[150px] shrink-0`}>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
