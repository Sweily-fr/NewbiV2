"use client";
import React from "react";
import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";

// Page publique de procédure de désactivation / suppression de compte Newbi.
// Requis par Google Play (fiche Play Store — Data Safety) et l'article 17 du RGPD.
// L'URL https://www.newbi.fr/supprimer-compte est référencée directement dans
// Google Play Console — ne pas renommer le dossier sans mettre à jour la Console.
//
// Alignée sur le pattern des autres pages légales (mentions-legales,
// politique-de-confidentialite, cgv, cookies) : même chrome (NewHeroNavbar +
// Footer7), même typographie, même structure sections.

export default function SupprimerCompte() {
  return (
    <div className="font-poppins">
      <NewHeroNavbar />
      <div className="min-h-screen bg-gray-50 py-42">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Désactivation et suppression de votre compte Newbi
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Dernière mise à jour : 02 novembre 2026
          </p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <p className="text-gray-600 leading-relaxed mb-4">
                Vous pouvez à tout moment demander la désactivation ou la
                suppression définitive de votre compte Newbi et des données qui
                y sont associées.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cette page décrit la procédure à suivre, les données supprimées
                et celles qui sont conservées conformément à nos obligations
                légales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                1. Désactiver votre compte
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Vous pouvez désactiver votre compte à tout moment depuis
                l'application web. La désactivation suspend l'accès à votre
                compte mais conserve vos données ; vous pouvez demander leur
                suppression définitive à tout moment (voir section 2).
              </p>
              <ol className="list-decimal list-inside text-gray-600 leading-relaxed space-y-2 mb-4">
                <li>
                  Connectez-vous sur{" "}
                  <a
                    href="https://www.newbi.fr"
                    className="text-blue-600 underline"
                  >
                    https://www.newbi.fr
                  </a>
                </li>
                <li>
                  Accédez à <strong>Paramètres</strong> →{" "}
                  <strong>Compte</strong>
                </li>
                <li>
                  Cliquez sur <strong>Désactiver mon compte</strong>
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                2. Supprimer définitivement votre compte et vos données
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Pour demander la suppression définitive de votre compte et des
                données associées, envoyez un email à l'adresse suivante :
              </p>
              <p className="text-gray-800 leading-relaxed mb-4">
                <strong>
                  <a
                    href="mailto:contact@newbi.fr?subject=Demande%20de%20suppression%20de%20compte%20Newbi"
                    className="text-blue-600 underline"
                  >
                    contact@newbi.fr
                  </a>
                </strong>
              </p>
              <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mb-4">
                <li>
                  Envoyez le message depuis l'adresse email associée à votre
                  compte Newbi
                </li>
                <li>
                  Objet du message :{" "}
                  <em>Demande de suppression de compte Newbi</em>
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                Nous traitons votre demande sous 30 jours ouvrés maximum,
                conformément à l'article 17 du Règlement Général sur la
                Protection des Données (RGPD).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                3. Données supprimées
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Sont supprimées de manière définitive lors de la suppression de
                votre compte :
              </p>
              <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mb-4">
                <li>
                  Vos informations d'identification (email, mot de passe,
                  prénom, nom, numéro de téléphone)
                </li>
                <li>
                  Vos données professionnelles (fiche entreprise, logo,
                  coordonnées)
                </li>
                <li>Vos contacts clients et fournisseurs</li>
                <li>
                  Vos brouillons de factures, devis et avoirs non finalisés
                </li>
                <li>Vos projets, tâches et documents partagés</li>
                <li>
                  Vos préférences utilisateur, sessions actives et jetons de
                  notification (push)
                </li>
                <li>
                  Vos justificatifs de dépenses stockés (photos, PDF, scans)
                </li>
                <li>
                  Vos comptes de réseaux sociaux connectés et leurs jetons
                  d'accès, vos posts programmés et leurs images et vidéos
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                4. Données conservées après suppression
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Certaines données sont conservées après votre demande de
                suppression, conformément à nos obligations légales :
              </p>
              <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mb-4">
                <li>
                  <strong>Documents comptables validés</strong> (factures, devis
                  émis) : conservés 10 ans en application de l'article L123-22
                  du Code de commerce français
                </li>
                <li>
                  <strong>Logs de sécurité anonymisés</strong> : conservés 12
                  mois pour la prévention des fraudes et la sécurité de la
                  plateforme
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ces données ne sont plus rattachées à votre identité personnelle
                après suppression du compte.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                5. Vos autres droits RGPD
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Conformément au RGPD, vous disposez également des droits
                d'accès, de rectification, d'opposition et de portabilité de vos
                données. Consultez notre{" "}
                <Link
                  href="/politique-de-confidentialite"
                  className="text-blue-600 underline"
                >
                  Politique de confidentialité
                </Link>{" "}
                pour plus d'informations, ou contactez-nous à{" "}
                <a
                  href="mailto:contact@newbi.fr"
                  className="text-blue-600 underline"
                >
                  contact@newbi.fr
                </a>
                .
              </p>
            </section>

            {/* Ancre donnée à Meta comme « Data deletion instructions URL » */}
            <section id="reseaux-sociaux" className="mb-8 scroll-mt-32">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                6. Réseaux sociaux connectés (Facebook, Instagram, LinkedIn,
                TikTok, X)
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Pour retirer à Newbi l'accès à un compte de réseau social et
                supprimer les données que nous en avons reçues :
              </p>
              <ol className="list-decimal list-inside text-gray-600 leading-relaxed space-y-2 mb-4">
                <li>
                  Connectez-vous sur{" "}
                  <a
                    href="https://www.newbi.fr"
                    className="text-blue-600 underline"
                  >
                    https://www.newbi.fr
                  </a>
                </li>
                <li>
                  Accédez à <strong>Paramètres</strong> →{" "}
                  <strong>Intégrations</strong> → <strong>Applications</strong>{" "}
                  → <strong>Réseaux sociaux</strong> →{" "}
                  <strong>Connexions</strong>
                </li>
                <li>
                  Cliquez sur <strong>Déconnecter</strong> à côté du compte
                  concerné
                </li>
              </ol>
              <p className="text-gray-600 leading-relaxed mb-4">
                Les jetons d'accès du compte sont supprimés immédiatement et ses
                posts pas encore publiés sont annulés. Si vous supprimez votre
                compte Newbi (section 2) et que vous êtes le dernier membre de
                l'espace, ses comptes de réseaux sociaux sont déconnectés, puis
                toutes ses données de réseaux sociaux sont supprimées : comptes
                connectés, posts, images et vidéos.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Vous pouvez aussi retirer l'accès depuis les réglages du réseau.
                Pour Facebook et Instagram, une demande de suppression de vos
                données faite depuis ces réseaux est traitée automatiquement :
                vos comptes sont déconnectés, leurs jetons effacés, et le réseau
                vous donne un code de suivi.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Si vous n'avez plus accès à Newbi, écrivez à{" "}
                <a
                  href="mailto:contact@newbi.fr?subject=Suppression%20des%20donn%C3%A9es%20r%C3%A9seaux%20sociaux"
                  className="text-blue-600 underline"
                >
                  contact@newbi.fr
                </a>{" "}
                depuis l'adresse de votre compte, objet{" "}
                <em>Suppression des données réseaux sociaux</em> : nous traitons
                la demande sous 30 jours.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Le détail des données concernées figure dans notre{" "}
                <Link
                  href="/politique-de-confidentialite#reseaux-sociaux"
                  className="text-blue-600 underline"
                >
                  Politique de confidentialité
                </Link>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Contact
              </h2>
              <p className="text-gray-600 leading-relaxed mb-2">
                <strong>Email :</strong>{" "}
                <a
                  href="mailto:contact@newbi.fr"
                  className="text-blue-600 underline"
                >
                  contact@newbi.fr
                </a>
              </p>
              <p className="text-gray-600 leading-relaxed mb-2">
                <strong>Responsable du traitement :</strong> SWEILY
              </p>
              <p className="text-gray-600 leading-relaxed">
                229 Rue Saint-Honoré, 75001 Paris, France
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer7 />
    </div>
  );
}
