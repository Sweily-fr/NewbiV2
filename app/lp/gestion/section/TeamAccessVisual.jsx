// Carte « Ton comptable se sert, tu n'envoies plus rien » : visuel statique,
// minimal — une liste de membres avec leur rôle (façon Linear / Notion),
// ancrée en bas à gauche et sortant de la carte. Le comptable est en tête,
// avec un badge « Accès gratuit ».
const MEMBERS = [
  {
    initial: "C",
    name: "Cabinet M.",
    role: "Comptable",
    badge: "Gratuit",
    tone: "bg-neutral-900",
  },
  { initial: "T", name: "Toi", role: "Propriétaire", tone: "bg-[#5A50FF]" },
  {
    initial: "J",
    name: "Julie",
    role: "Collaboratrice",
    tone: "bg-neutral-400",
  },
];

export default function TeamAccessVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute left-4 md:left-6 bottom-0 w-[290px] max-w-[92%] rounded-t-2xl bg-white border border-b-0 border-neutral-200/80 shadow-[0_-2px_12px_-6px_rgba(0,0,0,0.08)]">
        <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
          <span className="text-[13px] font-medium text-neutral-900">
            Membres
          </span>
        </div>
        <ul className="px-5 py-1 text-[12px]">
          {MEMBERS.map((m) => (
            <li
              key={m.name}
              className="flex items-center gap-2.5 py-2.5 border-b border-neutral-100 last:border-b-0"
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ${m.tone}`}
              >
                {m.initial}
              </span>
              <span className="whitespace-nowrap text-neutral-900">
                {m.name}
              </span>
              {m.badge && (
                <span className="whitespace-nowrap rounded-md bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                  {m.badge}
                </span>
              )}
              <span className="ml-auto text-neutral-500">{m.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
