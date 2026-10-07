import React from "react";
import StatutPage, { metadataStatut } from "@/app/(main)/_statuts/StatutPage";
import {
  contenu,
  seo,
} from "@/app/(main)/_statuts/contenu/entreprise-individuelle";

export const metadata = metadataStatut(seo);

export default function EntrepriseIndividuellePage() {
  return <StatutPage contenu={contenu} />;
}
