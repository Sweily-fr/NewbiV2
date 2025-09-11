"use client";
import { useState } from "react";

const faqs = [
  {
    question: "Comment créer un devis avec Newbi ?",
    answer:
      "Pour créer un devis avec Newbi, ouvrez l’outil Devis. Cliquez sur “créer un devis”, si votre client se trouve dans votre annuaire client vous avez juste à le rechercher. Sinon, vous pouvez aussi le rechercher à partir de son numéro de SIREN ou SIRET. Remplissez les conditions, échéances, détails produits…",
  },
  {
    question: "Puis-je personnaliser mes devis ?",
    answer:
      "Oui ! Le logo, les couleurs, les champs affichés, les conditions de vente, les mentions légales, le pied de page (pénalités de retard, indemnité forfaitaire, IBAN). Vous pouvez aussi définir le préfixe de numérotation (ex. FY25‑).",
  },
  {
    question: "Est-ce que les devis sont conformes à la législation française ?",
    answer:
      "Un devis n’est pas une facture mais doit comporter les informations essentielles: identité du prestataire et du client, les caractéristiques principales du bien ou du service, le prix, la TVA applicable, les conditions et durée de validité. Newbi pré remplit ces éléments et vous laisse ajouter vos clauses.",
  },
  {
    question: "Comment suivre le statut de votre devis ?",
    answer:
      "Lors de la création de votre devis, vous allez définir une date d’échéance. A partir de ce moment, des rappels automatiques peuvent être envoyés avant l’échéance. Passé la date, le devis passera en “expiré”. Vous pourrez également mettre à jour le statut de votre devis.",
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
