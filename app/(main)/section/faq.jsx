"use client";
import { useState } from "react";

const faqs = [
  {
    question: "Qu’est-ce que newbi ?",
    answer:
      "Newbi est une plateforme tout‑en‑un pour gérer simplement et efficacement votre activité: devis, factures, signature de mail, gestion de tâches en Kanban et transfert de fichiers sécurisé. Notre objectif ? Vous faire gagner du temps du premier contact client jusqu’à l’encaissement.",
  },
  {
    question: "À qui s’adresse newbi ?",
    answer:
      "Newbi est une plateforme pensée pour les indépendants, TPE/PME, agences et associations qui veulent centraliser leurs outils commerciaux et administratifs, sans complexité. Newbi convient aussi aux équipes qui collaborent sur des ventes et des projets.",
  },
  {
    question: "Comment créer un compte Newbi et vérifier mon adresse e‑mail ?",
    answer:
      'C\'est très simple, 3 étapes :\n\n• Cliquez sur "Inscription" depuis la page d\'accueil\n• Renseignez votre mail et un mot de passe robuste\n• Ouvrez l\'e‑mail de confirmation et cliquez sur "Vérifier mon adresse"',
  },
  {
    question:
      "Quelles sont les premières étapes après l’inscription pour être opérationnel rapidement ?",
    answer:
      "Après votre inscription, plusieurs choses sont à réaliser si vous souhaitez être opérationnel.\n \n• Complétez votre catalogue produits: \nCréez vos produits avec leurs tarifs HT/ TTC, taux de TVA, unités, remises éventuelles\n• Complétez votre annuaire clients: \nAjoutez vos clients(raison sociale, SIREN / SIRET, n°TVA, contacts, adresse de facturation / livraison)\n\nAvec ces données en place, vous pouvez générer vos premiers devis puis les convertir en factures en quelques clics. Passez ensuite à la génération de votre signature professionnelle et celles de vos équipes, si besoin. Une fois ces étapes effectuées, vous êtes prêt à utiliser Newbi de manière fluide et efficace.",
  },
  {
    question:
      "Quelles formules et quels prix propose Newbi ? Y a-t-il un essai gratuit ?",
    answer:
      "A l’inscription vous bénéficiez de 14 jours gratuits, durant lesquels vous pouvez résilier votre abonnement à tout moment.\n \n- Ensuite, les prix sont pour la première année:\nAbonnement mensuel: 12,49 € HT / mois.\nAbonnement annuel: 134,89 € HT / an (soit 10% de réduction par rapport au mensuel).\n\n- À partir de la deuxième année:\nAbonnement mensuel: 12,49 € HT / mois.\nAbonnement annuel: 134,89 € HT / an (soit 10% de réduction par rapport au mensuel).\n\n Vous pouvez à tout moment, vous pouvez changer votre abonnement ou le résilier sans conditions",
  },
  {
    question:
      "Quels moyens de paiement sont acceptés pour l’abonnement Newbi et comment modifier ma formule ?",
    answer:
      "Actuellement, l’abonnement Newbi se règle uniquement par carte bancaire. Il suffit d’enregistrer une carte valide dans votre espace client pour démarrer après les 14 jours d’essai gratuit.",
  },
  {
    question: "Qui contacter si j’ai une question ou un problème sur Newbi ?",
    answer:
      "Rejoignez la communauté Newbi sur Whatsapp. Il suffit d’y accéder pour rejoindre les groupes thématiques et poser vos questions directement à la communauté et à l’équipe.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-10 md:px-8 md:py-10">
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
                    {faq.answer.split("\n").map((line, lineIdx) => (
                      <div key={lineIdx}>
                        {line}
                        {lineIdx < faq.answer.split("\n").length - 1 && <br />}
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
