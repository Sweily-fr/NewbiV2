import {
  IconFileInvoice,
  IconFileDescription,
  IconReceipt,
  IconMailForward,
  IconArticle,
  IconLayoutKanban,
  IconBookmark,
} from "@tabler/icons-react";
import { Bookmark } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";

type CardItem = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  href?: string;
};

const cards: CardItem[] = [
  {
    title: "Factures",
    subtitle: "Créez et gérez vos factures professionelles en quelques clics.",
    icon: <IconFileInvoice size={22} />,
    bgColor: "bg-blue-50",
    textColor: "text-blue-500",
    href: "/dashboard/outils/factures",
  },
  {
    title: "Devis",
    subtitle: "Créez et suivis vos devis avec des modèles professionnels.",
    icon: <IconFileDescription size={22} />,
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-500",
    href: "/dashboard/outils/devis",
  },
  {
    title: "Dépenses",
    subtitle: "Créez et gérez vos dépenses avec OCR.",
    icon: <IconReceipt size={22} />,
    bgColor: "bg-orange-50",
    textColor: "text-orange-500",
    href: "/dashboard/outils/gestion-depenses",
  },
  {
    title: "Signatures de mail",
    subtitle: "Créez et gérez vos signatures de mail en quelques clics.",
    icon: <IconMailForward size={22} />,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-500",
    href: "/dashboard/outils/signatures-mail",
  },
  {
    title: "Article SEO",
    subtitle: "Créez et gérez vos articles SEO en quelques clics.",
    icon: <IconArticle size={22} />,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-500",
    href: "/dashboard/outils/optimiseur-seo-blog",
  },
  {
    title: "Gestion des tâches KANBAN",
    subtitle: "Créez et gérez vos tâches en quelques clics.",
    icon: <IconLayoutKanban size={22} />,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-500",
    href: "/dashboard/outils/kanban",
  },
  {
    title: "Transfert de fichiers",
    subtitle: "Transférez vos fichiers en quelques clics.",
    icon: <IconBookmark size={22} />,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-500",
    href: "/dashboard/outils/transferts-fichiers",
  },
];
interface SectionCardsProps {
  className?: string;
}

export function SectionCards({ className }: SectionCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {cards.map((card, index) => (
        <Link
          key={index}
          href={card.href || "#"}
          className="no-underline h-[100px] block"
        >
          <CardContent className="p-0 h-full">
            {/* Card Content */}
            <div className="mx-5 my-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-4 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40 transition h-full flex items-center">
              <div className="flex items-start gap-3">
                <div
                  className={cn("p-2 rounded-md flex-shrink-0", card.bgColor)}
                >
                  <div className={card.textColor}>{card.icon}</div>
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-1">
                    {card.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      ))}
    </div>
  );
}
