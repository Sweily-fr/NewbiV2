import { Search, MapPin, Check, Mail, Clock, Reply } from "lucide-react";
import {
  AppWindow,
  SheetCard,
  Row,
  Chip,
  Stat,
  Bar,
  Avatar,
} from "../../_components/LpMockups";

const ENTREPRISES = [
  ["MD", "Menuiserie Dubois", "Poitiers · 4 salariés", "orange"],
  ["AB", "Atelier Bois & Co", "Chasseneuil · 2 salariés", "green"],
  ["LM", "Les Menuisiers du Clain", "Buxerolles · 8 salariés", "blue"],
  ["CR", "CR Agencement", "Poitiers · 3 salariés", "violet"],
];

export function HeroVisual() {
  return (
    <AppWindow title="Clients · Générer des prospects">
      <div className="grid md:grid-cols-[260px_1fr] min-h-[360px]">
        <aside className="border-b md:border-b-0 md:border-r border-gray-100 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-900">
            Qui cherchez-vous ?
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2 text-[12px] text-gray-800">
            <Search size={13} className="text-gray-400" /> Menuisier
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2 text-[12px] text-gray-800">
            <MapPin size={13} className="text-gray-400" /> Vienne (86)
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="violet">Moins de 10 salariés</Chip>
            <Chip>E-mail connu</Chip>
          </div>
          <div className="rounded-lg bg-[#F7F7F9] px-3 py-2.5">
            <p className="text-[10px] text-gray-500">
              Entreprises correspondantes
            </p>
            <p className="text-lg font-semibold text-gray-950">128</p>
          </div>
          <span className="inline-flex w-full justify-center rounded-md bg-[#202020] px-3 py-2 text-[11px] font-medium text-white">
            Ajouter 25 prospects
          </span>
        </aside>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-900">
              Liste « Menuisiers Vienne »
            </p>
            <Chip tone="green">25 ajoutés</Chip>
          </div>
          <div className="rounded-xl border border-gray-100">
            {ENTREPRISES.map(([ini, nom, info, tone]) => (
              <Row key={nom}>
                <span className="flex items-center gap-2 min-w-0">
                  <Avatar initials={ini} tone={tone} />
                  <span className="min-w-0">
                    <span className="block font-medium text-gray-900 truncate">
                      {nom}
                    </span>
                    <span className="block text-[10px] text-gray-400">
                      {info}
                    </span>
                  </span>
                </span>
                <Chip tone="violet">Prospect</Chip>
              </Row>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-[#5A50FF]/20 bg-[#5A50FF]/[0.04] p-3">
            <p className="text-[11px] font-medium text-gray-900 flex items-center gap-1.5">
              <Mail size={12} className="text-[#5A50FF]" /> Écrire à ces
              prospects
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              Bonjour, je suis installée à Poitiers et je travaille avec
              plusieurs menuisiers du coin…
            </p>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}

export function SearchVisual() {
  return (
    <SheetCard className="p-3 space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1.5 text-[11px] text-gray-800">
          <Search size={12} className="text-gray-400" /> Plombier
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1.5 text-[11px] text-gray-800">
          <MapPin size={12} className="text-gray-400" /> Lyon · 20 km
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip>Moins de 10 salariés</Chip>
        <Chip>Plus de 10 ans</Chip>
        <Chip tone="violet">Téléphone</Chip>
      </div>
      <Row className="px-0">
        <span>Entreprises correspondantes</span>
        <span className="font-semibold text-gray-900">342</span>
      </Row>
      <Row className="px-0">
        <span>Crédits du mois</span>
        <span className="text-gray-500">30 / 30</span>
      </Row>
    </SheetCard>
  );
}

export function MailboxVisual() {
  return (
    <SheetCard>
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-500">Boîte d&apos;envoi</p>
          <p className="text-xs font-medium text-gray-900">
            lea@atelier-roux.fr
          </p>
        </div>
        <Chip tone="green">Boîte connectée</Chip>
      </div>
      <div className="px-3 py-2.5 text-[11px] text-gray-700 space-y-1.5">
        <p className="font-medium text-gray-900">
          Une question sur vos chantiers
        </p>
        <p>
          Bonjour Monsieur Dubois, j&apos;ai vu que la Menuiserie Dubois
          travaille sur Poitiers…
        </p>
      </div>
    </SheetCard>
  );
}

export function RhythmVisual() {
  const jours = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <SheetCard className="p-3 space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900">
        <Clock size={13} className="text-[#5A50FF]" /> Un rythme humain
      </div>
      <div className="flex gap-1">
        {jours.map((j, i) => (
          <span
            key={i}
            className={`flex size-6 items-center justify-center rounded-md text-[10px] font-semibold ${i < 5 ? "bg-[#5A50FF] text-white" : "bg-gray-100 text-gray-400"}`}
          >
            {j}
          </span>
        ))}
      </div>
      <Row className="px-0">
        <span>Heures d&apos;envoi</span>
        <span className="text-gray-900">9h – 17h</span>
      </Row>
      <Row className="px-0">
        <span>E-mails par jour</span>
        <span className="text-gray-900">30</span>
      </Row>
    </SheetCard>
  );
}

export function FollowVisual() {
  return (
    <SheetCard className="p-3 space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Messages partis" value="48" />
        <Stat label="Réponses" value="6" />
      </div>
      <div>
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Avancement des envois</span>
          <span>48 / 57</span>
        </div>
        <Bar pct={84} />
      </div>
      <Row className="px-0">
        <span className="flex items-center gap-1.5">
          <Reply size={12} /> Menuiserie Dubois
        </span>
        <Chip tone="green">A répondu</Chip>
      </Row>
    </SheetCard>
  );
}

export function RespectVisual() {
  const points = [
    "Professionnels seulement",
    "Désinscription en un clic",
    "Aucun suivi d'ouverture",
  ];
  return (
    <SheetCard className="p-3 space-y-2">
      {points.map((p) => (
        <div
          key={p}
          className="flex items-center gap-2 text-[12px] text-gray-800"
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Check size={10} strokeWidth={3} />
          </span>
          {p}
        </div>
      ))}
      <div className="rounded-md bg-gray-50 px-2.5 py-2 text-[10px] text-gray-500">
        Trop de désinscriptions ? Les envois se suspendent d&apos;eux-mêmes pour
        protéger ton adresse.
      </div>
    </SheetCard>
  );
}
