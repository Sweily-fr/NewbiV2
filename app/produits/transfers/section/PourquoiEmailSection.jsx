import React from "react";

// Bloc sombre : on nomme les plafonds réels des messageries, juste après
// avoir présenté ce que fait Newbi. Le contraste marque la rupture entre la
// solution et le problème qu'elle remplace.
const LIMITES = [
  {
    chiffre: "25 Mo",
    titre: "La limite de Gmail",
    texte:
      "C'est le poids maximal d'un message, pièces jointes comprises. Au-delà, Google bascule le fichier sur Drive et c'est au destinataire de demander l'accès.",
  },
  {
    chiffre: "20 Mo",
    titre: "Celle d'Outlook.com",
    texte:
      "En entreprise, l'administrateur fixe sa propre limite, souvent entre 25 et 35 Mo. Vous ne la connaissez qu'au moment où l'envoi est refusé.",
  },
  {
    chiffre: "+33 %",
    titre: "Le poids ajouté par l'e-mail",
    texte:
      "Une pièce jointe est réencodée pour voyager dans un message. Un fichier de 20 Mo en pèse près de 27 une fois attaché : la limite tombe plus tôt que prévu.",
  },
  {
    chiffre: "0 %",
    titre: "Ce que gagne le ZIP",
    texte:
      "Vidéos, photos RAW, PSD aplatis, exports PDF haute définition sont déjà compressés. Les regrouper dans une archive ne fait presque rien gagner.",
  },
];

export default function PourquoiEmailSection() {
  return (
    // Le bloc noir est plein cadre, mais l'espace qui le précède reste blanc
    // et suit le rythme vertical des autres sections de la page.
    <section className="pt-10 md:pt-20 lg:pt-22">
      <div
        data-nav-theme="dark"
        className="relative overflow-hidden bg-[#0B0B0C] px-5 py-16 md:py-32 text-white"
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance mb-4">
            Pourquoi vos fichiers ne passent pas par e-mail
          </h2>
          <p className="text-[17px] leading-relaxed text-white/60 max-w-2xl mb-10 md:mb-14">
            Une maquette, un rush vidéo, un dossier de plans : passé quelques
            dizaines de mégaoctets, la messagerie refuse l&apos;envoi — ou pire,
            l&apos;accepte sans que rien n&apos;arrive. Voici où se situent
            réellement les plafonds.
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {LIMITES.map(({ chiffre, titre, texte }) => (
              <div key={titre} className="border-t border-white/15 pt-6">
                <dt>
                  <span className="block text-4xl md:text-5xl font-medium tracking-tight">
                    {chiffre}
                  </span>
                  <span className="mt-3 block text-[17px] font-medium tracking-tight">
                    {titre}
                  </span>
                </dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-white/60">
                  {texte}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 md:mt-12 text-[17px] leading-relaxed text-white/60 max-w-3xl">
            Un lien de téléchargement règle le problème à la racine : le fichier
            ne transite plus par la messagerie, seul le lien voyage. Votre
            destinataire récupère l&apos;original, dans sa qualité
            d&apos;origine, sans rien installer.
          </p>
        </div>
      </div>
    </section>
  );
}
