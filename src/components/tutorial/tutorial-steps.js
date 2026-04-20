// Tutoriel simplifié : tooltips centrés uniquement, sans cible DOM.
// Évite les blocages quand un élément de la sidebar / du header n'est pas
// rendu (orga en loading, écran mobile, rôles sans Dashboard, etc.).

export const tutorialSteps = [
  {
    target: "body",
    content:
      "Bienvenue sur Newbi ! 👋 Laissez-nous vous guider rapidement à travers votre espace de travail.",
    placement: "center",
    disableBeacon: true,
    title: "Bienvenue sur Newbi",
  },
  {
    target: "body",
    content:
      "En haut à gauche, le sélecteur d'espace vous permet de basculer entre vos différentes organisations.",
    placement: "center",
    disableBeacon: true,
    title: "Sélecteur d'espace",
  },
  {
    target: "body",
    content:
      "Dans la barre latérale, retrouvez votre Dashboard, vos Finances, vos documents (factures, devis, bons de commande) et vos outils.",
    placement: "center",
    disableBeacon: true,
    title: "Navigation principale",
  },
  {
    target: "body",
    content:
      "En bas de la sidebar, cliquez sur votre avatar pour accéder à votre profil, votre abonnement, le thème et la déconnexion.",
    placement: "center",
    disableBeacon: true,
    title: "Menu utilisateur",
  },
  {
    target: "body",
    content:
      "🎉 Vous êtes prêt ! Vous pouvez relancer ce tutoriel à tout moment depuis les paramètres.",
    placement: "center",
    disableBeacon: true,
    title: "C'est parti !",
  },
];
