// Bandeau de réassurance : 3 à 5 points courts, sous le hero.
export default function LpTrustBar({ items }) {
  return (
    <section className="px-5 pb-12 md:pb-16">
      <div className="max-w-6xl mx-auto">
        <ul className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-x-8 gap-y-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 text-sm text-gray-700">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5A50FF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
