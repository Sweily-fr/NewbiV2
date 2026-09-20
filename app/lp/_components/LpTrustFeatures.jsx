// Bloc de réassurance en 3 colonnes sous le hero : icône (ou image), titre,
// une phrase. Items : { icon, title, desc }. `icon` est un nœud React (icône
// lucide, <img>, …) : il est centré dans une pastille grise si `plain` est
// absent, ou affiché tel quel sinon (ex. logo officiel).
export default function LpTrustFeatures({ items }) {
  return (
    <section className="px-5 pb-12 md:pb-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
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
            <h3 className="text-xl font-medium tracking-tight text-gray-950 mb-2">
              {item.title}
            </h3>
            <p className="text-base text-gray-700 max-w-xs">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
