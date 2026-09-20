// Constantes partagées par toutes les landing pages Ads.
// `SIGNUP_HREF` est la seule destination de tous les CTA : on garde la LP à
// une sortie possible (hors liens légaux du mini-footer).
export const SIGNUP_HREF = "/auth/signup";

export const CTA_LABEL = "Commencer gratuitement";
export const CTA_SUBLABEL = "30 jours offerts · sans carte bancaire";

// Témoignages clients affichés sur les LP. `image` : portrait affiché par le
// carrousel (Mustafa : photo réelle ; les deux autres sont des portraits
// d'illustration en attendant les vraies photos).
export const REVIEWS = [
  {
    text: "Tout est automatisé et professionnel. Un vrai gain de temps pour mon entreprise de bâtiment.",
    name: "Mustafa G.",
    role: "Artisan BTP",
    image: "/lp/factures/41682668-4F07-4D9F-B672-DC469853793A.PNG",
  },
  {
    text: "Interface facile à utiliser. Service client hyperréactif. Rapport qualité/prix excellent.",
    name: "Maëva M.",
    role: "Graphiste",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=900&auto=format&fit=crop&q=60",
  },
  {
    text: "Le logiciel est indispensable pour une bonne gestion, très facile à prendre en main.",
    name: "Pedro Ds.",
    role: "Commerçant",
    image:
      "https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?w=900&auto=format&fit=crop&q=60",
  },
];
