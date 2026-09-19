// Bento de bénéfices : chaque carte montre un bout du produit (mini-interface)
// plutôt qu'une icône. Items : { title, desc, visual: <Component/>, wide? }.
// Les cartes `wide` prennent 2 colonnes sur desktop.
export default function LpBenefits({ eyebrow, title, subtitle, items }) {
  return (
    <section className="px-5 py-14 md:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-10 md:mb-14">
          {eyebrow && (
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
              {eyebrow}
            </span>
          )}
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            {title}
          </h2>
          {subtitle && <p className="text-gray-600 text-balance">{subtitle}</p>}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ title: t, desc, visual, wide }) => (
            <article
              key={t}
              className={`flex flex-col rounded-3xl border border-gray-200 bg-gradient-to-b from-white to-[#F7F6FF]/60 p-5 ${
                wide ? "lg:col-span-2" : ""
              }`}
            >
              <div className="flex-1 mb-5">{visual}</div>
              <h3 className="text-[17px] font-semibold text-gray-950 leading-snug">
                {t}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mt-1.5">
                {desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
