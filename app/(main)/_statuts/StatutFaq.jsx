import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

// Même gabarit de FAQ que les LP produits, données structurées comprises.
export default function StatutFaq({ chapo, questions }) {
  const items = questions.map((q) => ({
    question: q.title,
    answer: q.content,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(items)) }}
      />
      <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-10 pb-16 md:pt-20 lg:pt-22">
        <div className="space-y-2 text-center">
          <h2 className="text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:text-5xl lg:text-[3.5rem]">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            {chapo}{" "}
            <a href="/contact" className="underline underline-offset-4">
              écrivez-nous
            </a>
            .
          </p>
        </div>
        <PublicFaq items={items} />
      </div>
    </>
  );
}
