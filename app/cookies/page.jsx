"use client";
import React, { useState } from "react";
import { useCookieConsent } from "@/src/hooks/useCookieConsent";
import { Button } from "@/src/components/ui/button";
import Footer7 from "@/src/components/footer7";
import CookiePreferencesModal from "@/src/components/cookies/CookiePreferencesModal";

// Métadonnées pour rendre la page non-indexable
export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function CookiesPage() {
  const { openCookieSettings } = useCookieConsent();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="font-poppins">
      <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestion des Cookies</h1>
          
          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">À propos des cookies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Les cookies sont de petits fichiers texte stockés sur votre appareil lorsque vous visitez notre site web. 
                Ils nous aident à améliorer votre expérience de navigation et à fournir des services personnalisés.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Types de cookies que nous utilisons</h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Cookies nécessaires</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés. 
                    Ils permettent d'assurer la sécurité du site et de mémoriser vos préférences de base.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Cookies fonctionnels</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Ces cookies permettent d'améliorer les fonctionnalités et la personnalisation de votre 
                    expérience sur notre site.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Cookies analytiques</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Ces cookies nous aident à comprendre comment vous utilisez notre site pour l'améliorer. 
                    Ils collectent des informations anonymes sur votre navigation.
                  </p>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Cookies marketing</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Ces cookies sont utilisés pour vous proposer des publicités personnalisées et mesurer 
                    l'efficacité de nos campagnes publicitaires.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Gérer vos préférences</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Vous pouvez à tout moment modifier vos préférences de cookies en cliquant sur le bouton ci-dessous. 
                Cela ouvrira le centre de préférences où vous pourrez activer ou désactiver différents types de cookies.
              </p>
              
              <Button onClick={() => setShowModal(true)} className="mb-6">
                Gérer mes préférences de cookies
              </Button>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contrôle via votre navigateur</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Vous pouvez également contrôler les cookies directement via les paramètres de votre navigateur :
              </p>
              <ul className="text-gray-600 space-y-2">
                <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies et autres données de site</li>
                <li><strong>Firefox :</strong> Paramètres → Vie privée et sécurité → Cookies et données de sites</li>
                <li><strong>Safari :</strong> Préférences → Confidentialité → Gérer les données de site web</li>
                <li><strong>Edge :</strong> Paramètres → Cookies et autorisations de site → Cookies et données stockées</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                Si vous avez des questions concernant notre utilisation des cookies, n'hésitez pas à nous contacter à{" "}
                <a href="mailto:contact@newbi.fr" className="text-blue-600 hover:text-blue-800 underline">
                  contact@newbi.fr
                </a>
              </p>
            </section>
          </div>
        </div>
        </div>
      </div>
      <Footer7 />
      <CookiePreferencesModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
