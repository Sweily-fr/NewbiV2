import { ChevronDown } from "lucide-react";

/**
 * FAQ des pages PUBLIQUES, en `<details>/<summary>` natifs.
 *
 * Pourquoi ne pas utiliser `src/components/ui/accordion.jsx` ici : Radix rend
 * `AccordionPrimitive.Content` sans `forceMount`, donc il DÉMONTE le contenu
 * fermé, y compris au rendu serveur. Mesuré en production le 25/09/2026 : sur
 * les 62 blocs de réponse des pages publiques, 7 seulement contenaient du
 * texte (le seul ouvert par défaut de chaque page). Les 55 autres réponses,
 * pourtant rédigées, n'atteignaient aucun robot, aucun moteur, et aucun
 * lecteur sans JavaScript.
 *
 * Pourquoi pas simplement `forceMount` sur le composant partagé : il est
 * importé par 19 fichiers, dont six formulaires du tableau de bord où un
 * `AccordionContent` enferme des centaines de lignes de JSX à l'intérieur
 * d'un `.map()` par ligne de facture. Les monter en permanence dégraderait
 * l'application, derrière authentification, pour une surface qu'aucun robot
 * ne visite. `forceMount` laisse en outre un attribut `hidden` que les
 * extracteurs de contenu filtrent.
 *
 * `<details>` est la seule forme dont le contenu est à la fois présent dans
 * le HTML servi, non masqué au sens CSS, et replié visuellement. C'est déjà
 * ce que font les pages qui fonctionnent (/outils/*, /modeles).
 */

export function faqJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export default function PublicFaq({ items, className = "", defaultOpen = 0 }) {
  return (
    <div
      className={`bg-card dark:bg-card/50 w-full rounded-lg border ${className}`}
    >
      {items.map(({ question, answer }, i) => (
        <details
          key={question}
          open={i === defaultOpen}
          className="group border-b last:border-b-0"
        >
          {/* La question reste un titre de niveau 3, comme le faisait
              `AccordionPrimitive.Header` : c'est ce qui donne sa structure au
              document, pour les lecteurs d'écran comme pour les moteurs. */}
          <summary className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-[15px] leading-6 font-normal text-left marker:content-none [&::-webkit-details-marker]:hidden">
            <h3 className="text-[15px] leading-6 font-normal">{question}</h3>
            <ChevronDown
              className="size-4 shrink-0 opacity-60 transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="text-muted-foreground px-4 pb-4 text-sm whitespace-pre-line">
            {answer}
          </div>
        </details>
      ))}
    </div>
  );
}
