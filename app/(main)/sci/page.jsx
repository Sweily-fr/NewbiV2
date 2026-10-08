import React from "react";
import StatutPage, { metadataStatut } from "@/app/(main)/_statuts/StatutPage";
import { contenu, seo } from "@/app/(main)/_statuts/contenu/sci";

export const metadata = metadataStatut(seo);

export default function SciPage() {
  return <StatutPage contenu={contenu} />;
}
