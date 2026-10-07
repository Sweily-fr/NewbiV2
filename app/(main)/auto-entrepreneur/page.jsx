import React from "react";
import StatutPage, { metadataStatut } from "@/app/(main)/_statuts/StatutPage";
import { contenu, seo } from "@/app/(main)/_statuts/contenu/auto-entrepreneur";

export const metadata = metadataStatut(seo);

export default function AutoEntrepreneurPage() {
  return <StatutPage contenu={contenu} />;
}
