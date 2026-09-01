/**
 * Dérive le régime de TVA SuperPDP (monthly|quarterly|simplified|vat_exemption)
 * depuis les informations légales de l'organisation. Il pilote la fréquence
 * d'envoi e-reporting au PPF côté SuperPDP.
 *
 * Retourne null quand la situation TVA n'est pas explicitement déclarée :
 * la franchise en base (art. L. 223-3 du CIBS) doit être cochée, un simple
 * « non assujetti » ne suffit pas.
 */
export function deriveVatRegime(org) {
  if (!org) return null;

  if (org.isVatSubject === true) {
    switch (org.vatRegime) {
      case "reel-simplifie":
        return "simplified";
      case "reel-normal":
        if (org.vatFrequency === "trimestriel") return "quarterly";
        // Réel normal sans fréquence explicite = déclaration mensuelle (défaut CGI).
        return "monthly";
      default:
        return null;
    }
  }

  if (org.vatFranchise === true) return "vat_exemption";

  return null;
}
