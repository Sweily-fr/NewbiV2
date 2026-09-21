// Bloc de réassurance en 3 colonnes sous le hero : icône (ou image), titre,
// une phrase. Items : { icon, title, desc }. `icon` est un nœud React (icône
// lucide, <img>, …) : il est centré dans une pastille grise si `plain` est
// absent, ou affiché tel quel sinon (ex. logo officiel).
// `columns` : 3 (défaut) ou 5 colonnes sur desktop.
export default function LpTrustFeatures({ items, columns = 3 }) {
  return (
    <section className="px-5 pb-12 md:pb-16">
      <div
        className={`max-w-6xl mx-auto grid grid-cols-1 gap-10 md:gap-8 ${
          columns === 5
            ? "sm:grid-cols-2 lg:grid-cols-5 lg:gap-6"
            : "md:grid-cols-3"
        }`}
      >
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col items-center text-center"
          >
            <div className="flex h-16 items-center justify-center mb-5">
              {item.plain ? (
                item.icon
              ) : (
                <div className="flex size-14 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
                  {item.icon}
                </div>
              )}
            </div>
            <h3
              className={`font-medium tracking-tight text-gray-950 mb-2 text-balance ${
                columns === 5 ? "text-lg" : "text-xl"
              }`}
            >
              {item.title}
            </h3>
            <p
              className={`text-gray-700 max-w-xs ${
                columns === 5 ? "text-[15px]" : "text-base"
              }`}
            >
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
