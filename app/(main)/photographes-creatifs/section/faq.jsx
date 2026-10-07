import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

/* Les règles métier viennent de l'article « Facture de photographe : modèle,
   droits d'auteur, TVA et mentions » du blog. Ce qui relève de l'application —
   taux de TVA à la ligne, filigrane, paiement avant téléchargement, expiration
   et mot de passe du lien, volume par transfert — est décrit d'après le modèle
   de données réel : rien n'est annoncé qui n'existe pas. */
const questions = [
  {
    title: "Pourquoi séparer la prestation et la cession de droits ?",
    content:
      "Parce qu'elles ne relèvent pas du même taux. La prise de vue est une prestation de service à 20 %, tandis que la cession de droits d'auteur bénéficie du taux réduit de 10 % au titre de l'article 279 g du Code général des impôts. Les regrouper sur une seule ligne expose à un redressement et fragilise la déduction de TVA de votre client. Dans Newbi le taux se choisit ligne par ligne : les deux cohabitent sur la même facture.",
  },
  {
    title: "Que doit préciser la mention de cession ?",
    content:
      "Le périmètre de l'autorisation accordée au client : la durée, le territoire, les supports concernés et le caractère exclusif ou non. Ces précisions se portent dans la description de la ligne de cession, ou dans les notes du document si elles méritent un paragraphe.",
  },
  {
    title: "Comment fonctionne le filigrane sur un transfert ?",
    content:
      "Vous l'activez sur le transfert : les images s'affichent alors marquées pour le destinataire, et le téléchargement est bloqué. C'est fait pour la validation d'une sélection — le client voit et choisit, sans repartir avec les fichiers. Pour livrer les originaux, vous envoyez un second transfert sans filigrane.",
  },
  {
    title: "Puis-je faire payer avant la livraison des fichiers ?",
    content:
      "Oui. Vous fixez un montant sur le transfert : le destinataire doit régler avant que le lien ne libère les fichiers. C'est un réglage du transfert, indépendant de vos factures — à vous d'émettre la facture correspondante dans Newbi.",
  },
  {
    title: "Combien de temps le lien reste-t-il valable ?",
    content:
      "Sept jours par défaut, et vous fixez la date qui vous convient. Vous pouvez y ajouter un mot de passe, nommer le destinataire, et activer un rappel avant l'échéance pour éviter qu'un client ne découvre un lien expiré.",
  },
  {
    title: "Quel volume puis-je envoyer par transfert ?",
    content:
      "Cela dépend de votre formule : 5 Go par transfert en Freelance, 15 Go en TPE et 50 Go en Entreprise. De quoi envoyer un reportage complet ou des rushes sans passer par un service tiers.",
  },
  {
    title: "Et si je suis en franchise en base de TVA ?",
    content:
      "Vos documents partent alors sans TVA, avec la mention d'exonération correspondante — qui devient obligatoire dès qu'une ligne est à 0 %. La distinction entre prestation et cession de droits reste utile à faire apparaître, même sans taux à appliquer.",
  },
  {
    title: "Puis-je demander un acompte avant la prestation ?",
    content:
      "Oui, avec une facture d'acompte : c'est un type de document à part entière, qui prend sa place dans votre numérotation continue. Les factures émises ensuite s'imputent sur ce qui a déjà été réglé.",
  },
  {
    title: "Que se passe-t-il pendant les 30 jours offerts ?",
    content:
      "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, transfert de fichiers compris. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
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
            Les questions que se posent les photographes et les créatifs sur
            leur facturation. Si vous ne trouvez pas la vôtre,{" "}
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
