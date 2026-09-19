// Mini-interfaces illustrant chaque bénéfice des LP (pas d'icône générique :
// on montre le produit). Chaque visuel tient dans ~140px de haut et reprend
// les codes du dashboard : chips de statut, lignes de liste, badges.

function Chip({ tone = "gray", children }) {
  const tones = {
    gray: "bg-gray-100 text-gray-600",
    violet: "bg-[#5A50FF]/10 text-[#5A50FF]",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Row({ children }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-gray-700 border-b border-gray-100 last:border-0">
      {children}
    </div>
  );
}

function Frame({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

// Liste de factures avec statuts (gestion + e-invoicing)
export function InvoiceListVisual({ einvoicing = false }) {
  const rows = einvoicing
    ? [
        ["SWEILY · 0014", "1 200,00 €", ["Transmise", "blue"]],
        ["Atelier Roux · 0013", "18 737,40 €", ["Acceptée", "violet"]],
        ["Studio Lune · 0012", "600,00 €", ["Payée", "green"]],
      ]
    : [
        ["SWEILY · 0014", "1 200,00 €", ["En attente", "orange"]],
        ["Atelier Roux · 0013", "18 737,40 €", ["Payée", "green"]],
        ["Studio Lune · 0012", "600,00 €", ["Payée", "green"]],
      ];
  return (
    <Frame>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-900">
          Factures clients
        </span>
        <span className="rounded-md bg-[#202020] text-white text-[10px] px-2 py-1">
          Nouvelle facture
        </span>
      </div>
      {rows.map(([c, m, [label, tone]]) => (
        <Row key={c}>
          <span className="font-medium text-gray-900 truncate">{c}</span>
          <span className="flex items-center gap-2">
            <span className="text-gray-500">{m}</span>
            <Chip tone={tone}>{label}</Chip>
          </span>
        </Row>
      ))}
    </Frame>
  );
}

// Relances automatiques : fil d'événements
export function ReminderVisual() {
  return (
    <Frame>
      <Row>
        <span>Facture 0011 · échéance dépassée</span>
        <Chip tone="orange">J+3</Chip>
      </Row>
      <Row>
        <span>Relance envoyée à Atelier Roux</span>
        <Chip tone="violet">auto</Chip>
      </Row>
      <Row>
        <span className="font-medium text-gray-900">
          Paiement reçu · 600,00 €
        </span>
        <Chip tone="green">payée</Chip>
      </Row>
    </Frame>
  );
}

// Reçu photographié → champs extraits
export function ReceiptScanVisual() {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 items-stretch">
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2 flex flex-col gap-1">
        <div className="h-1.5 w-10 bg-gray-300 rounded" />
        <div className="h-1.5 w-14 bg-gray-200 rounded" />
        <div className="h-1.5 w-8 bg-gray-200 rounded" />
        <div className="mt-auto h-2 w-12 bg-gray-800 rounded" />
      </div>
      <Frame>
        <Row>
          <span className="text-gray-500">Fournisseur</span>
          <span className="font-medium text-gray-900">Leroy Merlin</span>
        </Row>
        <Row>
          <span className="text-gray-500">TTC</span>
          <span className="font-medium text-gray-900">86,40 €</span>
        </Row>
        <Row>
          <span className="text-gray-500">TVA 20 %</span>
          <span className="flex items-center gap-2">
            <span className="font-medium text-gray-900">14,40 €</span>
            <Chip tone="violet">lu auto</Chip>
          </span>
        </Row>
      </Frame>
    </div>
  );
}

// Transaction bancaire rapprochée avec une facture
export function BankMatchVisual() {
  return (
    <Frame>
      <Row>
        <span className="flex items-center gap-2">
          <span className="size-5 rounded bg-emerald-500/15 text-emerald-600 text-[10px] font-bold flex items-center justify-center">
            €
          </span>
          Virement Clinique Vét. Brotteaux
        </span>
        <span className="font-medium text-emerald-600">+2 760,00 €</span>
      </Row>
      <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        rapprochée avec
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <Row>
        <span>Facture 0009 · Clinique Vét. Brotteaux</span>
        <Chip tone="green">match</Chip>
      </Row>
    </Frame>
  );
}

// Équipe + comptable
export function TeamVisual() {
  const people = [
    ["Toi", "Propriétaire", "bg-[#5A50FF]"],
    ["Julie", "Collaboratrice", "bg-orange-400"],
    ["Cabinet Martin", "Comptable · lecture", "bg-gray-700"],
  ];
  return (
    <Frame>
      {people.map(([n, r, c]) => (
        <Row key={n}>
          <span className="flex items-center gap-2">
            <span
              className={`size-5 rounded-full ${c} text-white text-[10px] font-bold flex items-center justify-center`}
            >
              {n[0]}
            </span>
            <span className="font-medium text-gray-900">{n}</span>
          </span>
          <span className="text-gray-500">{r}</span>
        </Row>
      ))}
    </Frame>
  );
}

// Formats e-invoicing
export function FormatVisual() {
  return (
    <div className="flex flex-col gap-2">
      <Frame>
        <Row>
          <span className="flex items-center gap-2">
            <span className="size-5 rounded bg-[#5A50FF]/10 text-[#5A50FF] text-[9px] font-bold flex items-center justify-center">
              XML
            </span>
            facture-0014.xml
          </span>
          <Chip tone="violet">Factur-X</Chip>
        </Row>
      </Frame>
      <div className="flex gap-2">
        {["Factur-X", "UBL", "CII"].map((f) => (
          <span
            key={f}
            className="flex-1 text-center rounded-lg border border-gray-200 bg-white py-1.5 text-[11px] font-medium text-gray-700"
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

// Cycle de vie d'une facture électronique
export function LifecycleVisual() {
  const steps = ["Déposée", "Transmise", "Reçue", "Acceptée", "Payée"];
  const done = 3;
  return (
    <Frame className="px-3 py-3">
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-center">
              <span
                className={`size-2.5 rounded-full shrink-0 ${
                  i <= done ? "bg-[#5A50FF]" : "bg-gray-200"
                }`}
              />
              {i < steps.length - 1 && (
                <span
                  className={`h-px flex-1 ${i < done ? "bg-[#5A50FF]" : "bg-gray-200"}`}
                />
              )}
            </div>
            <span
              className={`text-[10px] ${i <= done ? "text-gray-900 font-medium" : "text-gray-400"}`}
            >
              {s}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// Facture fournisseur reçue → classée en dépense
export function InboxVisual() {
  return (
    <Frame>
      <Row>
        <span className="flex items-center gap-2">
          <span className="size-5 rounded bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center">
            ↓
          </span>
          Facture reçue · OVHcloud
        </span>
        <span className="text-gray-500">29,99 €</span>
      </Row>
      <Row>
        <span>Classée en dépense · Logiciels</span>
        <Chip tone="green">auto</Chip>
      </Row>
    </Frame>
  );
}

// Archivage
export function ArchiveVisual() {
  return (
    <Frame>
      <Row>
        <span>2026 · 148 factures</span>
        <Chip tone="gray">archivées</Chip>
      </Row>
      <Row>
        <span>Conservation légale</span>
        <span className="font-medium text-gray-900">jusqu'en 2036</span>
      </Row>
    </Frame>
  );
}

// Support WhatsApp
export function WhatsappVisual() {
  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-[#5A50FF] text-white px-3 py-2">
        Ma facture est « Transmise » depuis hier, c'est normal ?
      </div>
      <div className="self-start max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 text-gray-800 px-3 py-2">
        Oui, elle est bien arrivée sur la plateforme de ton client. Le statut
        passera à « Acceptée » quand il la validera.
      </div>
    </div>
  );
}
