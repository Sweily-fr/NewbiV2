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
    message.includes("prochain numéro doit être") ||
    // Doublon de numéro : « Le numéro de bon de commande "0007" est déjà
    // utilisé », « Le numéro de facture F-082026 0001 existe déjà ». Le
    // message est tout aussi actionnable, il doit aller sur le champ Numéro
    // plutôt que dans le message d'erreur générique.
    /numéro de (facture|devis|bon de commande|avoir)[^.!?]*?(est déjà utilisé|existe déjà)/i.test(
      message,
    ) ||
    /^ce numéro de (facture|devis|bon de commande|avoir) est déjà utilisé/i.test(
      message,
    )
  );
}

export default isNumberSequenceError;
