// Les noms Meta utilisés dans le code sont traduits vers les événements
// standards TikTok. Un nom inconnu est envoyé tel quel (événement custom).
const META_TO_TIKTOK_EVENT = {
  Purchase: "CompletePayment",
  Lead: "Lead",
  Contact: "Contact",
  CompleteRegistration: "CompleteRegistration",
  ViewContent: "ViewContent",
  Search: "Search",
  ClickButton: "ClickButton",
  SubmitForm: "SubmitForm",
  Subscribe: "Subscribe",
  InitiateCheckout: "InitiateCheckout",
};

export function toTikTokEventName(eventName) {
  return META_TO_TIKTOK_EVENT[eventName] || eventName;
}
