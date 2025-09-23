"use client";
import React from "react";
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Politique de Confidentialité</h1>
          <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : 06 mai 2025</p>
          
          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Newbi s'engage à protéger votre vie privée et vos données personnelles. Cette politique de 
                confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos 
                informations lorsque vous utilisez notre site web et nos services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                En utilisant notre site et nos services, vous consentez à la collecte et à l'utilisation de 
                vos informations conformément à cette politique de confidentialité.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Informations que nous collectons</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Nous collectons les types d'informations suivants :
              </p>
              
              <h3 className="text-xl font-semibold text-gray-700 mb-3">2.1 Informations que vous nous fournissez</h3>
              <ul className="text-gray-600 space-y-2 mb-6">
                <li><strong>Informations de compte :</strong> nom, prénom, adresse email, mot de passe lors de la création d'un compte.</li>
                <li><strong>Informations de profil :</strong> photo de profil, numéro de téléphone, adresse postale.</li>
                <li><strong>Informations d'entreprise :</strong> nom de l'entreprise, numéro SIRET, numéro de TVA, logo, adresse.</li>
                <li><strong>Informations de paiement :</strong> lors de la souscription à nos services premium, nous collectons les informations nécessaires au traitement du paiement via notre prestataire de paiement sécurisé.</li>
                <li><strong>Contenu généré :</strong> factures, devis, et autres documents que vous créez en utilisant nos services.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-700 mb-3">2.2 Informations collectées automatiquement</h3>
              <ul className="text-gray-600 space-y-2">
                <li><strong>Données d'utilisation :</strong> pages visitées, temps passé sur le site, actions effectuées.</li>
                <li><strong>Informations techniques :</strong> adresse IP, type de navigateur, appareil utilisé, système d'exploitation.</li>
                <li><strong>Cookies et technologies similaires :</strong> nous utilisons des cookies pour améliorer votre expérience sur notre site.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Comment nous utilisons vos informations</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Nous utilisons vos informations pour les finalités suivantes :
              </p>
              <ul className="text-gray-600 space-y-2">
                <li>Fournir, maintenir et améliorer nos services.</li>
                <li>Traiter vos paiements et gérer votre abonnement.</li>
                <li>Vous envoyer des informations techniques, des mises à jour et des messages de support.</li>
                <li>Vous envoyer des communications marketing (avec votre consentement).</li>
                <li>Détecter, prévenir et résoudre les problèmes techniques et de sécurité.</li>
                <li>Respecter nos obligations légales.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Partage de vos informations</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Nous ne vendons pas vos données personnelles à des tiers. Nous pouvons partager vos informations 
                dans les situations suivantes :
              </p>
              <ul className="text-gray-600 space-y-2">
                <li>Avec des prestataires de services qui nous aident à fournir nos services (hébergement, traitement des paiements, support client).</li>
                <li>Pour se conformer à la loi, à une procédure judiciaire ou à une demande gouvernementale.</li>
                <li>Pour protéger nos droits, notre propriété ou notre sécurité, ainsi que ceux de nos utilisateurs ou du public.</li>
                <li>Dans le cadre d'une fusion, acquisition ou vente d'actifs, auquel cas nous vous en informerons.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Conservation des données</h2>
              <p className="text-gray-600 leading-relaxed">
                Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services 
                et respecter nos obligations légales. Si vous supprimez votre compte, nous supprimerons ou 
                anonymiserons vos données personnelles, sauf si nous devons les conserver pour des raisons légales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Sécurité des données</h2>
              <p className="text-gray-600 leading-relaxed">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour 
                protéger vos données personnelles contre la perte, l'accès non autorisé, la divulgation, 
                l'altération et la destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Vos droits</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits 
                suivants concernant vos données personnelles :
              </p>
              <ul className="text-gray-600 space-y-2 mb-4">
                <li><strong>Droit d'accès :</strong> vous pouvez demander une copie de vos données personnelles.</li>
                <li><strong>Droit de rectification :</strong> vous pouvez demander la correction de données inexactes.</li>
                <li><strong>Droit à l'effacement :</strong> vous pouvez demander la suppression de vos données dans certaines circonstances.</li>
                <li><strong>Droit à la limitation du traitement :</strong> vous pouvez demander de limiter l'utilisation de vos données.</li>
                <li><strong>Droit à la portabilité des données :</strong> vous pouvez demander le transfert de vos données à un autre service.</li>
                <li><strong>Droit d'opposition :</strong> vous pouvez vous opposer au traitement de vos données dans certaines circonstances.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                Pour exercer ces droits, veuillez nous contacter à <a href="mailto:contact@newbi.fr" 
                className="text-blue-600 hover:text-blue-800 underline">contact@newbi.fr</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience sur 
                notre site, analyser notre trafic et personnaliser notre contenu. Vous pouvez contrôler 
                l'utilisation des cookies via les paramètres de votre navigateur.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Modifications de notre politique de confidentialité</h2>
              <p className="text-gray-600 leading-relaxed">
                Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous 
                informerons de tout changement important en publiant la nouvelle politique de confidentialité 
                sur cette page et en vous envoyant un email si nécessaire.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à :
              </p>
              <div className="mt-4 text-gray-600">
                <p><a href="mailto:contact@newbi.fr" className="text-blue-600 hover:text-blue-800 underline">contact@newbi.fr</a></p>
                <p className="mt-2">
                  <strong>Sweily</strong><br />
                  229 rue Saint-Honoré<br />
                  75001 Paris, France
                </p>
              </div>
            </section>
          </div>
        </div>
        </div>
      </div>
      <Footer7 />
      </div>
    </>
  );
}
