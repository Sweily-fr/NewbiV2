"use client";

import { usePathname } from "next/navigation";
import { ProspectionPageSkeleton } from "./components/prospection-page-skeleton";
import {
  ProspectionDetailPageSkeleton,
  getSequenceIdFromPathname,
} from "./components/prospection-detail-page-skeleton";

// Squelette pendant le chargement du chunk de la page : le même que pendant
// le premier chargement, transition invisible.
//
// Cette boundary englobe aussi /prospection/[id] : en arrivant sur une
// prospection depuis une autre section, c'est elle qui s'affiche en
// premier. On y rend alors le squelette de la prospection, pas la liste.
export default function ProspectionLoading() {
  const pathname = usePathname();
  if (getSequenceIdFromPathname(pathname)) {
    return <ProspectionDetailPageSkeleton />;
  }
  return <ProspectionPageSkeleton />;
}
