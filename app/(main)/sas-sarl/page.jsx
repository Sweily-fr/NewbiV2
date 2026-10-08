import React from "react";
import StatutPage, { metadataStatut } from "@/app/(main)/_statuts/StatutPage";
import { contenu, seo } from "@/app/(main)/_statuts/contenu/sas-sarl";

export const metadata = metadataStatut(seo);

export default function SasSarlPage() {
  return <StatutPage contenu={contenu} />;
}
