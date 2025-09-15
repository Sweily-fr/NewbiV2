"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { FileText, Download, Mail } from "lucide-react";
import { Separator } from "@/src/components/ui/separator";

export function LegalPreview({ formData }) {
  const generateLegalText = () => {
    const {
      companyName = "[Nom de l'entreprise]",
      legalForm = "[Forme juridique]",
      address = "[Adresse]",
      email = "[Email]",
      phone = "[Téléphone]",
      socialCapital = "[Capital social]",
      publicationDirector = "[Directeur de publication]",
      rcs = "[RCS]",
      siret = "[SIRET]",
      tvaNumber = "[Numéro de TVA]",
      websiteUrl = "[URL du site]",
      hostName = "[Nom de l'hébergeur]",
      hostAddress = "[Adresse de l'hébergeur]",
      hostPhone = "[Téléphone de l'hébergeur]",
      hostEmail = "[Email de l'hébergeur]",
    } = formData;

    return `MENTIONS LÉGALES

En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site ${websiteUrl} l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi :

PROPRIÉTAIRE DU SITE

${companyName}
${legalForm}${socialCapital ? ` au capital de ${socialCapital} euros` : ""}
Siège social : ${address}
${rcs ? `RCS : ${rcs}` : ""}
${siret ? `SIRET : ${siret}` : ""}
${tvaNumber ? `Numéro de TVA intracommunautaire : ${tvaNumber}` : ""}

Contact :
Email : ${email}
${phone ? `Téléphone : ${phone}` : ""}

DIRECTEUR DE LA PUBLICATION

Le directeur de la publication du site est ${publicationDirector}.

HÉBERGEMENT

Le site ${websiteUrl} est hébergé par :
${hostName}
${hostAddress ? `Adresse : ${hostAddress}` : ""}
${hostPhone ? `Téléphone : ${hostPhone}` : ""}
${hostEmail ? `Email : ${hostEmail}` : ""}

PROPRIÉTÉ INTELLECTUELLE

L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.

La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.

DONNÉES PERSONNELLES

Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.

Pour exercer ces droits, vous pouvez nous contacter à l'adresse suivante : ${email}

COOKIES

Ce site utilise des cookies pour améliorer l'expérience utilisateur. En continuant à naviguer sur ce site, vous acceptez l'utilisation de cookies.

RESPONSABILITÉ

Les informations contenues sur ce site sont aussi précises que possible et le site remis à jour à différentes périodes de l'année, mais peut toutefois contenir des inexactitudes ou des omissions.

Si vous constatez une lacune, erreur ou ce qui parait être un dysfonctionnement, merci de bien vouloir le signaler par email, à l'adresse ${email}, en décrivant le problème de la manière la plus précise possible.

LIENS HYPERTEXTES

Les liens hypertextes mis en place dans le cadre du présent site internet en direction d'autres ressources présentes sur le réseau Internet ne sauraient engager la responsabilité de ${companyName}.

LITIGES

Les présentes conditions du site ${websiteUrl} sont régies par les lois françaises et toute contestation ou litiges qui pourraient naître de l'interprétation ou de l'exécution de celles-ci seront de la compétence exclusive des tribunaux dont dépend le siège social de la société.

La langue de référence, pour le règlement de contentieux éventuels, est le français.

CRÉDITS

Les crédits des éléments multimédias (images, sons, vidéos, textes...) sont indiqués dans chaque élément ou en fin de document.

Date de dernière mise à jour : ${new Date().toLocaleDateString("fr-FR")}`;
  };

  const handleDownload = () => {
    const text = generateLegalText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mentions-legales.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    const text = generateLegalText();
    try {
      await navigator.clipboard.writeText(text);
      // Ici vous pouvez ajouter une notification de succès
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview du document */}
      <Card className="p-6 bg-[#F7F8FA]/60 border-none shadow-none">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-4 w-4" />
              Preview
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Copier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Télécharger
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          <Card className="p-6">
            <div className="max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-gray-800">
                {generateLegalText()}
              </pre>
            </div>
          </Card>
        </CardContent>
      </Card>

      {/* Informations complémentaires */}
      {/* <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">📋 Informations importantes :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                Ce document est généré automatiquement selon les informations
                fournies
              </li>
              <li>Vérifiez toutes les informations avant publication</li>
              <li>Consultez un avocat pour des besoins spécifiques</li>
              <li>Mettez à jour vos mentions légales en cas de changement</li>
            </ul>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
