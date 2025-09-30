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
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { Crown, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { isCompanyInfoComplete } from "@/src/hooks/useCompanyInfoGuard";
import { useSettingsModal } from "@/src/hooks/useSettingsModal";
import { SettingsModal } from "@/src/components/settings-modal";
import { PricingModal } from "./pricing-modal";
import { GridBackground } from "@/src/components/ui/grid-background";
import { SectionCardsSkeleton } from "@/src/components/section-cards-skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { useState } from "react";

// Textes explicatifs pour chaque outil
const toolDescriptions = {
  "Créer une Facture": {
    title: "Outil de Facturation",
    description: "Créez des factures professionnelles en quelques clics. Gérez vos clients, ajoutez vos produits/services, calculez automatiquement les taxes et suivez les paiements. Exportez vos factures en PDF et envoyez-les directement par email à vos clients."
  },
  "Créer un Devis": {
    title: "Générateur de Devis",
    description: "Élaborez des devis détaillés et attractifs pour vos prospects. Personnalisez vos offres, ajustez les prix, incluez des conditions spéciales et convertissez facilement vos devis acceptés en factures."
  },
  "Créer une Dépense": {
    title: "Gestion des Dépenses",
    description: "Enregistrez et catégorisez toutes vos dépenses professionnelles. Uploadez vos reçus, suivez vos frais déductibles et générez des rapports pour votre comptabilité et déclarations fiscales."
  },
  "Mes Signatures de Mail": {
    title: "Signatures Email Professionnelles",
    description: "Créez des signatures email élégantes et cohérentes pour votre entreprise. Ajoutez votre logo, vos coordonnées, liens vers vos réseaux sociaux et respectez votre charte graphique."
  },
  "Transferer des fichiers": {
    title: "Partage de Fichiers Sécurisé",
    description: "Partagez vos fichiers volumineux en toute sécurité avec vos clients et partenaires. Générez des liens de téléchargement temporaires, protégez vos documents par mot de passe et suivez les téléchargements."
  },
  "Gestion De Projet": {
    title: "Tableau Kanban",
    description: "Organisez vos projets et tâches avec des tableaux Kanban intuitifs. Créez des colonnes personnalisées, déplacez vos tâches, assignez des responsables et suivez l'avancement de vos projets en temps réel."
  }
};

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
    title: "Créer une Facture",
    subtitle: "Créez et gérez facilement toutes vos factures professionnelles.",
    icon: <IconFileInvoice size={15} />,
    href: "/dashboard/outils/factures",
    status: "available",
    bgIconColor: "#8681FF",
    Image: "/images/utils/Factures.svg",
    isPro: true,
    category: "financier",
  },
  {
    title: "Créer un Devis",
    subtitle: "Créez et suivez efficacement tous vos devis clients.",
    icon: <IconFileDescription size={15} />,
    href: "/dashboard/outils/devis",
    status: "available",
    bgIconColor: "#FFC782",
    Image: "/images/utils/Devis.svg",
    isPro: true,
    category: "financier",
  },
  {
    title: "Créer une Dépense",
    subtitle: "Créez et gérez simplement toutes vos dépenses d'entreprise.",
    icon: <IconReceipt size={15} />,
    href: "/dashboard/outils/gestion-depenses",
    status: "available",
    bgIconColor: "#5B4FFF",
    Image: "/images/utils/gestion-depenses.png",
    isPro: true,
    category: "financier",
  },
  {
    title: "Mes Signatures de Mail",
    subtitle: "Créez et gérez professionnellement vos signatures d'email.",
    icon: <IconMailForward size={15} />,
    href: "/dashboard/outils/signatures-mail",
    status: "available",
    bgIconColor: "#8BA6FF",
    Image: "/images/utils/Signature.svg",
    isPro: false,
    category: "marketing",
  },
  {
    title: "Transferer des fichiers",
    subtitle: "Transférez et partagez rapidement tous vos fichiers importants.",
    icon: <IconTransfer size={15} />,
    href: "/dashboard/outils/transferts-fichiers",
    status: "available",
    bgIconColor: "#FF9F65",
    Image: "/images/utils/Transfert.svg",
    isPro: true,
    category: "marketing",
  },
  {
    title: "Gestion De Projet",
    subtitle: "Créez et gérez efficacement toutes vos tâches quotidiennes.",
    icon: <IconLayoutKanban size={15} />,
    href: "/dashboard/outils/kanban",
    status: "available",
    bgIconColor: "#FF7D65",
    Image: "/images/utils/Kanban.svg",
    isPro: false,
    category: "automatisation",
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

export function SectionCards({ className, activeFilter = "outline" }) {
  const { isActive, user, organization, isLoading, isInitialized } = useDashboardLayoutContext();
  const router = useRouter();
  const { isOpen, initialTab, openSettings, closeSettings } = useSettingsModal();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  
  // Fonction pour vérifier si les informations d'entreprise sont complètes
  const checkCompanyInfo = () => {
    // Utiliser les données en cache du contexte optimisé
    if (organization) {
      return isCompanyInfoComplete(organization);
    }
    
    return false;
  };

  // Fonction pour déterminer quel onglet ouvrir selon les informations manquantes
  const getRequiredSettingsTab = () => {
    // Utiliser les données en cache du contexte optimisé
    if (!organization) return "generale";

    // Vérifier les informations générales d'abord
    const hasGeneralInfo = !!(
      organization.companyName &&
      organization.companyEmail &&
      organization.addressStreet &&
      organization.addressCity &&
      organization.addressZipCode &&
      organization.addressCountry
    );

    if (!hasGeneralInfo) {
      return "generale";
    }

    // Si les informations générales sont OK, vérifier les informations légales
    const hasLegalInfo = !!(organization.siret && organization.legalForm);
    
    if (!hasLegalInfo) {
      return "informations-legales";
    }

    // Par défaut, ouvrir l'onglet général
    return "generale";
  };
  
  // Fonction pour gérer le clic sur un outil premium
  const handlePremiumToolClick = (e) => {
    e.preventDefault();
    setIsPricingModalOpen(true);
  };
  
  // Fonction pour gérer le clic sur un outil nécessitant les informations d'entreprise
  const handleCompanyInfoRequiredClick = (e, toolTitle) => {
    e.preventDefault();
    
    // Déterminer quel onglet ouvrir selon les informations manquantes
    const requiredTab = getRequiredSettingsTab();
    
    // Ouvrir le modal de paramètres sur l'onglet approprié
    openSettings(requiredTab);
  };

  // Fonction pour ouvrir la modal d'information d'un outil
  const handleToolInfoClick = (e, toolTitle) => {
    e.preventDefault();
    setSelectedTool(toolTitle);
    setIsInfoDialogOpen(true);
  };
  
  // Filtrer les cartes selon l'onglet actif
  const filteredCards = cards.filter(card => {
    if (activeFilter === "outline") return true; // Afficher toutes les cartes
    if (activeFilter === "past-performance") return card.category === "financier";
    if (activeFilter === "key-personnel") return card.category === "marketing";
    if (activeFilter === "focus-documents") return card.category === "automatisation";
    return true;
  });
  
  // Afficher le skeleton pendant le chargement des données
  if (isLoading) {
    return <SectionCardsSkeleton className={className} />;
  }
  
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 w-full",
        className
      )}
    >
      {filteredCards.map((card, index) => {
        const isAvailable = card.status === "available" || !card.status;
        const hasSubscriptionAccess = !card.isPro || isActive();
        
        // Vérifier si l'outil nécessite les informations d'entreprise
        const requiresCompanyInfo = card.title === "Factures" || card.title === "Devis";
        const hasCompanyInfoAccess = !requiresCompanyInfo || checkCompanyInfo();
        
        // L'accès final nécessite à la fois l'abonnement ET les informations d'entreprise
        const hasFullAccess = hasSubscriptionAccess && hasCompanyInfoAccess;
        
        // Déterminer le type de restriction
        const restrictionType = !hasSubscriptionAccess ? "subscription" : 
                               !hasCompanyInfoAccess ? "companyInfo" : null;

        return (
          <Card 
            key={index} 
            className={cn(
              "hover:border-primary/50 transition-all duration-200 group relative overflow-hidden",
              !hasFullAccess && "cursor-pointer",
              !hasCompanyInfoAccess && requiresCompanyInfo && "opacity-75 grayscale-[0.3]",
              !hasSubscriptionAccess && "opacity-75 grayscale-[0.3]"
            )}
            onClick={
              !hasSubscriptionAccess ? handlePremiumToolClick :
              !hasCompanyInfoAccess && requiresCompanyInfo ? (e) => handleCompanyInfoRequiredClick(e, card.title) :
              undefined
            }
          >
            <GridBackground />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-start justify-between h-full min-h-[140px]">
                {/* Partie gauche avec contenu */}
                <div className="flex flex-col justify-end h-full pr-4">
                  {/* Header avec titre et description */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h3 className="font-medium text-xl">{card.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Actions en bas */}
                  <div className="flex items-center gap-3 pt-4">
                    {isAvailable && hasFullAccess && (
                      <>
                        <Link href={card.href || "#"}>
                          <Button 
                            size="sm" 
                            className="px-4 py-2 text-sm font-medium cursor-pointer"
                          >
                            Accéder
                          </Button>
                        </Link>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="px-4 py-2 text-sm font-medium cursor-pointer"
                          onClick={(e) => handleToolInfoClick(e, card.title)}
                        >
                          En savoir plus
                        </Button>
                      </>
                    )}
                    {!hasFullAccess && (
                      <div className="flex items-center gap-3">
                        {restrictionType === "subscription" && (
                          <>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 px-4 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer"
                            >
                              <Crown className="w-4 h-4" />
                              Passer Pro
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="px-4 py-2 text-sm font-medium cursor-pointer"
                              onClick={(e) => handleToolInfoClick(e, card.title)}
                            >
                              En savoir plus
                            </Button>
                          </>
                        )}
                        {restrictionType === "companyInfo" && (
                          <>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 px-4 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer"
                            >
                              <Lock className="w-4 h-4" />
                              Configuration requise
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="px-4 py-2 text-sm font-medium cursor-pointer"
                              onClick={(e) => handleToolInfoClick(e, card.title)}
                            >
                              En savoir plus
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Partie droite avec illustration */}
                <div className="flex-shrink-0 w-36 h-36 flex items-center justify-center relative overflow-visible">
                  <div
                    className="w-full h-full flex items-center justify-center bg-center bg-no-repeat relative z-10 transition-transform duration-300 group-hover:scale-110 overflow-visible"
                    style={{
                      backgroundImage: card.Image ? `url(${card.Image})` : "none",
                      backgroundSize: "80%",
                      backgroundPosition: "top center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {!card.Image && (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: card.bgIconColor }}
                      >
                        <div className="text-white text-lg">{card.icon}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Modal de paramètres */}
      <SettingsModal
        open={isOpen}
        onOpenChange={closeSettings}
        initialTab={initialTab}
      />
      
      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)} 
      />
      
      {/* Modal d'information sur l'outil */}
      <AlertDialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedTool && toolDescriptions[selectedTool]?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {selectedTool && toolDescriptions[selectedTool]?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsInfoDialogOpen(false)}>
              Compris
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
