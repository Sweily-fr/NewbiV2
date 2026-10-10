/**
 * Contenu de la page /faq.
 *
 * Extrait de `page.jsx` (qui est `"use client"`) pour que le `layout.jsx`,
 * lui rendu côté serveur, puisse en dériver le bloc FAQPage : un composant
 * client ne peut pas exporter de métadonnées ni garantir un JSON-LD au SSR.
 */
export const faqData = [
  {
    category: "Questions générales",
    badge: "Essentiel",
    questions: [
      {
        q: "Qu'est-ce que Newbi ?",
        a: "Newbi est une plateforme tout-en-un pour gérer simplement et efficacement votre activité: devis, factures, signature de mail, gestion de tâches en Kanban et transfert de fichiers sécurisé. Notre objectif ? Vous faire gagner du temps du premier contact client jusqu'à l'encaissement.",
      },
      {
        q: "À qui s'adresse Newbi ?",
        a: "Newbi est une plateforme pensée pour les indépendants, TPE/PME, agences et associations qui veulent centraliser leurs outils commerciaux et administratifs, sans complexité. Newbi convient aussi aux équipes qui collaborent sur des ventes et des projets.",
      },
      {
        q: "Comment créer un compte Newbi et vérifier mon adresse e-mail ?",
        a: "C'est très simple, 3 étapes :\n\n• Cliquez sur 'Inscription' depuis la page d'accueil\n• Renseignez votre mail et un mot de passe robuste\n• Ouvrez l'e-mail de confirmation et cliquez sur 'Vérifier mon adresse'",
      },
      {
        q: "Quelles sont les premières étapes après l'inscription pour être opérationnel rapidement ?",
        a: "Après votre inscription, plusieurs choses sont à réaliser si vous souhaitez être opérationnel.\n\n• Complétez votre catalogue produits:\nCréez vos produits avec leurs tarifs HT/TTC, taux de TVA, unités, remises éventuelles\n\n• Complétez votre annuaire clients:\nAjoutez vos clients (raison sociale, SIREN/SIRET, n°TVA, contacts, adresse de facturation/livraison)\n\nAvec ces données en place, vous pouvez générer vos premiers devis puis les convertir en factures en quelques clics.",
      },
    ],
  },
  {
    category: "Tarifs et abonnements",
    badge: "Pricing",
    questions: [
      {
        q: "Quelles formules et quels prix propose Newbi ? Y a-t-il un essai gratuit ?",
        a: "À l'inscription vous bénéficiez de 30 jours gratuits, sans carte bancaire, durant lesquels vous pouvez résilier à tout moment.\n\nEnsuite, trois formules, toutes en TTC :\n• Freelance : 17,99 €/mois, ou 16,19 €/mois en réglant à l'année\n• TPE : 48,99 €/mois, ou 44,09 €/mois à l'année\n• Entreprise : 94,99 €/mois, ou 85,49 €/mois à l'année\n\nL'engagement annuel revient à 10 % de moins que le mensuel. Vous pouvez à tout moment changer de formule ou résilier sans conditions.",
      },
      {
        q: "Quels moyens de paiement sont acceptés pour l'abonnement Newbi ?",
        a: "L'essai de 30 jours ne demande aucune carte bancaire. C'est seulement au moment de souscrire un abonnement, à la fin de l'essai, que le règlement se fait par carte bancaire depuis votre espace client.",
      },
    ],
  },
  {
    category: "Factures",
    badge: "Facturation",
    questions: [
      {
        q: "Comment créer ma première facture avec Newbi ?",
        a: "Avec Newbi, deux façons s'offrent à vous pour créer et éditer vos factures :\n\n• Cliquez sur le bouton créer la facture → l'éditeur de facture s'ouvre. Presque toutes les informations sont déjà préremplies\n• Modifiez au besoin vos conditions de paiement, échéance, remises, notes/mentions légales et numérotation\n• Enregistrez, puis envoyez la facture par e-mail",
      },
      {
        q: "Puis-je personnaliser mes factures ?",
        a: "Oui ! Le logo, les couleurs, les champs affichés, les conditions de vente, les mentions légales, le pied de page (pénalités de retard, indemnité forfaitaire, IBAN). Vous pouvez aussi définir le préfixe de numérotation (ex. FY25-).",
      },
      {
        q: "Est-ce que les factures sont conformes à la législation française ?",
        a: "Newbi vous aide à respecter les exigences clés: numérotation continue et inaltérable, date d'émission, identité vendeur/acheteur, N° TVA quand applicable, détail des lignes, taux et montants de TVA, totaux HT/TVA/TTC, échéance, conditions de paiement, pénalités et indemnité forfaitaire, mentions spécifiques si exonération.",
      },
    ],
  },
  {
    category: "Devis",
    badge: "Devis",
    questions: [
      {
        q: "Comment créer un devis avec Newbi ?",
        a: "Pour créer un devis avec Newbi, ouvrez l'outil Devis. Cliquez sur 'créer un devis', si votre client se trouve dans votre annuaire client vous avez juste à le rechercher. Sinon, vous pouvez aussi le rechercher à partir de son numéro de SIREN ou SIRET. Remplissez les conditions, échéances, détails produits…",
      },
      {
        q: "Puis-je personnaliser mes devis ?",
        a: "Oui ! Le logo, les couleurs, les champs affichés, les conditions de vente, les mentions légales, le pied de page (pénalités de retard, indemnité forfaitaire, IBAN). Vous pouvez aussi définir le préfixe de numérotation (ex. FY25-).",
      },
      {
        q: "Comment suivre le statut de votre devis ?",
        a: "Lors de la création de votre devis, vous allez définir une date d'échéance. À partir de ce moment, des rappels automatiques peuvent être envoyés avant l'échéance. Passé la date, le devis passera en 'expiré'. Vous pourrez également mettre à jour le statut de votre devis.",
      },
    ],
  },
  {
    category: "Signatures de mail",
    badge: "Email",
    questions: [
      {
        q: "Comment créer une signature de mail avec Newbi ?",
        a: "Ouvrez l'outil signature de mail, créez une nouvelle signature, ajoutez le logo, les couleurs, la typographie de votre choix, les coordonnées, les boutons sociaux et champs dynamiques. Vous n'avez plus qu'à copier-coller votre signature et l'enregistrer.",
      },
      {
        q: "Puis-je créer des signatures de mail pour toute mon équipe ?",
        a: "Oui, il est possible de créer des signatures de mail pour toute votre équipe.",
      },
      {
        q: "La signature générée est-elle responsive et compatible avec les principaux clients mail ?",
        a: "Oui, optimisée pour Gmail, Outlook, Apple Mail et mobile.",
      },
    ],
  },
  {
    category: "Tableau Kanban",
    badge: "Kanban",
    questions: [
      {
        q: "Comment utiliser l'outil tableau Kanban ?",
        a: "Créez un tableau:\n• Outils Kanban > Créer un tableau > nommez-le\n• Ouvrez-le en cliquant sur le tableau créé\n• Structurez vos colonnes: À faire → En cours → Fait\n• Ajoutez des tâches: bouton Nouvelle tâche (titre, description, échéance, responsable, priorité)\n• Mettez à jour: glissez-déposez les tâches entre les colonnes\n• Terminez: déplacez en Fait puis archivez pour garder l'historique propre",
      },
    ],
  },
  {
    category: "Transfert de fichiers",
    badge: "Transfert",
    questions: [
      {
        q: "Comment fonctionne l'outil transfert de fichiers Newbi ?",
        a: "Glissez-déposez vos fichiers, obtenez un lien sécurisé à partager au client. Vous pouvez définir un mot de passe, une date d'expiration et une limite de téléchargements. Notifications à chaque téléchargement.",
      },
      {
        q: "Quelle est la taille maximale possible par transfert ?",
        a: "La taille maximale possible par transfert est de 5Go.",
      },
      {
        q: "Que se passe-t-il si mon client n'a pas téléchargé les fichiers avant l'expiration du lien ?",
        a: "Le lien devient inaccessible. Il faudra créer un nouveau lien avec une nouvelle date d'expiration.",
      },
    ],
  },
];
