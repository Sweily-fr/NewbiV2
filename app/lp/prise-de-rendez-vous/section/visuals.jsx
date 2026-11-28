import {
  Clock,
  Video,
  CreditCard,
  CalendarDays,
  QrCode,
  Check,
  Ticket,
} from "lucide-react";
import {
  AppWindow,
  SheetCard,
  Row,
  Chip,
  Avatar,
} from "../../_components/LpMockups";

const JOURS = ["lun.", "mar.", "mer.", "jeu.", "ven."];
const CRENEAUX = ["9:00", "10:30", "14:00", "15:30", "17:00"];

// Page de réservation publique telle que la voit le client.
export function HeroVisual() {
  return (
    <AppWindow title="newbi.fr/rdv/lea-roux">
      <div className="grid md:grid-cols-[260px_1fr] min-h-[360px]">
        <aside className="border-b md:border-b-0 md:border-r border-gray-100 p-5">
          <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
            LR
          </span>
          <p className="mt-3 text-[11px] text-gray-500">Léa Roux</p>
          <p className="text-base font-semibold text-gray-950">
            Premier rendez-vous projet
          </p>
          <div className="mt-3 space-y-1.5 text-[12px] text-gray-600">
            <p className="flex items-center gap-2">
              <Clock size={13} /> 45 min
            </p>
            <p className="flex items-center gap-2">
              <Video size={13} /> Visio, lien Meet envoyé
            </p>
            <p className="flex items-center gap-2">
              <CreditCard size={13} /> 30 € d&apos;acompte en ligne
            </p>
          </div>
        </aside>
        <div className="p-5">
          <p className="text-xs font-semibold text-gray-900 mb-3">
            Choisis un créneau · décembre
          </p>
          <div className="grid grid-cols-5 gap-2">
            {JOURS.map((j, d) => (
              <div key={j} className="space-y-1.5">
                <p className="text-center text-[10px] text-gray-500">
                  {j} {8 + d}
                </p>
                {CRENEAUX.map((c, i) => {
                  const pris = (d + i) % 3 === 0;
                  const choisi = d === 1 && i === 1;
                  return (
                    <div
                      key={c}
                      className={`rounded-md py-1.5 text-center text-[11px] ${
                        choisi
                          ? "bg-[#5A50FF] text-white font-medium"
                          : pris
                            ? "bg-gray-50 text-gray-300 line-through"
                            : "border border-[#5A50FF]/25 text-[#5A50FF]"
                      }`}
                    >
                      {c}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <span className="mt-4 inline-flex w-full justify-center rounded-md bg-[#202020] px-3 py-2 text-[11px] font-medium text-white">
            Réserver mardi 9 décembre à 10:30
          </span>
        </div>
      </div>
    </AppWindow>
  );
}

export function TypesVisual() {
  const types = [
    ["Appel découverte", "20 min · gratuit", "green"],
    ["Premier rendez-vous projet", "45 min · 30 € d'acompte", "violet"],
    ["Atelier photo", "2 h · 120 €", "orange"],
  ];
  return (
    <SheetCard>
      <div className="px-3 py-2 border-b border-gray-100 text-xs font-medium text-gray-900">
        Types de rendez-vous
      </div>
      {types.map(([nom, info, tone]) => (
        <Row key={nom}>
          <span className="flex items-center gap-2 min-w-0">
            <span
              className={`h-6 w-1 rounded-full ${tone === "green" ? "bg-green-500" : tone === "orange" ? "bg-orange-400" : "bg-[#5A50FF]"}`}
            />
            <span className="min-w-0">
              <span className="block font-medium text-gray-900 truncate">
                {nom}
              </span>
              <span className="block text-[10px] text-gray-400">{info}</span>
            </span>
          </span>
          <Chip tone="green">Actif</Chip>
        </Row>
      ))}
    </SheetCard>
  );
}

export function AgendaVisual() {
  return (
    <SheetCard className="p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900">
        <CalendarDays size={13} className="text-[#5A50FF]" /> Agendas connectés
      </div>
      <Row className="px-0">
        <span>Google Agenda</span>
        <Chip tone="green">Synchronisé</Chip>
      </Row>
      <Row className="px-0">
        <span>Outlook</span>
        <Chip tone="green">Synchronisé</Chip>
      </Row>
      <div className="rounded-md bg-gray-50 px-2.5 py-2 text-[10px] text-gray-500">
        Tes événements bloquent les créneaux, chaque rendez-vous y est ajouté.
      </div>
    </SheetCard>
  );
}

export function PaymentVisual() {
  const modes = [
    ["En ligne à la réservation", true],
    ["Acompte en ligne, le reste sur place", false],
    ["Sur place, au rendez-vous", false],
  ];
  return (
    <SheetCard className="p-3 space-y-1.5">
      {modes.map(([m, on]) => (
        <div
          key={m}
          className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-[11px] ${on ? "border-[#5A50FF] bg-[#5A50FF]/[0.04] text-gray-900" : "border-gray-200 text-gray-600"}`}
        >
          <span
            className={`size-3 rounded-full border ${on ? "border-[4px] border-[#5A50FF]" : "border-gray-300"}`}
          />
          {m}
        </div>
      ))}
      <p className="pt-1 text-[10px] text-gray-500">
        Stripe, PayPal, SumUp ou virement · sans commission Newbi
      </p>
    </SheetCard>
  );
}

export function BookingsVisual() {
  const rdv = [
    ["CM", "Claire Martin", "mar. 10:30 · Visio", "Payé", "green", "blue"],
    [
      "TB",
      "Thomas Bernard",
      "mer. 14:00 · Atelier",
      "Acompte",
      "orange",
      "orange",
    ],
    ["SL", "Sophie Laurent", "jeu. 9:00 · Appel", "Gratuit", "gray", "green"],
  ];
  return (
    <SheetCard>
      <div className="px-3 py-2 border-b border-gray-100 text-xs font-medium text-gray-900">
        Rendez-vous à venir
      </div>
      {rdv.map(([ini, nom, quand, statut, tone, av]) => (
        <Row key={nom}>
          <span className="flex items-center gap-2 min-w-0">
            <Avatar initials={ini} tone={av} />
            <span className="min-w-0">
              <span className="block font-medium text-gray-900 truncate">
                {nom}
              </span>
              <span className="block text-[10px] text-gray-400">{quand}</span>
            </span>
          </span>
          <Chip tone={tone}>{statut}</Chip>
        </Row>
      ))}
    </SheetCard>
  );
}

export function TicketVisual() {
  return (
    <SheetCard className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#5A50FF]">
            <Ticket size={12} /> Billet
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-950">
            Soirée de lancement
          </p>
          <p className="text-[11px] text-gray-500">ven. 12 déc. · 19:00</p>
          <p className="mt-2 font-mono text-[11px] text-gray-700">EVT-7K3M9Q</p>
        </div>
        <span className="flex size-16 items-center justify-center rounded-lg border border-gray-200 text-gray-800">
          <QrCode size={40} strokeWidth={1.25} />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 px-2.5 py-2 text-[11px] font-medium text-green-700">
        <Check size={13} /> Billet valide · entrée enregistrée
      </div>
    </SheetCard>
  );
}
