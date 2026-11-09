import Link from "next/link";
import PublicFaq from "@/src/components/public-faq";

/**
 * Blocs du guide affiché SOUS chaque outil public (générateurs, calculateur).
 *
 * Composants serveur, sans "use client" : le texte est dans le HTML servi et
 * n'ajoute aucun JavaScript à la page, l'outil au-dessus reste le seul îlot
 * interactif. Les tableaux sont des <table> natives plutôt que
 * `src/components/ui/table`, marqué "use client".
 *
 * Mesuré le 09/11/2026 sur le rendu serveur : environ 600 mots sous chaque
 * outil, sans mode d'emploi, sans exemple chiffré ni erreurs courantes, pour
 * des pages classées entre la 40e et la 55e position sur leurs requêtes.
 */

export function GuideSection({ id, title, intro, children }) {
  return (
    <section className="mt-16 max-w-3xl" aria-labelledby={id}>
      <h2
        id={id}
        className="text-2xl font-medium tracking-tight text-gray-900 mb-4"
      >
        {title}
      </h2>
      {intro && (
        <div className="text-gray-600 leading-relaxed mb-6">{intro}</div>
      )}
      {children}
    </section>
  );
}

/** Mode d'emploi en étapes numérotées. */
export function Steps({ steps }) {
  return (
    <ol className="space-y-4">
      {steps.map(({ title, text }, i) => (
        <li
          key={title}
          className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5"
        >
          <span
            aria-hidden="true"
            className="inline-flex size-8 flex-none items-center justify-center rounded-full bg-[#5a50ff]/10 text-sm font-medium text-[#5a50ff]"
          >
            {i + 1}
          </span>
          <div>
            <h3 className="text-base font-medium text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Liste de définitions en cartes (mentions, règles). */
export function DefinitionCards({ items, columns = 1 }) {
  return (
    <dl className={columns === 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
      {items.map(([titre, texte]) => (
        <div
          key={titre}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <dt className="text-sm font-medium text-gray-900">{titre}</dt>
          <dd className="mt-1 text-sm text-gray-600 leading-relaxed">
            {texte}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Tableau d'exemple chiffré. `rows` : tableaux de cellules, la première
 * colonne alignée à gauche, les suivantes à droite (montants). `totals` :
 * lignes [libellé, montant] affichées en pied de tableau.
 */
export function ExampleTable({ caption, head, rows, totals = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <caption className="caption-bottom px-4 py-3 text-left text-xs text-gray-500">
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            {head.map((h, i) => (
              <th
                key={h}
                scope="col"
                className={`px-4 py-2.5 font-normal ${i === 0 ? "text-left" : "text-right whitespace-nowrap"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-gray-100">
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={`px-4 py-2.5 text-gray-700 ${i === 0 ? "text-left" : "text-right whitespace-nowrap"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totals.length > 0 && (
          <tfoot>
            {totals.map(([label, value], i) => (
              <tr
                key={label}
                className={
                  i === totals.length - 1
                    ? "font-medium text-gray-900"
                    : "text-gray-600"
                }
              >
                <th
                  scope="row"
                  colSpan={head.length - 1}
                  className={`px-4 py-2 text-right ${i === totals.length - 1 ? "font-medium" : "font-normal"}`}
                >
                  {label}
                </th>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {value}
                </td>
              </tr>
            ))}
          </tfoot>
        )}
      </table>
    </div>
  );
}

/** Erreurs fréquentes : un titre court et l'explication. */
export function MistakeList({ items }) {
  return (
    <ul className="divide-y divide-gray-200 border-y border-gray-200">
      {items.map(({ title, text }) => (
        <li key={title} className="py-4">
          <h3 className="text-base font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">{text}</p>
        </li>
      ))}
    </ul>
  );
}

/** FAQ repliable en <details>, contenu présent dans le HTML servi. */
export function ToolFaq({ items }) {
  return <PublicFaq items={items} />;
}

/** Cartes de liens « Pour aller plus loin » : [href, titre, description]. */
export function RelatedLinks({ links }) {
  return (
    <ul className="grid sm:grid-cols-2 gap-4">
      {links.map(([href, titre, desc]) => (
        <li key={href}>
          <Link
            href={href}
            className="group block h-full rounded-xl border border-gray-200 bg-white p-5 hover:border-[#5a50ff] transition-colors"
          >
            <p className="text-base font-medium text-gray-900 group-hover:text-[#5a50ff]">
              {titre}
            </p>
            <p className="mt-1 text-sm text-gray-600">{desc}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Lien contextuel dans un paragraphe, au style des pages outils. */
export function InlineLink({ href, children }) {
  return (
    <Link href={href} className="text-[#5a50ff] underline underline-offset-4">
      {children}
    </Link>
  );
}
