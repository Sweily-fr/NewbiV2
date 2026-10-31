import { ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Accordéon des articles, en `<details>/<summary>` natifs.
 *
 * Les articles écrivent leur FAQ avec l'API de l'accordéon partagé
 * (Accordion/AccordionItem/AccordionTrigger/AccordionContent), mais ce
 * composant Radix démonte les réponses fermées, y compris au rendu serveur.
 * Mesuré en production le 31/10/2026 sur /blog/facturer-en-sous-traitance-regles :
 * les blocs de réponse étaient vides, les réponses n'existaient que dans le
 * JSON-LD FAQPage. Ni Google ni les assistants IA ne les lisaient dans la
 * page, et ce sur tous les articles qui ont une FAQ. Même correctif que
 * src/components/public-faq.jsx pour les pages publiques (25/09/2026).
 *
 * Les props Radix (`type`, `collapsible`, `value`, `defaultValue`) sont
 * ignorées : plusieurs réponses peuvent être ouvertes à la fois.
 */

type Props = { children?: React.ReactNode; className?: string };

export function MdxAccordion({ children, className }: Props) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

export function MdxAccordionItem({ children, className }: Props) {
  return (
    <details className={cn("group border-b last:border-b-0", className)}>
      {children}
    </details>
  );
}

export function MdxAccordionTrigger({ children, className }: Props) {
  return (
    <summary
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left marker:content-none hover:underline [&::-webkit-details-marker]:hidden",
        className,
      )}
    >
      {/* La question reste un titre de niveau 3, comme le faisait
          `AccordionPrimitive.Header`. */}
      <h3 className="text-sm font-semibold">{children}</h3>
      <ChevronDown
        className="size-4 shrink-0 opacity-60 transition-transform duration-200 group-open:rotate-180"
        aria-hidden="true"
      />
    </summary>
  );
}

export function MdxAccordionContent({ children, className }: Props) {
  return <div className={cn("pt-0 pb-4 text-sm", className)}>{children}</div>;
}
