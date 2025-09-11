"use client";
import { useState } from "react";

const faqs = [
  {
    question: "Comment créer une signature de mail avec Newbi ?",
    answer:
      "Ouvrez l’outil signature de mail, créez une nouvelle signature, ajoutez le logo, les couleurs, la typographie de votre choix, les coordonnées, les boutons sociaux et champs dynamiques. Vous n’avez plus qu’à copier-coller votre signature et l'enregistrer",
  },
  {
    question: "Puis-je créer des signatures de mail pour toute mon équipe ?",
    answer:
      "Oui, il est possible de créer des signatures de mail pour toute votre équipe.",
  },
  {
    question: "Puis-je personnaliser mes signatures de mail ?",
    answer:
      "Oui, vous pouvez modifier les couleurs, la police, les boutons sociaux, la disposition des champs pour créer la signature correspondant à votre image de marque.",
  },
  {
    question: "La signature générée est-elle responsive et compatible avec les principaux clients mail ?",
    answer:
      "Oui, optimisée pour Gmail, Outlook, Apple Mail et mobile.",
  },
  {
    question: "Qui contacter si j’ai une question ou un problème avec mon outil ?",
    answer:
      "Rejoignez la communauté Newbi sur Whatsapp. Il suffit d’y accéder pour rejoindre les groupes thématiques et poser vos questions directement à la communauté et à l’équipe.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-10 md:px-8 md:py-20">
      <h2 className="text-2xl text-center sm:text-4xl font-medium text-gray-900 mb-4 data-dark:text-white">
        Questions fréquentes
      </h2>
      <p className="mx-auto max-w-lg text-center text-base text-neutral-600 dark:text-neutral-50">
        Nous sommes là pour répondre à toutes vos questions. Si vous ne trouvez
        pas l'information recherchée, contactez-nous{" "}
        <a href="mailto:support@newbi.fr" className="text-blue-500 underline">
          contact@newbi.fr
        </a>
      </p>
      <div className="mx-auto mt-10 w-full max-w-3xl">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="shadow-input mb-8 w-full cursor-pointer border rounded-lg bg-white p-4 dark:bg-neutral-900"
            onClick={() => setOpen(open === idx ? null : idx)}
          >
            <div className="flex items-start">
              <div className="relative mr-4 mt-1 h-6 w-6 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`absolute inset-0 h-6 w-6 transform text-black transition-all duration-200 dark:text-white ${open === idx ? "scale-0 rotate-90" : ""}`}
                >
                  <path d="M6 15l6 -6l6 6"></path>
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`absolute inset-0 h-6 w-6 transform text-black transition-all duration-200 dark:text-white ${open === idx ? "" : "scale-0 rotate-90"}`}
                >
                  <path d="M6 9l6 6l6 -6"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-md font-medium text-neutral-700 dark:text-neutral-200">
                  {faq.question}
                </h3>
                {open === idx && (
                  <div className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
                    {faq.answer.split('\n').map((line, lineIdx) => (
                      <div key={lineIdx}>
                        {line}
                        {lineIdx < faq.answer.split('\n').length - 1 && <br />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
