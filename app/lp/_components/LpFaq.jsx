import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";

// FAQ courte (5-6 objections max). Items : { id, title, content }.
// Le schéma FAQPage est généré depuis les mêmes items par la page.
export function buildFaqJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((q) => ({
      "@type": "Question",
      name: q.title,
      acceptedAnswer: { "@type": "Answer", text: q.content },
    })),
  };
}

export default function LpFaq({
  items,
  title = "Questions fréquentes",
  id = "lp-faq",
}) {
  return (
    <section id={id} className="px-5 py-14 md:py-20 scroll-mt-24">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-center text-gray-950 mb-12">
          {title}
        </h2>
        <Accordion
          type="single"
          collapsible
          className="bg-white w-full -space-y-px rounded-lg"
          defaultValue={items[0]?.id}
        >
          {items.map((item) => (
            <AccordionItem
              value={item.id}
              key={item.id}
              className="relative border-x first:rounded-t-lg first:border-t last:rounded-b-lg last:border-b"
            >
              <AccordionTrigger className="px-4 py-4 text-[15px] leading-6 hover:no-underline font-normal">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 px-4 whitespace-pre-line">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
