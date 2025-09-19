"use client";
import React from "react";
import { Footer7 } from "@/src/components/footer7";

export default function MentionsLegales() {
  return (
    <div className="font-poppins">
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentions Légales</h1>
          
          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Informations légales</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Le site Newbi est édité par la société <strong>Sweily</strong>, SAS au capital de 10 000 euros, 
                immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro <strong>981 576 549</strong>.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li><strong>Siège social :</strong> 229 rue Saint-Honoré, 75001 Paris, France</li>
                <li><strong>Numéro de TVA intracommunautaire :</strong> FR 70 981 576 549</li>
                <li><strong>Directeur de la publication :</strong> Joaquim Gameiro, Président</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Hébergement</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Le site Newbi est hébergé par <strong>OVH SAS</strong>, société au capital de 10 174 560 €, 
                RCS Lille Métropole 424 761 419 00045.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li><strong>Siège social :</strong> 2 rue Kellermann, 59100 Roubaix, France</li>
                <li><strong>Téléphone :</strong> +33 9 72 10 10 07</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Propriété intellectuelle</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                L'ensemble des éléments constituant le site Newbi (textes, graphismes, logiciels, photographies, 
                images, vidéos, sons, plans, logos, marques, etc.) ainsi que le site lui-même, sont la propriété 
                exclusive de Sweily ou de ses partenaires. Ces éléments sont protégés par les lois relatives à la 
                propriété intellectuelle et notamment le droit d'auteur.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Toute reproduction, représentation, utilisation ou adaptation, sous quelque forme que ce soit, 
                de tout ou partie des éléments du site sans l'accord écrit préalable de Sweily est strictement 
                interdite et constituerait un acte de contrefaçon sanctionné par les articles L.335-2 et suivants 
                du Code de la propriété intellectuelle.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Données personnelles</h2>
              <p className="text-gray-600 leading-relaxed">
                Les informations concernant la collecte et le traitement des données personnelles sont détaillées 
                dans notre <a href="/politique-de-confidentialite" className="text-blue-600 hover:text-blue-800 underline">
                Politique de Confidentialité</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                Le site Newbi utilise des cookies pour améliorer l'expérience utilisateur. Pour plus d'informations 
                sur l'utilisation des cookies, veuillez consulter notre <a href="/politique-de-confidentialite" 
                className="text-blue-600 hover:text-blue-800 underline">Politique de Confidentialité</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Liens hypertextes</h2>
              <p className="text-gray-600 leading-relaxed">
                Le site Newbi peut contenir des liens hypertextes vers d'autres sites internet. Sweily n'exerce 
                aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Droit applicable et juridiction compétente</h2>
              <p className="text-gray-600 leading-relaxed">
                Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux 
                français seront seuls compétents.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                Pour toute question concernant les présentes mentions légales, vous pouvez nous contacter à 
                l'adresse suivante : <a href="mailto:contact@newbi.fr" 
                className="text-blue-600 hover:text-blue-800 underline">contact@newbi.fr</a>
              </p>
            </section>
          </div>
        </div>
        </div>
      </div>
      <Footer7 />
    </div>
  );
}
