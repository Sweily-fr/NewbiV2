import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

/* Les réponses décrivent l'espace gestionnaire tel qu'il est en prod
   (app/dashboard/gestionnaire, src/lib/managed-clients.js,
   src/lib/manager-billing.js) : rien n'est annoncé qui n'existe pas. Pas de
   tarif de l'espace cabinet ici : il n'a pas de prix public. */
const questions = [
  {
    title: "Newbi remplace-t-il mon logiciel de production comptable ?",
    content:
      "Non. Newbi est l'outil de facturation et de gestion de vos clients : factures, devis, bons de commande, dépenses, trésorerie. Votre logiciel de production reste le vôtre. Vous récupérez les données de vos clients par export CSV ou Excel, et en FEC selon leur formule.",
  },
  {
    title: "Comment ouvrir un espace cabinet ?",
    content:
      "Créez votre compte Newbi si vous n'en avez pas, puis écrivez-nous depuis le formulaire de contact. Nous rattachons l'espace cabinet à ce compte : vous le retrouvez à la connexion, avec vos identifiants habituels.",
  },
  {
    title: "Comment ajouter un client à mon portefeuille ?",
    content:
      "Deux cas. Pour un client qui n'est pas encore sur Newbi, vous créez son compte avec son SIRET, que Newbi vérifie et qui remplit l'adresse et la forme juridique ; il reçoit un e-mail pour choisir son mot de passe. Pour un client déjà inscrit, vous l'invitez par e-mail : il accepte et choisit le ou les espaces que vous suivrez.",
  },
  {
    title: "Que voit le cabinet dans l'espace d'un client ?",
    content:
      "Le cabinet rejoint l'espace du client avec le rôle comptable. Dans votre espace cabinet, vous retrouvez les factures, devis, bons de commande, bons de livraison et avoirs de chaque client suivi, et vous ouvrez un document en un clic. Le client reste propriétaire de son espace et de ses réglages.",
  },
  {
    title: "Qui paie l'abonnement de mes clients ?",
    content:
      "Par défaut, le client. Chaque nouveau client démarre avec 30 jours d'essai, puis choisit son offre. Si vous préférez l'inclure dans votre mission, le cabinet peut prendre à sa charge l'abonnement d'un espace, y compris en cours de route : le client en est prévenu. Les abonnements payés par le cabinet se suivent depuis ses paramètres.",
  },
  {
    title:
      "Le cabinet compte-t-il comme un utilisateur payant chez le client ?",
    content:
      "Non. Le cabinet est membre de l'espace du client sans occuper de place d'utilisateur facturée, comme les accès comptables gratuits.",
  },
  {
    title: "Mes clients seront-ils prêts pour la facture électronique ?",
    content:
      "Newbi transmet et reçoit les factures électroniques par une plateforme agréée, au format Factur-X, sans supplément. Les entreprises doivent pouvoir recevoir des factures électroniques depuis le 1er septembre 2026, et les TPE et PME devront les émettre à partir du 1er septembre 2027.",
  },
  {
    title: "Puis-je suivre des clients qui ont plusieurs entreprises ?",
    content:
      "Oui. Chaque entreprise a son propre espace dans Newbi, et un client qui en possède plusieurs choisit, à l'invitation, ceux que le cabinet suivra.",
  },
];

export default function FAQ() {
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
            Les questions que se posent les cabinets avant d&apos;ouvrir leur
            espace. Si vous ne trouvez pas la vôtre,{" "}
            <a
              href="/contact?sujet=espace-cabinet"
              className="underline underline-offset-4"
            >
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
