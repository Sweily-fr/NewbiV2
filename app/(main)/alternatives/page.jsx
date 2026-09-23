import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { getAllPosts } from "@/src/lib/blog";
import { SITE_URL } from "@/src/lib/site";

// Hub « Comparatifs et alternatives » : regroupe les articles « X vs Newbi »,
// « Alternatives à X » et les sélections par métier. Ces articles se
// classaient chacun dans leur coin ; une page qui les relie tous, liée depuis
// le footer, leur transmet l'autorité du site et répond à la requête
// « alternative à <concurrent> » avant même l'article dédié.

export const metadata = {
  title: {
    absolute:
      "Comparatifs et alternatives : Newbi face aux logiciels de facturation",
  },
  description:
    "Newbi comparé à Pennylane, Abby, Tiime, Indy, Freebe, Axonaut, Sellsy, QuickBooks et Zoho, plus les alternatives à Excel et les meilleurs logiciels par métier. Comparatifs honnêtes, mis à jour 2026.",
  alternates: { canonical: "/alternatives" },
  openGraph: {
    title: "Comparatifs et alternatives aux logiciels de facturation | Newbi",
    description:
      "Tous nos comparatifs « X vs Newbi », les alternatives à chaque logiciel et les meilleures solutions par métier, au même endroit.",
    url: "/alternatives",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/images/op-newbi.png", width: 1200, height: 630 }],
  },
};

function competitorName(post) {
  // « Pennylane vs Newbi : … » → « Pennylane »
  const m = post.title.match(/^(.+?)\s+vs\s+Newbi/i);
  return m ? m[1].trim() : post.title;
}

function groupPosts(posts) {
  const versus = [];
  const alternatives = [];
  const byJob = [];
  const others = [];
  for (const p of posts) {
    if (/-vs-newbi-comparatif$/.test(p.slug)) versus.push(p);
    else if (/^alternatives-/.test(p.slug)) alternatives.push(p);
    else if (/^(top-|meilleurs?-)/.test(p.slug)) byJob.push(p);
    else if (p.category === "comparaison") others.push(p);
  }
  versus.sort((a, b) => competitorName(a).localeCompare(competitorName(b)));
  return { versus, alternatives, byJob, others };
}

function Card({ post, label }) {
  return (
    <li>
      <Link
        href={`/blog/${post.slug}`}
        className="group block h-full rounded-xl border border-gray-200 bg-white p-5 hover:border-[#5a50ff] transition-colors"
      >
        {label && (
          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
            {label}
          </p>
        )}
        <h3 className="text-base font-medium text-gray-900 group-hover:text-[#5a50ff] mb-2">
          {post.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-3">{post.description}</p>
      </Link>
    </li>
  );
}

function Section({ id, title, intro, children }) {
  return (
    <section aria-labelledby={id} className="px-5 py-10 md:py-12">
      <div className="mx-auto max-w-[1200px]">
        <h2
          id={id}
          className="text-2xl md:text-3xl font-medium tracking-tight text-gray-900 mb-2"
        >
          {title}
        </h2>
        {intro && <p className="text-gray-600 mb-8 max-w-2xl">{intro}</p>}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>
      </div>
    </section>
  );
}

export default function AlternativesPage() {
  const posts = getAllPosts();
  const { versus, alternatives, byJob, others } = groupPosts(posts);
  const listed = [...versus, ...alternatives, ...byJob, ...others];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Comparatifs et alternatives aux logiciels de facturation",
      url: `${SITE_URL}/alternatives`,
      description: metadata.description,
      isPartOf: { "@type": "WebSite", name: "Newbi", url: SITE_URL },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: listed.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/blog/${p.slug}`,
          name: p.title,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Comparatifs et alternatives",
          item: `${SITE_URL}/alternatives`,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-32 bg-gradient-to-b from-gray-50 to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewHeroNavbar />

      <header className="px-5 mt-10 md:mt-16">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-xs uppercase tracking-wide text-[#5a50ff] mb-3">
            Comparatifs
          </p>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900 max-w-3xl">
            Newbi face aux autres logiciels de facturation et de gestion
          </h1>
          <p className="mt-4 max-w-2xl text-gray-600">
            Vous hésitez entre plusieurs outils, ou vous cherchez une
            alternative à celui que vous utilisez ? Chaque comparatif détaille
            les fonctionnalités, les tarifs, la conformité à la facturation
            électronique 2026 et le profil d'entreprise auquel l'outil
            convient le mieux. Nous y disons aussi quand Newbi n'est pas le
            bon choix.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link
              href="/logiciel-facturation-gratuit"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:border-[#5a50ff] hover:text-[#5a50ff]"
            >
              Essayer Newbi gratuitement 30 jours
            </Link>
            <Link
              href="/tarifs"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:border-[#5a50ff] hover:text-[#5a50ff]"
            >
              Voir les tarifs
            </Link>
            <Link
              href="/blog/categorie/comparaison"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:border-[#5a50ff] hover:text-[#5a50ff]"
            >
              Tous les comparatifs du blog
            </Link>
          </div>
        </div>
      </header>

      {versus.length > 0 && (
        <Section
          id="versus"
          title="Newbi comparé à chaque logiciel"
          intro="Fonctionnalités, prix, prise en main et conformité 2026, point par point."
        >
          {versus.map((p) => (
            <Card key={p.slug} post={p} label={`${competitorName(p)} vs Newbi`} />
          ))}
        </Section>
      )}

      {alternatives.length > 0 && (
        <Section
          id="alternatives"
          title="Alternatives à votre logiciel actuel"
          intro="Vous voulez changer d'outil ? Les meilleures alternatives, classées par profil, avec ce qu'il faut vérifier avant de migrer."
        >
          {alternatives.map((p) => (
            <Card key={p.slug} post={p} label="Alternatives" />
          ))}
        </Section>
      )}

      {byJob.length > 0 && (
        <Section
          id="par-metier"
          title="Les meilleurs logiciels par métier"
          intro="Artisans, freelances, professions libérales, associations, office managers : les sélections adaptées à chaque activité."
        >
          {byJob.map((p) => (
            <Card key={p.slug} post={p} label="Sélection" />
          ))}
        </Section>
      )}

      {others.length > 0 && (
        <Section id="autres" title="Autres comparatifs">
          {others.map((p) => (
            <Card key={p.slug} post={p} label="Comparatif" />
          ))}
        </Section>
      )}

      <section className="px-5 py-12 md:py-16">
        <div className="mx-auto max-w-[1200px] rounded-2xl bg-[#202020] p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-normal text-white mb-4">
            Le plus simple reste d'essayer
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-lg mx-auto">
            Newbi est gratuit pendant 30 jours, sans carte bancaire. Devis,
            factures, avoirs, banque, trésorerie et facturation électronique
            au même endroit.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-normal bg-white text-black hover:bg-gray-100 transition duration-150 active:scale-[0.98]"
          >
            Commencer gratuitement
          </Link>
        </div>
      </section>
    </div>
  );
}
