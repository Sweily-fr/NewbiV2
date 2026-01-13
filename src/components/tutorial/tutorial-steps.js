// Définition des étapes du tutoriel pour la Phase 1
// Couvre : Sidebar et Dropdown menu utilisateur

export const tutorialSteps = [
  // Étape 1 : Bienvenue
  {
    target: "body",
    content:
      "Bienvenue sur Newbi ! 👋 Laissez-nous vous guider à travers les fonctionnalités principales de votre espace de travail.",
    placement: "center",
    disableBeacon: true,
    title: "Bienvenue sur Newbi",
  },
  // Étape 2 : Team Switcher (en haut de la sidebar)
  {
    target: '[data-tutorial="team-switcher"]',
    content:
      "Ici, vous pouvez voir et changer d'espace de travail. Cliquez pour accéder à vos différentes organisations.",
    placement: "right",
    title: "Sélecteur d'espace",
  },
  // Étape 3 : Navigation principale - Dashboard
  {
    target: '[data-tutorial="nav-dashboard"]',
    content:
      "Le Dashboard vous donne une vue d'ensemble de votre activité : revenus, dépenses et statistiques clés.",
    placement: "right",
    title: "Tableau de bord",
  },
  // Étape 4 : Navigation principale - Transactions
  {
    target: '[data-tutorial="nav-transactions"]',
    content:
      "Consultez toutes vos transactions bancaires synchronisées et gérez vos mouvements financiers.",
    placement: "right",
    title: "Transactions",
  },
  // Étape 5 : Carte Trial/Abonnement
  {
    target: '[data-tutorial="trial-card"]',
    content:
      "Suivez l'état de votre période d'essai ou de votre abonnement. Passez à Pro pour débloquer toutes les fonctionnalités !",
    placement: "right",
    title: "Votre abonnement",
  },
  // Étape 6 : Menu utilisateur
  {
    target: '[data-tutorial="nav-user"]',
    content:
      "Cliquez ici pour accéder à votre profil, gérer votre abonnement, changer le thème ou vous déconnecter.",
    placement: "right",
    title: "Menu utilisateur",
  },
  // Étape finale
  {
    target: "body",
    content:
      "🎉 Vous êtes prêt ! Explorez Newbi et n'hésitez pas à relancer ce tutoriel depuis les paramètres si besoin.",
    placement: "center",
    title: "C'est parti !",
  },
];
