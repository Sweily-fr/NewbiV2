"use client";
import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import SEOHead from "@/src/components/seo/seo-head";
import { JsonLd } from "@/src/components/seo/seo-metadata";
import { useLegalSEO } from "@/src/hooks/use-seo";

export default function PolitiqueDeConfidentialite() {
  const seoData = useLegalSEO("politique-de-confidentialite");

  return (
    <>
      <SEOHead {...seoData} />
      <JsonLd jsonLd={seoData.jsonLd} />
      <div className="font-poppins">
        <NewHeroNavbar />
        <div className="min-h-screen bg-gray-50 py-42">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              Dernière mise à jour : 02 novembre 2026
            </p>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Newbi s'engage à protéger votre vie privée et vos données
                  personnelles. Cette politique de confidentialité explique
                  comment nous collectons, utilisons, partageons et protégeons
                  vos informations lorsque vous utilisez notre site web et nos
                  services.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Le responsable du traitement est SWEILY SAS, éditrice de
                  Newbi, 229 rue Saint-Honoré, 75001 Paris, immatriculée au RCS
                  de Paris sous le numéro 981 576 549.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  En utilisant notre site et nos services, vous consentez à la
                  collecte et à l'utilisation de vos informations conformément à
                  cette politique de confidentialité.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  2. Informations que nous collectons
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Nous collectons les types d'informations suivants :
                </p>

                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  2.1 Informations que vous nous fournissez
                </h3>
                <ul className="text-gray-600 space-y-2 mb-6">
                  <li>
                    <strong>Informations de compte :</strong> nom, prénom,
                    adresse email, mot de passe lors de la création d'un compte.
                  </li>
                  <li>
                    <strong>Informations de profil :</strong> photo de profil,
                    numéro de téléphone, adresse postale.
                  </li>
                  <li>
                    <strong>Informations d'entreprise :</strong> nom de
                    l'entreprise, numéro SIRET, numéro de TVA, logo, adresse.
                  </li>
                  <li>
                    <strong>Informations de paiement :</strong> lors de la
                    souscription à nos services premium, nous collectons les
                    informations nécessaires au traitement du paiement via notre
                    prestataire de paiement sécurisé.
                  </li>
                  <li>
                    <strong>Contenu généré :</strong> factures, devis, et autres
                    documents que vous créez en utilisant nos services.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  2.2 Informations collectées automatiquement
                </h3>
                <ul className="text-gray-600 space-y-2">
                  <li>
                    <strong>Données d'utilisation :</strong> pages visitées,
                    temps passé sur le site, actions effectuées.
                  </li>
                  <li>
                    <strong>Informations techniques :</strong> adresse IP, type
                    de navigateur, appareil utilisé, système d'exploitation.
                  </li>
                  <li>
                    <strong>Cookies et technologies similaires :</strong> nous
                    utilisons des cookies pour améliorer votre expérience sur
                    notre site.
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  3. Comment nous utilisons vos informations
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Nous utilisons vos informations pour les finalités suivantes :
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li>Fournir, maintenir et améliorer nos services.</li>
                  <li>Traiter vos paiements et gérer votre abonnement.</li>
                  <li>
                    Vous envoyer des informations techniques, des mises à jour
                    et des messages de support.
                  </li>
                  <li>
                    Vous envoyer des communications marketing (avec votre
                    consentement).
                  </li>
                  <li>
                    Détecter, prévenir et résoudre les problèmes techniques et
                    de sécurité.
                  </li>
                  <li>Respecter nos obligations légales.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  4. Partage de vos informations
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Nous ne vendons pas vos données personnelles à des tiers. Nous
                  pouvons partager vos informations dans les situations
                  suivantes :
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li>
                    Avec des prestataires de services qui nous aident à fournir
                    nos services : hébergement et stockage (OVH, MongoDB Atlas,
                    Cloudflare, Vercel), traitement des paiements, support
                    client.
                  </li>
                  <li>
                    Avec les réseaux sociaux que vous avez connectés, uniquement
                    pour publier les posts que vous avez programmés (voir la
                    section 5).
                  </li>
                  <li>
                    Pour se conformer à la loi, à une procédure judiciaire ou à
                    une demande gouvernementale.
                  </li>
                  <li>
                    Pour protéger nos droits, notre propriété ou notre sécurité,
                    ainsi que ceux de nos utilisateurs ou du public.
                  </li>
                  <li>
                    Dans le cadre d'une fusion, acquisition ou vente d'actifs,
                    auquel cas nous vous en informerons.
                  </li>
                </ul>
              </section>

              <section id="reseaux-sociaux" className="mb-8 scroll-mt-32">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  5. Réseaux sociaux connectés
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Newbi vous permet de connecter vos comptes Facebook,
                  Instagram, LinkedIn, TikTok et X pour programmer des
                  publications depuis vos tableaux. Cette section ne s'applique
                  que si vous utilisez cette fonctionnalité.
                </p>

                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  5.1 Données reçues des réseaux
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Avec votre accord, donné sur l'écran d'autorisation de chaque
                  réseau, nous recevons :
                </p>
                <ul className="text-gray-600 space-y-2 mb-6">
                  <li>
                    l'identifiant technique, le nom, le nom d'utilisateur et,
                    s'il y en a une, l'adresse de la photo de profil du compte
                    ou de la page que vous connectez ;
                  </li>
                  <li>
                    pour Facebook et LinkedIn, la liste des pages que vous gérez
                    et, pour Instagram connecté via Facebook, le compte
                    Instagram relié à chacune de vos pages Facebook, afin que
                    vous choisissiez ceux à connecter ;
                  </li>
                  <li>
                    pour TikTok, les réglages de publication du compte
                    (confidentialité, commentaires, duos et collages autorisés,
                    durée maximale des vidéos) ;
                  </li>
                  <li>
                    pour Instagram (connexion via Facebook) et TikTok Business,
                    la liste des sons tendance proposés par le réseau, quand
                    vous choisissez un son ;
                  </li>
                  <li>
                    des jetons d'accès, qui permettent à Newbi de publier en
                    votre nom.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  5.2 Utilisation de ces données
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Nous utilisons ces données uniquement pour publier les posts
                  que vous avez rédigés et programmés dans Newbi (à l'heure que
                  vous avez choisie, ou en brouillon dans l'application TikTok
                  si vous le demandez), pour vous indiquer sur quel compte un
                  post sera publié et pour afficher son statut (programmé,
                  publié, en échec) avec un lien vers la publication.
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Newbi ne lit pas vos messages, commentaires, abonnés ni
                  statistiques, ne publie rien sans votre action et ne vend ni
                  ne partage ces données à des fins publicitaires.
                </p>

                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  5.3 Contenu de vos posts
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Le texte, les images, les vidéos et le son de votre post sont
                  transmis au réseau choisi au moment de la publication. Une
                  fois publiés, ils relèvent des règles de ce réseau. Les images
                  et vidéos sont stockées chez notre prestataire de stockage
                  (Cloudflare) et servies par notre serveur à une adresse
                  impossible à deviner, pour que le réseau puisse les récupérer.
                  Elles sont conservées tant que la carte du post existe, et
                  supprimées de notre stockage dans les minutes qui suivent la
                  suppression de la carte, de sa colonne ou du tableau (après la
                  fin d'une publication en cours). Une image ou une vidéo
                  envoyée sans être utilisée, ou retirée d'un post, est
                  supprimée au bout de 7 jours.
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Newbi ne supprime pas les publications déjà en ligne : pour
                  retirer une publication, supprimez-la depuis le réseau.
                </p>

                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  5.4 Sécurité et conservation
                </h3>
                <ul className="text-gray-600 space-y-2 mb-6">
                  <li>
                    Les jetons d'accès sont chiffrés et ne sont jamais affichés.
                  </li>
                  <li>
                    Le nom, le nom d'utilisateur et la photo des comptes
                    connectés sont relus auprès du réseau au moins toutes les
                    quatre semaines, tant que le compte reste connecté.
                  </li>
                  <li>
                    Quand vous déconnectez un compte (Paramètres &gt;
                    Intégrations &gt; Applications &gt; Réseaux sociaux &gt;
                    Connexions &gt; Déconnecter), ses jetons sont effacés
                    immédiatement, l'accès est révoqué auprès de TikTok et de X,
                    et ses posts pas encore publiés sont annulés. Le nom du
                    compte reste affiché sur les posts de vos tableaux tant que
                    vous les conservez.
                  </li>
                  <li>
                    Si vous supprimez votre compte Newbi et que vous êtes le
                    dernier membre de l'espace, tous ses comptes de réseaux
                    sociaux sont déconnectés de la même façon, et les images et
                    vidéos de ses posts sont supprimées de notre stockage.
                  </li>
                  <li>
                    L'identifiant et le lien des posts publiés restent attachés
                    à la carte du tableau tant que vous la conservez.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  5.5 Retirer l'accès depuis le réseau
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Vous pouvez aussi retirer l'accès de Newbi depuis les réglages
                  de chaque réseau (applications ou intégrations
                  professionnelles autorisées). Pour Facebook et Instagram,
                  Newbi en est informé automatiquement : vos comptes sont
                  déconnectés et leurs jetons effacés. Une demande de
                  suppression de vos données faite depuis Facebook ou Instagram
                  est traitée de la même façon, avec un code de suivi. Pour les
                  autres réseaux, déconnectez aussi le compte dans Newbi pour
                  effacer ses jetons.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  L'utilisation des données issues de ces réseaux respecte leurs
                  conditions pour les développeurs (Meta Platform Terms,
                  LinkedIn API Terms of Use, TikTok Developer Terms of Service,
                  X Developer Agreement).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  6. Conservation des données
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Nous conservons vos données personnelles aussi longtemps que
                  nécessaire pour fournir nos services et respecter nos
                  obligations légales. Si vous supprimez votre compte, nous
                  supprimerons ou anonymiserons vos données personnelles, sauf
                  si nous devons les conserver pour des raisons légales.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  7. Sécurité des données
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Nous mettons en œuvre des mesures de sécurité techniques et
                  organisationnelles appropriées pour protéger vos données
                  personnelles contre la perte, l'accès non autorisé, la
                  divulgation, l'altération et la destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  8. Vos droits
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Conformément au Règlement Général sur la Protection des
                  Données (RGPD), vous disposez des droits suivants concernant
                  vos données personnelles :
                </p>
                <ul className="text-gray-600 space-y-2 mb-4">
                  <li>
                    <strong>Droit d'accès :</strong> vous pouvez demander une
                    copie de vos données personnelles.
                  </li>
                  <li>
                    <strong>Droit de rectification :</strong> vous pouvez
                    demander la correction de données inexactes.
                  </li>
                  <li>
                    <strong>Droit à l'effacement :</strong> vous pouvez demander
                    la suppression de vos données dans certaines circonstances.
                  </li>
                  <li>
                    <strong>Droit à la limitation du traitement :</strong> vous
                    pouvez demander de limiter l'utilisation de vos données.
                  </li>
                  <li>
                    <strong>Droit à la portabilité des données :</strong> vous
                    pouvez demander le transfert de vos données à un autre
                    service.
                  </li>
                  <li>
                    <strong>Droit d'opposition :</strong> vous pouvez vous
                    opposer au traitement de vos données dans certaines
                    circonstances.
                  </li>
                </ul>
                <p className="text-gray-600 leading-relaxed">
                  Pour exercer ces droits, veuillez nous contacter à{" "}
                  <a
                    href="mailto:contact@newbi.fr"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    contact@newbi.fr
                  </a>
                  .
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  9. Cookies
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Nous utilisons des cookies et des technologies similaires pour
                  améliorer votre expérience sur notre site, analyser notre
                  trafic et personnaliser notre contenu. À l'exception des
                  cookies strictement nécessaires, aucun cookie n'est déposé
                  sans votre consentement préalable.
                </p>
                <ul className="list-disc list-inside text-gray-600 leading-relaxed mt-4 space-y-2">
                  <li>
                    <strong>Cookies nécessaires :</strong> indispensables au
                    fonctionnement du site, ils ne peuvent pas être désactivés.
                  </li>
                  <li>
                    <strong>Cookies fonctionnels :</strong> améliorent les
                    fonctionnalités et la personnalisation, et permettent
                    l'affichage de services et widgets tiers, notamment le
                    widget d'avis clients <strong>Trustpilot</strong>{" "}
                    (Trustpilot A/S), qui peut déposer ses propres cookies tiers
                    lorsque vous y consentez.
                  </li>
                  <li>
                    <strong>Cookies analytiques :</strong> nous aident à
                    comprendre l'utilisation du site afin de l'améliorer.
                  </li>
                  <li>
                    <strong>Cookies marketing :</strong> utilisés pour mesurer
                    l'efficacité de nos campagnes et personnaliser la publicité.
                  </li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Vous pouvez à tout moment accepter, refuser ou modifier vos
                  préférences par catégorie via notre gestionnaire de
                  consentement, ainsi que contrôler l'utilisation des cookies
                  via les paramètres de votre navigateur.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  10. Modifications de notre politique de confidentialité
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Nous pouvons mettre à jour cette politique de confidentialité
                  de temps à autre. Nous vous informerons de tout changement
                  important en publiant la nouvelle politique de confidentialité
                  sur cette page et en vous envoyant un email si nécessaire.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  11. Contact
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Si vous avez des questions concernant cette politique de
                  confidentialité, veuillez nous contacter à :
                </p>
                <div className="mt-4 text-gray-600">
                  <p>
                    <a
                      href="mailto:contact@newbi.fr"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      contact@newbi.fr
                    </a>
                  </p>
                  <p className="mt-2">
                    <strong>Sweily</strong>
                    <br />
                    229 rue Saint-Honoré
                    <br />
                    75001 Paris, France
                  </p>
                </div>
              </section>

              <div className="mt-16 pt-8 border-t border-gray-300">
                <p className="text-sm text-gray-500 text-center">
                  Cette politique de confidentialité peut être modifiée à tout
                  moment. La version en vigueur est celle publiée sur cette
                  page.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer7 />
      </div>
    </>
  );
}
