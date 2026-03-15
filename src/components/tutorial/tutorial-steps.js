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
  // Étape 2 : Sélecteur d'espace (dans le header)
  {
    target: '[data-tutorial="organization-switcher-header"]',
    content:
      "Ici, vous pouvez voir et changer d'espace de travail. Cliquez pour accéder à vos différentes organisations.",
    placement: "bottom",
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
  // Étape 4 : Navigation principale - Finances
  {
    target: '[data-tutorial="nav-finances"]',
    content:
      "Le menu Finances regroupe vos transactions bancaires synchronisées, vos prévisions et vos mouvements financiers.",
    placement: "right",
    title: "Finances",
  },
  // Étape 5 : Menu utilisateur
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
