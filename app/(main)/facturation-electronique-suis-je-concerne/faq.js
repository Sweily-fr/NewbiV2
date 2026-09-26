// Questions affichées sur la page ET balisées en FAQPage : le module est
// volontairement neutre (pas de "use client"), pour que la page serveur
// puisse lire le tableau — un export de module client n'est qu'une référence.
export const FAQ = [
  {
    q: "Qui est concerné par la facturation électronique en France ?",
    a: "Toutes les entreprises assujetties à la TVA et établies en France, pour leurs échanges avec d'autres entreprises françaises. Cela inclut les auto-entrepreneurs, les entreprises en franchise en base de TVA, les sociétés et les associations assujetties. La forme juridique n'entre pas en compte : c'est l'assujettissement à la TVA qui fait foi.",
  },
  {
    q: "À quelle date suis-je concerné ?",
    a: "Le 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir des factures électroniques. Pour l'émission, les grandes entreprises et les ETI démarrent au 1er septembre 2026 ; les PME, TPE et micro-entreprises au 1er septembre 2027.",
  },
  {
    q: "Les auto-entrepreneurs sont-ils concernés ?",
    a: "Oui. La franchise en base de TVA ne dispense pas de la facturation électronique. Un auto-entrepreneur doit pouvoir recevoir des factures électroniques dès le 1er septembre 2026, et émettre les siennes au format électronique à partir du 1er septembre 2027.",
  },
  {
    q: "Et si je ne facture que des particuliers ?",
    a: "Les factures à des particuliers ne passent pas par le dispositif de facturation électronique. Elles relèvent de l'e-reporting : tu transmets périodiquement à l'administration le montant des transactions réalisées, sans transmettre la facture elle-même.",
  },
  {
    q: "Puis-je continuer à envoyer mes factures en PDF par e-mail ?",
    a: "Jusqu'à ta date d'obligation d'émission, oui. Ensuite, une facture B2B envoyée en PDF par e-mail ne vaudra plus facture : elle devra passer par une plateforme agréée dans un format structuré (Factur-X, UBL ou CII).",
  },
  {
    q: "Qu'est-ce qu'une plateforme agréée (PDP) ?",
    a: "Une Plateforme de Dématérialisation Partenaire est un opérateur immatriculé par l'administration fiscale pour émettre, recevoir et transmettre les factures électroniques, ainsi que les données de transaction. Toutes les factures concernées transitent par ce type de plateforme.",
  },
  {
    q: "Que se passe-t-il si je ne suis pas prêt à la date prévue ?",
    a: "Le principal risque est opérationnel avant d'être financier : tes clients soumis à l'obligation ne pourront plus accepter tes factures PDF, et tes propres factures fournisseurs arriveront sur une plateforme que tu n'auras pas configurée. Des sanctions forfaitaires sont par ailleurs prévues par le Code général des impôts.",
  },
  {
    q: "Comment savoir si mon entreprise est déjà inscrite à une plateforme ?",
    a: "Le simulateur en haut de cette page interroge l'annuaire des entreprises et t'indique si ton SIREN est déjà rattaché à une plateforme agréée, et laquelle le cas échéant.",
  },
];
