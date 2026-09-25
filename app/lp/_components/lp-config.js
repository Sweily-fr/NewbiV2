// Constantes partagées par toutes les landing pages Ads.
// `SIGNUP_HREF` est la seule destination de tous les CTA : on garde la LP à
// une sortie possible (hors liens légaux du mini-footer).
export const SIGNUP_HREF = "/auth/signup";

export const CTA_LABEL = "Commencer gratuitement";
export const CTA_SUBLABEL = "30 jours offerts · sans carte bancaire";

// Témoignages clients affichés sur les LP. `image` : portrait affiché par le
// carrousel (photos réelles des clients). L'ordre est celui d'affichage.
export const REVIEWS = [
  {
    text: "Super expérience ! Interface hyper simple, très bon rapport qualité-prix et service client vraiment réactif. Je recommande !",
    name: "Maëva M.",
    role: "Graphiste",
    image: "/lp/avis/maeva.jpg",
  },
  {
    text: "Le logiciel est indispensable pour une bonne gestion, très facile à prendre en main.",
    name: "Pedro Ds.",
    role: "Commerçant",
    image: "/lp/avis/pedro.jpg",
  },
  {
    text: "Tout est automatisé et professionnel. Un vrai gain de temps pour mon entreprise de bâtiment.",
    name: "Mustafa G.",
    role: "Artisan BTP",
    image: "/lp/factures/41682668-4F07-4D9F-B672-DC469853793A.PNG",
  },
];
