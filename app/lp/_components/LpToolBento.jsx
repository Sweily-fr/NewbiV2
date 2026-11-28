// Bento des LP outils : même disposition que BenefitsBento de /lp/gestion
// (7/5 puis 4/4/4, cartes gris dégradé sans bordure), avec un visuel par
// carte fourni par la page. Items : { title, desc, visual }. Le visuel est
// ancré en bas de la carte et peut en sortir (overflow-hidden).
const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 flex flex-col overflow-hidden";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";

const SPANS = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
];

export default function LpToolBento({ id, title, items }) {
  return (
    <section id={id} className="px-5 py-14 md:py-20 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-10 md:mb-14">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          {items.map((item, i) => (
            <article
              key={item.title}
              className={`${CARD} ${SPANS[i] || "md:col-span-4"} pb-0 md:pb-0`}
            >
              <h3 className={TITLE}>{item.title}</h3>
              <p className={`${TEXT} max-w-lg`}>{item.desc}</p>
              <div className="relative flex-1 min-h-[220px] mt-6 flex items-end">
                <div className="w-full">{item.visual}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
