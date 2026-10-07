import React from "react";
import StatutPage, { metadataStatut } from "@/app/(main)/_statuts/StatutPage";
import { contenu, seo } from "@/app/(main)/_statuts/contenu/association";

export const metadata = metadataStatut(seo);

export default function AssociationPage() {
  return <StatutPage contenu={contenu} />;
}
