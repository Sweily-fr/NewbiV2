// Numéro de téléphone du profil (Paramètres > Compte) : chiffres, espaces,
// points, tirets, parenthèses et un « + » initial ; de 6 à 15 chiffres
// (longueur maximale d'un numéro international).
const PHONE_CHARACTERS = /^\+?[0-9 ().-]+$/;

export function normalizeAccountPhone(value) {
  const phone = typeof value === "string" ? value.trim() : "";
  const digits = phone.replace(/\D/g, "");
  if (
    !PHONE_CHARACTERS.test(phone) ||
    digits.length < 6 ||
    digits.length > 15
  ) {
    return null;
  }
  return phone;
}
