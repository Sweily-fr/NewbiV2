import { Star, MessageCircle, ShieldCheck } from "lucide-react";

// Cartes de réassurance sous les témoignages des LP outils (mêmes preuves
// que /lp/gestion).
export const TOOL_PROOFS = [
  {
    avatar: "/lp/factures/mustafa.webp",
    icon: <Star size={22} strokeWidth={1.75} />,
    title: "+ 140 indépendants",
    desc: "gèrent déjà leurs clients, leurs devis et leurs factures avec Newbi.",
  },
  {
    avatar: "/lp/about/about-11.jpeg",
    icon: <MessageCircle size={22} strokeWidth={1.75} />,
    title: "Un humain sur WhatsApp",
    desc: "Une question ? L'équipe répond en langage normal, pas de robot.",
  },
  {
    avatar: "/lp/about/about-4.jpeg",
    icon: <ShieldCheck size={22} strokeWidth={1.75} />,
    title: "Tes données protégées",
    desc: "Hébergées en Europe, jamais revendues ni partagées.",
  },
];
