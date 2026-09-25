import { generateNextMetadata } from "@/src/utils/seo-data";
import { faqJsonLd } from "@/src/components/public-faq";
import { faqData } from "./faq-data";

// La page est un composant client ("use client") : elle ne peut pas exporter
// `metadata`. Sans ce layout, Next servait le titre par défaut du layout
// racine et les balises n'étaient injectées que côté client, donc invisibles
// pour Google (constaté en prod le 23/09/2026).
export const metadata = generateNextMetadata("faq");

// Les 19 questions déclarées en FAQPage, et non 3 comme auparavant : le bloc
// était écrit à la main dans la page et n'avait jamais suivi l'ajout des
// questions suivantes.
const jsonLd = faqJsonLd(
  faqData.flatMap((section) =>
    section.questions.map((faq) => ({ question: faq.q, answer: faq.a }))
  )
);

export default function FaqLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
