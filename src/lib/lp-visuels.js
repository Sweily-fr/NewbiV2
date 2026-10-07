/* Jetons partagés par les illustrations des cartes de landing page.

   Les visuels sont des encadrés blancs, rentrés par rapport aux bords de leur
   carte et débordant du bas, qui les recadre — le procédé des visuels de la LP
   home (InvoicingTrioSection). Le filet d'un pixel et l'ombre basse et large,
   sans effet de relief, sont ceux des cartes flottantes des heros de LP métier
   (_statuts/StatutHero).

   Ils vivent ici plutôt que dans l'une des sections : plusieurs LP les
   partagent, et deux copies finiraient par diverger. */

export const OMBRE =
  "shadow-[0_1px_2px_rgba(16,16,32,0.04),0_8px_24px_-12px_rgba(16,16,32,0.18)] ring-1 ring-black/[0.06]";

export const SHEET = `absolute left-12 right-8 -bottom-6 rounded-2xl bg-white overflow-hidden ${OMBRE}`;

// Zone qui accueille le visuel : elle prend la hauteur restante sous le texte
// et annule le padding latéral de la carte, pour que l'encadré se place par
// rapport aux bords de celle-ci.
export const VISUEL = "relative flex-1 min-h-[185px] mt-7 -mx-7 md:-mx-8";

// Encadré des cartes « l'essentiel » (LpEssentials) : il prend toute la
// largeur de la zone et s'arrête sur le padding bas de la carte. Il ne
// déborde pas, contrairement aux encadrés des bentos : ces cartes-là sont
// étroites, et un encadré coupé net au ras du bord y paraissait collé.
export const SHEET_ESSENTIEL = "absolute inset-x-0 bottom-0";
