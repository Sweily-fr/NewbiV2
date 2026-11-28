import {
  Type,
  AlignLeft,
  Image as ImageIcon,
  MousePointerClick,
  PenLine,
  Share2,
  Check,
  CalendarClock,
  Users,
} from "lucide-react";
import {
  AppWindow,
  SheetCard,
  Row,
  Chip,
  Stat,
  Bar,
} from "../../_components/LpMockups";

// Aperçu d'un e-mail de campagne (réutilisé par le hero et l'éditeur).
function EmailPreview({ compact = false }) {
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-xl border border-gray-200 bg-white p-4 text-left shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex size-6 items-center justify-center rounded-md bg-[#202020] text-[10px] font-bold text-white">
          A
        </span>
        <span className="text-[11px] font-semibold text-gray-900">
          Atelier Roux
        </span>
      </div>
      <p className="text-[15px] font-semibold leading-snug text-gray-950">
        Nos nouveautés de décembre
      </p>
      {!compact && (
        <div className="mt-3 h-24 rounded-lg bg-gradient-to-br from-[#5A50FF]/25 via-[#5A50FF]/10 to-orange-100" />
      )}
      <div className="mt-3 space-y-1.5">
        <div className="h-1.5 w-full rounded bg-gray-100" />
        <div className="h-1.5 w-11/12 rounded bg-gray-100" />
        <div className="h-1.5 w-3/4 rounded bg-gray-100" />
      </div>
      <span className="mt-4 inline-flex rounded-md bg-[#5A50FF] px-3 py-1.5 text-[11px] font-medium text-white">
        Découvrir la collection
      </span>
      <div className="mt-4 border-t border-gray-100 pt-3 flex items-center gap-2">
        <span className="size-5 rounded-full bg-orange-100" />
        <div>
          <p className="text-[10px] font-semibold text-gray-800">Léa Roux</p>
          <p className="text-[9px] text-gray-400">Gérante · Atelier Roux</p>
        </div>
      </div>
    </div>
  );
}

const BLOCS = [
  [Type, "Titre"],
  [AlignLeft, "Texte"],
  [ImageIcon, "Image"],
  [MousePointerClick, "Bouton"],
  [PenLine, "Signature"],
  [Share2, "Réseaux"],
];

export function HeroVisual() {
  return (
    <AppWindow title="Campagnes e-mail · Nos nouveautés de décembre">
      <div className="grid md:grid-cols-[180px_1fr_220px] min-h-[380px]">
        <aside className="hidden md:block border-r border-gray-100 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Blocs
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {BLOCS.map(([Icon, label]) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 rounded-lg border border-gray-100 py-2 text-[10px] text-gray-600"
              >
                <Icon size={14} strokeWidth={1.75} />
                {label}
              </div>
            ))}
          </div>
        </aside>
        <div className="bg-[#F7F7F9] p-5 md:p-8 flex items-center">
          <EmailPreview />
        </div>
        <aside className="hidden md:flex flex-col gap-3 border-l border-gray-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Envoi
          </p>
          <div className="rounded-lg border border-gray-100 p-2.5">
            <p className="text-[10px] text-gray-500">Destinataires</p>
            <p className="text-sm font-semibold text-gray-950">412 contacts</p>
            <p className="text-[10px] text-gray-400">Clients · Newsletter</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-2.5">
            <p className="text-[10px] text-gray-500">Expéditeur</p>
            <p className="text-[11px] font-medium text-gray-900 truncate">
              contact@atelier-roux.fr
            </p>
          </div>
          <div className="rounded-lg border border-green-100 bg-green-50 p-2.5 flex items-center gap-2">
            <Check size={14} className="text-green-600" />
            <span className="text-[11px] font-medium text-green-700">
              Prête à partir
            </span>
          </div>
          <span className="mt-auto inline-flex justify-center rounded-md bg-[#202020] px-3 py-2 text-[11px] font-medium text-white">
            Programmer l&apos;envoi
          </span>
        </aside>
      </div>
    </AppWindow>
  );
}

export function EditorVisual() {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 items-end">
      <SheetCard className="p-2">
        {BLOCS.map(([Icon, label], i) => (
          <div
            key={label}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] ${i === 3 ? "bg-[#5A50FF]/10 text-[#5A50FF] font-medium" : "text-gray-600"}`}
          >
            <Icon size={12} strokeWidth={1.75} />
            {label}
          </div>
        ))}
      </SheetCard>
      <SheetCard className="bg-[#F7F7F9] px-4 pt-4">
        <EmailPreview compact />
      </SheetCard>
    </div>
  );
}

export function AudienceVisual() {
  const lists = [
    ["Clients actifs", "268", true],
    ["Newsletter", "144", true],
    ["Prospects Poitiers", "57", false],
  ];
  return (
    <SheetCard>
      <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 text-xs font-medium text-gray-900">
        <Users size={13} /> Destinataires
      </div>
      {lists.map(([name, n, on]) => (
        <Row key={name}>
          <span className="flex items-center gap-2">
            <span
              className={`flex size-3.5 items-center justify-center rounded border ${on ? "border-[#5A50FF] bg-[#5A50FF] text-white" : "border-gray-300"}`}
            >
              {on && <Check size={10} strokeWidth={3} />}
            </span>
            {name}
          </span>
          <span className="text-gray-400">{n}</span>
        </Row>
      ))}
      <Row className="bg-gray-50">
        <span className="font-medium text-gray-900">412 destinataires</span>
        <Chip tone="green">Doublons retirés</Chip>
      </Row>
    </SheetCard>
  );
}

export function ScheduleVisual() {
  return (
    <SheetCard className="p-3 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-900">
        <CalendarClock size={14} className="text-[#5A50FF]" />
        Envoi programmé
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-gray-200 px-2 py-1.5 text-[11px] text-gray-800">
          mar. 9 déc.
        </div>
        <div className="rounded-md border border-gray-200 px-2 py-1.5 text-[11px] text-gray-800">
          10:00
        </div>
      </div>
      <Row className="px-0">
        <span>Suivre les ouvertures</span>
        <Chip>Désactivé</Chip>
      </Row>
      <Row className="px-0">
        <span>Lien de désinscription</span>
        <Chip tone="green">Inclus</Chip>
      </Row>
    </SheetCard>
  );
}

export function ReportVisual() {
  return (
    <SheetCard className="p-3 space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="E-mails traités" value="412" />
        <Stat label="Clics uniques" value="38" hint="contacts suivis" />
      </div>
      <div>
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Avancement de l&apos;envoi</span>
          <span>100 %</span>
        </div>
        <Bar pct={100} />
      </div>
      <Row className="px-0">
        <span>Désinscriptions</span>
        <span className="text-gray-900 font-medium">2</span>
      </Row>
    </SheetCard>
  );
}

export function DomainVisual() {
  const lignes = [
    ["TXT", "Validée"],
    ["MX", "Validée"],
    ["CNAME", "Validée"],
  ];
  return (
    <SheetCard>
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="text-[10px] text-gray-500">Adresse d&apos;envoi</p>
        <p className="text-xs font-medium text-gray-900">
          contact@atelier-roux.fr
        </p>
      </div>
      {lignes.map(([k, v]) => (
        <Row key={k}>
          <span>
            Ligne <span className="font-mono text-[11px]">{k}</span>
          </span>
          <Chip tone="green">{v}</Chip>
        </Row>
      ))}
      <Row className="bg-gray-50">
        <span className="font-medium text-gray-900">Domaine validé</span>
        <Check size={14} className="text-green-600" />
      </Row>
    </SheetCard>
  );
}
