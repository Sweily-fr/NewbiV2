/** Taux par défaut des frais de port, comme le schéma côté API. */
export const DEFAULT_SHIPPING_VAT_RATE = 20;

/**
 * Taux de TVA des frais de port : le taux par défaut seulement quand il est
 * absent ou illisible. Un `|| 20` transformait un port à 0 % en port à 20 %
 * (affichage, totaux de l'aperçu, et même valeur enregistrée par les éditeurs).
 */
export const shippingVatRateOf = (value) => {
  const rate = parseFloat(value);
  return Number.isFinite(rate) ? rate : DEFAULT_SHIPPING_VAT_RATE;
};
