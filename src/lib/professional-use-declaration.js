/**
 * Déclaration d'usage professionnel acceptée en terminant l'inscription.
 *
 * Affichée sous le bouton « Continuer » de l'étape entreprise : cliquer vaut
 * acceptation, sans case à cocher (moins de friction pour qui veut essayer,
 * entreprise existante ou en création). Le serveur garde la trace de
 * l'acceptation (date, IP, navigateur) avec ce texte exact : c'est elle qui
 * rattache le compte à une activité professionnelle (règle App Store
 * 3.1.3(c)), avec le SIRET quand il est fourni.
 */
export const PROFESSIONAL_USE_STATEMENT =
  "En continuant, vous confirmez utiliser Newbi pour une activité professionnelle, existante ou en cours de création.";
