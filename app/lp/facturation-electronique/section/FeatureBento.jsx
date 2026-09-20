// Bento des fonctionnalités clés autour de la facturation électronique :
// 5 cartes (suivi des factures, création, dépenses, comptable, conformité).
// Statique et sobre : fond dégradé gris, un visuel simple par carte.

const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 flex flex-col overflow-hidden";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";

// Lignes qui convergent vers une facture validée (pré-comptabilité)
function ConvergeVisual() {
  const lines = [-56, -28, 0, 28, 56];
  return (
    <svg
      viewBox="0 0 320 160"
      className="w-full h-auto"
      fill="none"
      stroke="#9CA3AF"
      strokeWidth="1"
    >
      {lines.map((dy) => (
        <path
          key={`l${dy}`}
          d={`M0 ${80 + dy} C 70 ${80 + dy}, 90 80, 132 80`}
        />
      ))}
      {lines.map((dy) => (
        <path
          key={`r${dy}`}
          d={`M320 ${80 + dy} C 250 ${80 + dy}, 230 80, 188 80`}
        />
      ))}
      {/* Facture */}
      <g transform="translate(140 52)">
        <rect
          x="0"
          y="0"
          width="40"
          height="52"
          rx="5"
          fill="#fff"
          stroke="#D1D5DB"
        />
        <path d="M28 0v10a3 3 0 0 0 3 3h9" stroke="#D1D5DB" />
        <path d="M10 22h20M10 31h20M10 40h13" stroke="#D1D5DB" />
      </g>
      {/* Check */}
      <g transform="translate(176 44)">
        <circle cx="10" cy="10" r="10" fill="#1D1D1B" stroke="none" />
        <path
          d="M5.5 10.5l3 3 6-6"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

// Mini formulaire « Nouvelle facture » + badge officiel
function InvoiceVisual() {
  return (
    <div className="relative w-full max-w-[290px]">
      <div className="rounded-2xl bg-white border border-gray-200/80 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gray-100 text-gray-800">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
            </svg>
          </span>
          <span className="text-[13px] font-medium text-gray-900">
            Nouvelle facture
          </span>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div>
            <p className="text-[11px] text-gray-500 mb-1">Client</p>
            <div className="flex items-center justify-between h-8 rounded-lg border border-gray-200 px-2.5 text-[12px] text-gray-900">
              Atelier Horizon SAS
              <span className="text-gray-400">+</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 mb-1">Échéance</p>
            <div className="flex gap-1.5">
              <span className="rounded-md bg-gray-100 px-2 py-1.5 text-[11px] text-gray-700">
                À l'émission
              </span>
              <span className="rounded-md bg-[#5A50FF] px-2 py-1.5 text-[11px] text-white">
                Dans 30 jours
              </span>
              <span className="rounded-md bg-gray-100 px-2 py-1.5 text-[11px] text-gray-700">
                60 j
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center h-8 rounded-lg bg-[#1D1D1B] text-[12px] font-medium text-white">
            Créer la facture
          </div>
        </div>
      </div>
      <div className="absolute -top-4 -right-3 rounded-xl bg-white border border-gray-200/80 shadow-md px-2.5 py-1.5">
        <img
          src="/logo_Compatible_Facturation_electronique-footer.png"
          alt="Solution compatible facturation électronique"
          className="h-10 w-auto object-contain"
        />
      </div>
    </div>
  );
}

export default function FeatureBento({
  title = "Tout ce qu'il te faut pour facturer, au même endroit",
}) {
  return (
    <section className="px-5 py-14 md:py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-10 md:mb-14">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          {/* Ligne 1 — photo large + création de facture */}
          <article className="relative rounded-3xl overflow-hidden min-h-[320px] md:min-h-[400px] md:col-span-7 flex flex-col p-7 md:p-8 text-white">
            <img
              src="/lp/about/about-4.jpeg"
              alt="Accès comptable Newbi"
              className="absolute inset-0 size-full object-cover object-[center_30%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/10" />
            <div className="relative max-w-md">
              <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3">
                Ton comptable a déjà tout
              </h3>
              <p className="text-[15px] leading-relaxed text-white/85">
                Son accès est inclus dans chaque formule : il retrouve factures,
                dépenses et justificatifs, et exporte en CSV, Excel ou FEC. Toi,
                tu n'envoies plus rien.
              </p>
            </div>
          </article>

          <article className={`${CARD} md:col-span-5`}>
            <h3 className={TITLE}>Devis, factures et avoirs en 2 minutes</h3>
            <p className={TEXT}>
              Tes clients et ton catalogue sont déjà là. Tu choisis l'échéance,
              Newbi génère le format électronique et l'envoie à la plateforme de
              ton client.
            </p>
            <div className="mt-8 flex-1 flex items-end justify-center">
              <InvoiceVisual />
            </div>
          </article>

          {/* Ligne 2 — trois cartes égales */}
          <article className={`${CARD} md:col-span-4`}>
            <h3 className={TITLE}>Tes dépenses se rangent toutes seules</h3>
            <p className={TEXT}>
              Factures fournisseurs reçues, tickets scannés, transactions
              bancaires synchronisées : tout est rapproché et catégorisé, TVA
              comprise.
            </p>
            {/* Marges négatives : les lignes partent des bords de la carte */}
            <div className="mt-8 -mx-7 md:-mx-8 flex-1 flex items-center justify-center">
              <ConvergeVisual />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 pb-0 md:pb-0`}>
            <h3 className={TITLE}>Un œil sur chaque facture, où que tu sois</h3>
            <p className={TEXT}>
              Émise, transmise, acceptée, payée : le statut de chaque facture
              avance sous tes yeux, sur mobile comme sur ordinateur. Une facture
              en retard ? Tu relances en un clic.
            </p>
            {/* Hauteur fixe collée au bas de la carte : le téléphone dépasse
                et se fait rogner par le bord de la carte */}
            <div className="mt-6 h-[200px] md:h-[230px] shrink-0 overflow-hidden flex items-start justify-center">
              <img
                src="/mockup-iphone-factures-clients.png"
                alt="Application mobile Newbi : suivi des factures clients"
                className="w-[210px] max-w-full h-auto shrink-0"
              />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4`}>
            <h3 className={TITLE}>Facturation électronique incluse</h3>
            <p className={TEXT}>
              Factur-X, UBL, CII, transmission et archivage 10 ans : dans toutes
              les formules, sans frais par facture.
            </p>
            <div className="mt-8 flex-1 flex items-end justify-center">
              <div className="rounded-2xl bg-white border border-gray-200/80 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)] px-6 py-4">
                <img
                  src="/logo_Compatible_Facturation_electronique-footer.png"
                  alt="Solution compatible facturation électronique"
                  className="h-14 w-auto object-contain"
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
