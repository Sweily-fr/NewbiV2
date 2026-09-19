import { REVIEWS } from "./lp-config";

function Stars() {
  return (
    <div className="flex items-center gap-0.5 mb-3" aria-label="5 étoiles">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function LpTestimonials({ title = "Ils ont fermé leur Excel" }) {
  return (
    <section className="px-5 py-14 md:py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-center text-gray-950 mb-10">
          {title}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {REVIEWS.map((r) => (
            <figure
              key={r.name}
              className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col"
            >
              <Stars />
              <blockquote className="text-[15px] text-gray-800 leading-relaxed flex-1">
                « {r.text} »
              </blockquote>
              <figcaption className="mt-4 text-sm text-gray-500">
                <span className="font-medium text-gray-900">{r.name}</span> -{" "}
                {r.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
