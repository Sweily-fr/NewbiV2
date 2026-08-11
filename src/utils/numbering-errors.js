/**
 * Reconnaît les refus de numérotation renvoyés par l'API
 * (validateNumberSequence côté newbi-api) : recul dans la séquence ou trou.
 *
 * Ces messages sont déjà rédigés pour l'utilisateur et disent quel est le
 * dernier numéro utilisé et lequel est attendu, par exemple :
 *   La dernière facture avec le préfixe "F-082026" est la 0012. Il y a un trou
 *   dans la séquence : le prochain numéro doit être 0013.
 *
 * Les éditeurs s'en servent pour poser l'erreur sur le champ Numéro du
 * document plutôt que de la laisser filer dans le message d'erreur générique.
 */
export function isNumberSequenceError(message) {
  if (!message) return false;
  return (
    message.includes("dans la séquence") ||
    message.includes("prochain numéro doit être")
  );
}

export default isNumberSequenceError;
