"use client";
import { useState } from "react";

const faqs = [
  {
    question: "Comment créer ma première facture avec Newbi ?",
    answer:
      "Avec Newbi, deux façons s'offrent à vous pour créer et éditer vos factures.\n\n- Cliquez sur le bouton créer la facture -> l'éditeur de facture s'ouvre. Presque toutes les informations sont déjà préremplies. \n- Modifier au besoin vos conditions de paiement, échéance, remises, notes/mentions légales et numérotation. \n- Enregistrez, puis envoyez la facture par e‑mail.",
  },
  {
    question: "Puis-je personnaliser mes factures ?",
    answer:
      "Oui ! Le logo, les couleurs, les champs affichés, les conditions de vente, les mentions légales, le pied de page (pénalités de retard, indemnité forfaitaire, IBAN). Vous pouvez aussi définir le préfixe de numérotation (ex. FY25‑).",
  },
  {
    question: "Comment modifier mes informations entreprises clients ?",
    answer:
      "Pour modifier vos informations clients, rendez vous dans la page Clients > Sélectionnez le client > Modifier. Les changements s’appliquent aux prochaines factures. Les documents déjà émis restent inchangés pour assurer la traçabilité.",
  },
  {
    question: "Est-ce que les factures sont conformes à la législation française ?",
    answer:
      "Newbi vous aide à respecter les exigences clés: numérotation continue et inaltérable, date d’émission, identité vendeur/acheteur, N° TVA quand applicable, détail des lignes, taux et montants de TVA, totaux HT/TVA/TTC, échéance, conditions de paiement, pénalités et indemnité forfaitaire, mentions spécifiques si exonération. L’export et l’archivage sont disponibles pour votre comptabilité.",
  },
  {
    question: "Qui contacter si j’ai une question ou un problème avec mon outil ?",
    answer:
      "Rejoignez la communauté Newbi sur Whatsapp. Il suffit d’y accéder pour rejoindre les groupes thématiques et poser vos questions directement à la communauté et à l’équipe.",
  }
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
