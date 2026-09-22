// Bento des fonctionnalités clés pour un auto-entrepreneur (copie de
// /lp/facturation-electronique/section/FeatureBento) : 5 cartes (CA du mois
// pour l'URSSAF, création avec mention TVA non applicable, dépenses, suivi,
// conformité 2026 en franchise de TVA).
// Statique et sobre : fond dégradé gris, un visuel simple par carte.

const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 flex flex-col overflow-hidden";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";

// Devis accepté → facture : deux mini-documents reliés par une flèche
function QuoteToInvoiceVisual() {
  const Doc = ({ label, num, tone, chip }) => (
    <div className="w-[128px] rounded-xl bg-white border border-gray-200/80 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)] p-3">
      <p className="text-[11px] font-medium text-gray-900">{label}</p>
      <p className="text-[10px] text-gray-400">{num}</p>
      <div className="mt-2.5 space-y-1">
        <div className="h-1 w-4/5 rounded bg-gray-100" />
        <div className="h-1 w-3/5 rounded bg-gray-100" />
      </div>
      <span
        className={`mt-3 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${tone}`}
      >
        {chip}
      </span>
    </div>
  );
  return (
    <div className="flex items-center justify-center gap-3">
      <Doc
        label="Devis"
        num="D-2026-008"
        tone="bg-green-100 text-green-700"
        chip="Accepté en ligne"
      />
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1D1D1B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
      <Doc
        label="Facture"
        num="F-2026-014"
        tone="bg-[#5A50FF]/10 text-[#5A50FF]"
        chip="Créée en 1 clic"
      />
    </div>
  );
}

// Récap du mois : factures encaissées et total à déclarer à l'URSSAF
const PAID = [
  ["Atelier Horizon", "F-2026-012", "850,00 €"],
  ["Studio Marbre", "F-2026-013", "1 200,00 €"],
  ["Léa Fontaine", "F-2026-014", "430,00 €"],
];

function RevenueVisual() {
  return (
    <div className="w-full max-w-[300px] rounded-2xl bg-white border border-gray-200/80 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-[13px] font-medium text-gray-900">
          Septembre 2026
        </span>
        <span className="rounded-md bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
          3 payées
        </span>
      </div>
      <ul className="px-4 py-2 divide-y divide-gray-100">
        {PAID.map(([client, ref, amount]) => (
          <li
            key={ref}
            className="flex items-center justify-between py-2 text-[12px]"
          >
            <span className="min-w-0">
              <span className="block truncate text-gray-900">{client}</span>
              <span className="block text-[11px] text-gray-400">{ref}</span>
            </span>
            <span className="font-medium text-gray-900">{amount}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between bg-[#1D1D1B] px-4 py-3 text-white">
        <span className="text-[11px] text-white/70">
          CA encaissé à déclarer
        </span>
        <span className="text-[14px] font-medium">2 480,00 €</span>
      </div>
    </div>
  );
}

// Mini formulaire « Nouvelle facture » (avec la ligne TVA en franchise) +
// badge officiel
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
          <div>
            <p className="text-[11px] text-gray-500 mb-1">TVA</p>
            <div className="flex items-center justify-between h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-[12px] text-gray-900">
              Non applicable, art. L. 223-3 du CIBS
              <span className="flex size-4 items-center justify-center rounded-full bg-[#22C55E] text-white">
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
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
  title = "Tout ce qu'il te faut pour facturer en micro-entreprise",
}) {
  return (
    <section className="px-5 py-14 md:py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-10 md:mb-14">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          {/* Ligne 1 — récap du CA (large) + création de facture */}
          <article
            className={`${CARD} md:col-span-7 md:flex-row md:items-start md:gap-8 min-h-[320px] md:min-h-[400px]`}
          >
            {/* Texte aligné en haut de la carte, visuel centré verticalement */}
            <div className="md:flex-1">
              <h3 className={TITLE}>Ton CA du mois, prêt pour l'URSSAF</h3>
              <p className={TEXT}>
                Chaque facture a un statut : émise, envoyée, payée. Tu retrouves
                en un coup d'œil ce que tu as encaissé sur le mois ou le
                trimestre, et tu déclares le bon montant. Ton comptable, si tu
                en as un, y accède gratuitement.
              </p>
            </div>
            <div className="mt-8 md:mt-0 flex justify-center md:flex-1 md:self-center">
              <RevenueVisual />
            </div>
          </article>

          <article className={`${CARD} md:col-span-5`}>
            <h3 className={TITLE}>Devis, factures et avoirs en 2 minutes</h3>
            <p className={TEXT}>
              Tes clients et ton catalogue sont déjà là. Tu choisis l'échéance,
              la mention « TVA non applicable » est ajoutée automatiquement, et
              Newbi transmet la facture au format électronique.
            </p>
            <div className="mt-8 flex-1 flex items-end justify-center">
              <InvoiceVisual />
            </div>
          </article>

          {/* Ligne 2 — trois cartes égales */}
          <article className={`${CARD} md:col-span-4`}>
            <h3 className={TITLE}>Devis accepté, facture en un clic</h3>
            <p className={TEXT}>
              Tu envoies ton devis, ton client l'accepte en ligne, et tu le
              transformes en facture sans rien ressaisir. Idéal quand tu
              enchaînes les missions.
            </p>
            <div className="mt-8 flex-1 flex items-center justify-center">
              <QuoteToInvoiceVisual />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 pb-0 md:pb-0`}>
            <h3 className={TITLE}>
              Facture entre deux clients, depuis ton téléphone
            </h3>
            <p className={TEXT}>
              Chez le client, en déplacement, à l'atelier : tu crées, envoies et
              relances tes factures depuis l'app mobile. Ton client paie, le
              statut passe en « Payée », ton CA du mois est à jour.
            </p>
            {/* Hauteur fixe collée au bas de la carte : le téléphone dépasse
                et se fait rogner par le bord de la carte */}
            <div className="mt-6 h-[200px] md:h-[230px] shrink-0 overflow-hidden flex items-start justify-center">
              <img
                src="/mockup-iphone-factures-clients.png"
                alt="Application mobile Newbi : factures d'un auto-entrepreneur avec leurs statuts"
                className="w-[210px] max-w-full h-auto shrink-0"
              />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4`}>
            <h3 className={TITLE}>Conforme 2026, même en franchise de TVA</h3>
            <p className={TEXT}>
              Réception dès 2026, émission en 2027 : Newbi transmet tes factures
              via une plateforme agréée, mention « TVA non applicable »
              comprise, et les archive 10 ans. Inclus, sans frais par facture.
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
