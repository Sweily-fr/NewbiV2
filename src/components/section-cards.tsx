import {
  IconFileInvoice,
  IconFileDescription,
  IconReceipt,
  IconMailForward,
  IconArticle,
  IconLayoutKanban,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
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
    icon: <IconLayoutKanban size={22} />,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-500",
    href: "/dashboard/outils/transferts-fichiers",
  },
  {
    title: "Mentions légales",
    subtitle: "Créez et gérez vos mentions légales en quelques clics.",
    icon: <IconLayoutKanban size={22} />,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-500",
    href: "/dashboard/outils/mentions-legales",
  },
  {
    title: "Politique de confidentialité",
    subtitle:
      "Créez et gérez vos politiques de confidentialité en quelques clics.",
    icon: <IconLayoutKanban size={22} />,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-500",
    href: "/dashboard/outils/politique-de-confidentialite",
  },
];
interface SectionCardsProps {
  className?: string;
}

export function SectionCards({ className }: SectionCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full",
        className
      )}
    >
      {cards.map((card, index) => (
        <Link
          key={index}
          href={card.href || "#"}
          className="no-underline h-[100px] block w-full"
        >
          <CardContent className="h-full w-full p-0">
            {/* Card Content */}
            <Card className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition h-full w-full">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div
                    className={cn("p-2 rounded-md flex-shrink-0", card.bgColor)}
                  >
                    <div className={card.textColor}>{card.icon}</div>
                  </div>
                  <div className="overflow-hidden flex flex-col gap-2">
                    <CardTitle className="text-m font-semibold line-clamp-1">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {card.subtitle}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </CardContent>
        </Link>
      ))}
    </div>
  );
}
