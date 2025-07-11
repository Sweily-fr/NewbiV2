"use client";
import { useState } from "react";

const faqs = [
  {
    question: "Qu’est-ce que newbi ?",
    answer:
      "newbi est une plateforme qui simplifie la gestion administrative et financière des indépendants et PME : facturation, relances automatiques, et suivi facile.",
  },
  {
    question: "À qui s’adresse newbi ?",
    answer:
      "newbi s’adresse aux freelancers, indépendants, petites entreprises et associations qui veulent gagner du temps sur leur gestion quotidienne.",
  },
  {
    question: "L’utilisation de newbi est-elle sécurisée ?",
    answer:
      "Oui, la sécurité de vos données est notre priorité : toutes vos informations sont chiffrées et stockées de façon sécurisée.",
  },
  {
    question: "Puis-je connecter newbi avec d’autres outils ?",
    answer:
      "newbi propose des intégrations avec vos outils préférés : agenda, messagerie, CRM et plus encore.",
  },
  {
    question: "Est-ce facile à prendre en main ?",
    answer:
      "L’interface a été pensée pour être simple et intuitive, même sans connaissances techniques.",
  },
  {
    question: "Comment contacter l’équipe support ?",
    answer:
      "Vous pouvez nous écrire à support@example.com ou directement via le chat sur la plateforme.",
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
          support@newbi.fr
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
                    {faq.answer}
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
