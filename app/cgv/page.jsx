"use client";
import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import SEOHead from "@/src/components/seo/seo-head";
import { JsonLd } from "@/src/components/seo/seo-metadata";
import { useSEO } from "@/src/hooks/use-seo";

export default function CGVPage() {
  const seoData = useSEO("cgv");

  return (
    <>
      <SEOHead {...seoData} />
      <JsonLd jsonLd={seoData.jsonLd} />
      <div className="font-poppins">
        <NewHeroNavbar />
        <div className="min-h-screen bg-gray-50 py-42">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Conditions Générales de Vente</h1>
          <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          
          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 1. PRESENTATION DE LA PLATEFORME</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                La plateforme Newbi, éditée par Sweily, immatriculée sous le numéro SIREN 981576549 dont le siège social est situé à 229 rue Saint-Honoré, 75001 Paris, propose des outils de gestion d'entreprise à destination des indépendants et TPE, accessible via le site www.newbi.fr (ci-après, « la Plateforme » ou « Newbi »).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 2. OBJET</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Les présentes CGV ont pour objet de définir les conditions et modalités de mise à disposition et d'utilisation des services proposés sur la Plateforme. Toute commande ou souscription à un service implique l'adhésion pleine et entière du client (ci-après « l'Utilisateur ») aux présentes CGV.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 3. SERVICES PROPOSES</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Newbi propose, sans que cette liste soit exhaustive :
              </p>
              <ul className="text-gray-600 space-y-2 mb-4">
                <li>- Gestion et création de factures et devis,</li>
                <li>- Génération de signatures de mail,</li>
                <li>- Optimisation SEO d'articles,</li>
                <li>- Génération de mentions légales et politique de confidentialité.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 4. ACCES ET UTILISATION DES SERVICES</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                L'accès aux Services nécessite la création d'un compte utilisateur. L'utilisateur s'engage à fournir des informations exactes et à les maintenir à jour.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 5. TARIFS ET MODALITES DE PAIEMENT</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                L'Utilisateur bénéficie d'un essai gratuit de 30 jours. À l'issue de cette période, l'accès aux services est facturé 14,99€/mois, sans engagement. La résiliation peut intervenir à tout moment ; l'Utilisateur continuera à profiter des Services jusqu'à la date de fin de son mois d'abonnement. Aucun remboursement partiel ne pourra être exigé.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 6. RESPONSABILITE</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Newbi met à disposition des outils facilitant la création de documents (factures, devis, mentions légales, politiques de confidentialité, etc.), mais ne saurait en aucun cas être tenu responsable des conséquences directes ou indirectes résultant d'erreurs, omissions, inexactitudes ou non-conformité de ces documents.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4 italic">
                Il appartient à l'Utilisateur de vérifier, relire et valider les documents générés par la Plateforme auprès d'un professionnel compétent.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Sweily décline toute responsabilité quant à l'utilisation qui pourrait être faite des outils et documents générés.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 7. LIMITATION DE RESPONSABILITE</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                En aucun cas, Sweily, ses dirigeants, employés ou partenaires ne pourront être tenus responsables pour tout dommage direct ou indirect, matériel ou immatériel, découlant de l'utilisation des Services, y compris la perte de bénéfices, perte de données, préjudices commerciaux ou toute autre perte, même si Sweily a été informée de la possibilité de tels dommages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 8. OBLIGATIONS DE L'UTILISATEUR</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                L'Utilisateur s'engage à :
              </p>
              <ul className="text-gray-600 space-y-2 mb-4">
                <li>- Respecter la réglementation applicable,</li>
                <li>- Vérifier et valider l'exactitude et la conformité des documents générés,</li>
                <li>- Ne pas utiliser la Plateforme à des fins illégales ou contraires aux CGV.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 9. DONNEES PERSONNELLES ET CONFIDENTIALITE</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Certaines données sont susceptibles d'être conservées pendant une durée de six (6) ans conformément à la législation en vigueur. Pour plus de détails, consulter la Politique de Confidentialité de Newbi.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 10. DUREE, RESILIATION</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Les CGV sont applicables dès acceptation par l'Utilisateur et restent en vigueur tant que celui-ci utilise les Services. L'Utilisateur peut résilier son accès aux Services à tout moment via son espace personnel.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 11. PROPRIETE INTELLECTUELLE</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Toutes les marques, logos, textes, présentations, illustrations, photographies et documents, structure et mises en forme, sont la propriété exclusive de Sweily ou de ses partenaires. Toute reproduction, diffusion ou utilisation sans accord préalable est strictement interdite.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 12. MODIFICATIONS DES CGV</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Sweily se réserve la possibilité de modifier, à tout moment, tout ou partie des présentes CGV. Les Utilisateurs seront informés des modifications, qui prendront effet à compter de leur publication en ligne.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 13. DROIT APPLICABLE ET JURIDICTION COMPETENTE</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Les présentes CGV sont régies par la loi française. Toute contestation ou litige relatif à la validité, l'interprétation ou l'exécution des présentes CGV sera, à défaut pour les parties d'avoir trouvé un accord amiable dans un délai de 20 jours maximum, de la compétence exclusive des tribunaux de Paris.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 14 - PROTECTION DES DONNEES A CARACTERE PERSONNEL (RGPD)</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Dans le cadre de leur relation instaurée par les présentes CGV les parties s'engagent mutuellement à respecter la réglementation en vigueur applicable aux traitements de données à caractère personnel et en particulier le règlement UE 2016/679 du Parlement européen et du Conseil du 27 avril 2016, ci-après le règlement général sur la protection des données ou RGPD et les lois nationales qui en découlent.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Chacune des parties s'engage à mettre à disposition toutes les informations nécessaires pour apporter la preuve du respect de ses obligations.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Par données à caractère personnel dans la présente il est sous-entendu les données à caractère personnel faisant l'objet des présentes CGV et de son exécution y compris celle des employés de chacune des parties gérant les présentes CGV.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 15. SECURITE</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Sweily met en œuvre les moyens techniques et organisationnels conformes aux standards de l'industrie afin d'assurer la sécurité de la Plateforme et de protéger les données de l'Utilisateur contre toute perte, accès non autorisé, divulgation, altération ou destruction.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Toutefois, l'Utilisateur reconnaît que, malgré tous les efforts de Sweily, aucun système n'est totalement sécurisé et que la responsabilité de Sweily ne saurait être engagée en cas de faille de sécurité résultant d'une attaque ou d'un accès non autorisé de tiers, en dépit des mesures prises.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                L'Utilisateur s'engage à préserver la confidentialité de ses identifiants et à informer immédiatement Sweily en cas de suspicion d'accès frauduleux à son compte.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 16. FORCE MAJEURE</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Aucune des parties ne saurait être tenue responsable en cas d'inexécution ou de retard dans l'exécution de ses obligations résultant d'un cas de force majeure tel que défini par la jurisprudence des tribunaux français, y compris, mais sans s'y limiter, les catastrophes naturelles, incendies, grèves, pannes informatiques, acte de gouvernement, ou toute autre circonstance indépendante de la volonté des parties.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                La partie affectée devra informer l'autre partie dans les meilleurs délais. La suspension des obligations ou le retard ne pourra en aucun cas être une cause de responsabilité pour manquement ou paiement d'indemnités ou de pénalités de retard.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ARTICLE 17. RESPONSABILITE DE L'UTILISATEUR</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                L'Utilisateur est seul responsable de l'utilisation qu'il fait de la Plateforme et des Services, ainsi que des informations et documents qu'il saisit, télécharge ou génère via la Plateforme.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Il garantit que toutes les informations transmises à Sweily sont exactes, à jour et conformes à la réglementation applicable.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                L'Utilisateur s'engage à respecter les droits des tiers, à ne pas diffuser de contenu illicite ou préjudiciable et à prendre toutes les mesures nécessaires pour protéger ses équipements et ses données contre tout virus ou tentative d'intrusion.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                En cas de manquement à ces obligations, la responsabilité de l'Utilisateur pourra être engagée, et Sweily se réserve le droit de suspendre ou supprimer l'accès à la Plateforme sans préjudice de tout autre recours.
              </p>
            </section>

            <div className="mt-16 pt-8 border-t border-gray-300">
              <p className="text-sm text-gray-500 text-center">
                Ces conditions générales de vente peuvent être modifiées à tout moment. 
                La version en vigueur est celle publiée sur cette page.
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
