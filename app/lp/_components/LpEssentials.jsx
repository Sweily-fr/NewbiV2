// Section « l'essentiel » : 3 cartes hautes, lisibles d'un coup d'œil
// (titre, courte intro, points clés, visuel ancré en bas). Items :
// { title, intro, points?: string[], visual?, cta? }.
export default function LpEssentials({ title, items }) {
  return (
    <section className="px-5 py-14 md:py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-10 md:mb-14">
          {title}
        </h2>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {items.map(({ title: t, intro, points, visual, cta }) => (
            <article
              key={t}
              className="flex flex-col min-h-[560px] md:min-h-[640px] rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-6 md:p-8"
            >
              <h3 className="text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3">
                {t}
              </h3>
              <p className="text-[15px] leading-relaxed text-gray-700">
                {intro}
              </p>
              {points?.length > 0 && (
                <ul className="mt-4 space-y-2 text-[15px] leading-relaxed text-gray-700">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9CA3AF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-1.5 shrink-0"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
              {cta && <div className="mt-5">{cta}</div>}
              {/* Zone visuel : prend la hauteur restante ; les animations
                  (absolute inset-0) s'y centrent, un visuel statique aussi */}
              {visual && (
                <div className="relative flex-1 min-h-[300px] md:min-h-[340px] mt-6 -mx-2 flex items-center justify-center">
                  {visual}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
