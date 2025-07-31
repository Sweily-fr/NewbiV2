import {
  IconFileInvoice,
  IconFileDescription,
  IconReceipt,
  IconMailForward,
  IconArticle,
  IconLayoutKanban,
  IconTransfer,
  IconShieldLock,
  IconLock,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

// Fonction pour déterminer la couleur de l'icône en fonction du type d'outil
function getIconColor(title) {
  switch (title) {
    case "Article SEO":
      return "#5B4FFF";
    case "Factures":
      return "#5B4FFF";
    case "Devis":
      return "#5B4FFF";
    case "Dépenses":
      return "#5B4FFF";
    case "Signatures de mail":
      return "#5B4FFF";
    case "KANBAN":
      return "#5B4FFF";
    case "Transfert de fichiers":
      return "#5B4FFF";
    case "Mentions légales":
      return "#5B4FFF";
    case "Politique de confidentialité":
      return "#5B4FFF";
    default:
      return "#5B4FFF";
  }
}

const cards = [
  {
    title: "Factures",
    subtitle: "Créez et gérez vos factures.",
    icon: <IconFileInvoice size={15} />,
    href: "/dashboard/outils/factures",
    status: "available",
    bgIconColor: "#8681FF",
    Image: "/images/utils/Factures.svg",
  },
  {
    title: "Devis",
    subtitle: "Créez et suivez vos devis.",
    icon: <IconFileDescription size={15} />,
    href: "/dashboard/outils/devis",
    status: "available",
    bgIconColor: "#FFC782",
    Image: "/images/utils/Devis.svg",
  },
  {
    title: "KANBAN",
    subtitle: "Créez et gérez vos tâches.",
    icon: <IconLayoutKanban size={15} />,
    href: "/dashboard/outils/kanban",
    status: "available",
    bgIconColor: "#FF7D65",
    Image: "/images/utils/Kanban.svg",
  },
  {
    title: "Signatures de mail",
    subtitle: "Créez et gérez vos signatures de mail.",
    icon: <IconMailForward size={15} />,
    href: "/dashboard/outils/signatures-mail",
    status: "available",
    bgIconColor: "#8BA6FF",
    Image: "/images/utils/Signature.svg",
  },
  {
    title: "Transfert de fichiers",
    subtitle: "Transférez vos fichiers.",
    icon: <IconTransfer size={15} />,
    href: "/dashboard/outils/transferts-fichiers",
    status: "available",
    bgIconColor: "#FF9F65",
    Image: "/images/utils/Transfert.svg",
  },
  {
    title: "Dépenses",
    subtitle: "Créez et gérez vos dépenses.",
    icon: <IconReceipt size={15} />,
    href: "/dashboard/outils/gestion-depenses",
    status: "available",
    bgIconColor: "#5B4FFF",
    Image: "/images/utils/gestion-depenses.png",
  },
  // {
  //   title: "Article SEO",
  //   subtitle: "Créez et gérez vos articles SEO.",
  //   icon: <IconArticle size={20} />,
  //   href: "/dashboard/outils/optimiseur-seo-blog",
  //   status: "available",
  // },
  // {
  //   title: "Mentions légales",
  //   subtitle: "Créez et gérez vos mentions légales.",
  //   icon: <IconShieldLock size={20} />,
  //   href: "/dashboard/outils/mentions-legales",
  //   status: "available",
  // },
  // {
  //   title: "Politique de confidentialité",
  //   subtitle: "Créez et gérez vos politiques.",
  //   icon: <IconLock size={20} />,
  //   href: "/dashboard/outils/politique-de-confidentialite",
  //   status: "available",
  // },
];

export function SectionCards({ className }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 w-full",
        className
      )}
    >
      {cards.map((card, index) => {
        const isAvailable = card.status === "available" || !card.status;

        // La fonction getIconColor est maintenant définie en dehors du composant

        return (
          <Card key={index} className="border-0 shadow-sm p-2">
            <div className="flex flex-row h-full">
              {/* Partie gauche avec icône, titre, description et lien */}
              <div className="flex flex-col p-2 flex-1 justify-between">
                <div className="space-y-4">
                  <div
                    className={cn(
                      "p-2 rounded-md w-7 h-7 flex items-center justify-center",
                      `bg-[${card.bgIconColor}]`
                    )}
                    // style={{ backgroundColor: getIconColor(card.title) }}
                  >
                    <p className="text-white">{card.icon}</p>
                  </div>

                  <div className="space-y-3">
                    <CardTitle className="text-regular">{card.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {card.subtitle}
                    </CardDescription>
                  </div>
                </div>

                <div className="pt-6">
                  {isAvailable && (
                    <Link
                      href={card.href || "#"}
                      className="text-sm font-medium text-[#5B4FFF] hover:text-[#5B4FFF] flex items-center gap-2 no-underline"
                    >
                      Accéder <span className="text-sm">→</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Partie droite avec la visualisation - coins arrondis */}
              <div
                className={`w-1/2 rounded-xl m-1 p-2 flex flex-col justify-center space-y-4 bg-[#5B4FFF]/4 bg-center bg-no-repeat bg-50% bg-blend-soft-light ${card.Image ? "" : "bg-none"}`}
                style={{
                  backgroundImage: card.Image ? `url(${card.Image})` : "none",
                  backgroundSize: "80%",
                  backgroundPosition: "center center",
                  backgroundRepeat: "no-repeat",
                  opacity: 0.7,
                  objectFit: "cover",
                }}
              >
                {/* {card.title === "Article SEO" ? (
                  <>
                    <div className="bg-white rounded-lg p-3 flex items-center border border-slate-200 shadow-sm">
                      <input
                        type="text"
                        className="flex-1 text-sm border-0 bg-transparent outline-none text-gray-500"
                        placeholder="Search a writing tool..."
                        disabled
                      />
                      <div className="bg-[#5B4FFF] p-2 rounded-lg text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full w-full"></div>
                    <div className="h-3 bg-slate-200 rounded-full w-full"></div>
                    <div className="h-3 bg-slate-200 rounded-full w-full"></div>
                  </>
                ) : (
                  getToolVisualization(card.title)
                )} */}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Fonction pour générer la visualisation spécifique à chaque outil
function getToolVisualization(cardTitle) {
  const getPlaceholder = () => {
    switch (cardTitle) {
      case "Factures":
        return "Rechercher une facture...";
      case "Devis":
        return "Rechercher un devis...";
      case "Dépenses":
        return "Rechercher une dépense...";
      case "Signatures de mail":
        return "Rechercher une signature...";
      case "Gestion des tâches KANBAN":
        return "Rechercher une tâche...";
      case "Transfert de fichiers":
        return "Rechercher un fichier...";
      case "Mentions légales":
        return "Rechercher un document...";
      case "Politique de confidentialité":
        return "Rechercher une politique...";
      default:
        return "Rechercher...";
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg p-3 flex items-center border border-slate-200 shadow-sm">
        <input
          type="text"
          className="flex-1 text-sm border-0 bg-transparent outline-none text-gray-500"
          placeholder={getPlaceholder()}
          disabled
        />
        <div className="bg-blue-500 p-2 rounded-lg text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>
      <div className="h-3 bg-slate-200 rounded-full w-full"></div>
      <div className="h-3 bg-slate-200 rounded-full w-full"></div>
      <div className="h-3 bg-slate-200 rounded-full w-full"></div>
    </>
  );
}
