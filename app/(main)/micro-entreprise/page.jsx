import React from "react";
import StatutPage, { metadataStatut } from "@/app/(main)/_statuts/StatutPage";
import { contenu, seo } from "@/app/(main)/_statuts/contenu/micro-entreprise";

export const metadata = metadataStatut(seo);

export default function MicroEntreprisePage() {
  return <StatutPage contenu={contenu} />;
}
