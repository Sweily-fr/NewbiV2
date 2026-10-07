import React from "react";
import StatutPage, { metadataStatut } from "@/app/(main)/_statuts/StatutPage";
import { contenu, seo } from "@/app/(main)/_statuts/contenu/sasu-eurl";

export const metadata = metadataStatut(seo);

export default function SasuEurlPage() {
  return <StatutPage contenu={contenu} />;
}
