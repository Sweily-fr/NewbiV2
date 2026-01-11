"use client";
import Link from "next/link";
import {
  Equal,
  X,
  FileText,
  Receipt,
  CreditCard,
  TrendingUp,
  HandCoins,
  Mail,
  Share2,
  Kanban,
  Landmark,
  Zap,
  BookOpen,
  Users,
  Info,
  Award,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import React from "react";
import { cn } from "@/src/lib/utils";

const menuItems = [
  {
    name: "Produits",
    href: "#link",
    hasDropdown: true,
    dropdownColumns: [
      {
        title: "OUTILS FINANCIERS",
        items: [
          {
            name: "Facturation et devis",
            description: "Automatisez et suivez facilement votre facturation",
            icon: <FileText size={18} />,
            href: "/produits/factures",
          },
          {
            name: "Suivi de trésorerie",
            description: "Gardez le contrôle de vos flux financiers",
            icon: <TrendingUp size={18} />,
            href: "/produits/tresorerie",
          },
          {
            name: "Gestion des achats",
            description: "Gérez vos achats simplement. Contrôlez vos dépenses.",
            icon: <Landmark size={18} />,
            href: "/produits/gestion-des-achats",
          },
          {
            name: "Synchronisation bancaire",
            description: "Connectez vos comptes bancaires en temps réel",
            icon: <CreditCard size={18} />,
            href: "/produits/banque",
          },
          {
            name: "Facturation électronique",
            description: "Conformité 2026 garantie avec l'e-invoicing",
            icon: <Receipt size={18} />,
            href: "/produits/facturation-electronique",
          },
        ],
      },
      {
        title: "AUTRES OUTILS",
        items: [
          {
            name: "Partage de documents",
            description: "Partagez vos documents en toute sécurité",
            icon: <Share2 size={18} />,
            href: "/produits/documents",
          },
          {
            name: "Signature de mail",
            description: "Créez des signatures professionnelles",
            icon: <Mail size={18} />,
            href: "/produits/signature",
          },
          {
            name: "Transfert de fichiers",
            description: "Envoyez vos fichiers en toute sécurité",
            icon: <Zap size={18} />,
            href: "/produits/transfert",
          },
          {
            name: "Gestion de projets",
            description: "Organisez vos projets avec des tableaux Kanban",
            icon: <Kanban size={18} />,
            href: "/produits/projets",
          },
        ],
      },
    ],
  },
  { name: "Tarifs", href: "/#pricing" },
  {
    name: "Ressources",
    href: "#link",
    hasDropdown: true,
    dropdownColumns: [
      {
        title: "APPRENDRE",
        items: [
          {
            name: "Documentation",
            description: "Guides et tutoriels pour maîtriser newbi",
            icon: <BookOpen size={18} />,
            href: "/documentation",
          },
          {
            name: "Blog",
            description: "Actualités, conseils et bonnes pratiques",
            icon: <FileText size={18} />,
            href: "/blog",
          },
          {
            name: "Communauté",
            description: "Échangez avec d'autres utilisateurs newbi",
            icon: <Users size={18} />,
            href: "/communaute",
          },
        ],
      },
      {
        title: "À PROPOS",
        items: [
          {
            name: "Qui sommes-nous",
            description: "Découvrez l'équipe et la vision de newbi",
            icon: <Info size={18} />,
            href: "/about",
          },
          {
            name: "Pourquoi choisir Newbi",
            description: "Les avantages qui font la différence",
            icon: <Award size={18} />,
            href: "/pourquoi-newbi",
          },
        ],
      },
    ],
  },
];

export function NewHeroNavbar({ hasBanner = false }) {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState(null);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className={`fixed left-0 w-full z-100 transition-all duration-300 ${
          hasBanner ? (isScrolled ? "top-0" : "top-[58px]") : "top-0"
        }`}
      >
        <div
          className={cn(
            "w-full px-6 lg:px-12 transition-all duration-300",
            isScrolled &&
              "bg-[#FDFDFD] dark:bg-background border-b border-gray-200 dark:border-neutral-800"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 lg:gap-0 py-4 max-w-7xl mx-auto">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex gap-2 items-center"
              >
                <img
                  src="/newbiLetter.png"
                  alt="Logo newbi"
                  width="100"
                  height="40"
                  className="object-contain"
                />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Equal className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index} className="relative group">
                    {item.hasDropdown ? (
                      <span
                        className="text-muted-foreground hover:text-accent-foreground cursor-pointer duration-150"
                        onMouseEnter={() => setOpenDropdown(index)}
                      >
                        {item.name}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    )}

                    {/* Dropdown Menu */}
                    {item.hasDropdown && openDropdown === index && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[850px] bg-white dark:bg-background border rounded-xl shadow-sm p-6 z-50"
                        onMouseEnter={() => setOpenDropdown(index)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        <div className="grid grid-cols-3 gap-6">
                          {/* Colonnes OUTILS FINANCIERS et AUTRES OUTILS */}
                          {item.dropdownColumns?.map((column, colIdx) => (
                            <div key={colIdx} className="space-y-4">
                              <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider mb-4">
                                {column.title}
                              </h3>
                              <div className="space-y-1">
                                {column.items.map((dropdownItem, idx) => (
                                  <Link
                                    key={idx}
                                    href={dropdownItem.href}
                                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-muted transition-colors"
                                    onClick={() => setOpenDropdown(null)}
                                  >
                                    <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                                      {dropdownItem.icon}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-normal text-sm text-gray-900 dark:text-white">
                                        {dropdownItem.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {dropdownItem.description}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* Colonne conditionnelle : FACTURATION ÉLECTRONIQUE ou ARTICLE POPULAIRE */}
                          {item.name === "Produits" ? (
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 flex flex-col">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                FACTURATION ÉLECTRONIQUE
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                                Préparez-vous dès maintenant à l'obligation de
                                facturation électronique
                              </p>
                              <div className="flex-1 flex items-center justify-center mb-6">
                                <img
                                  src="/undraw_key-points_iiic.svg"
                                  alt="Facturation Électronique"
                                  className="w-48 h-auto object-contain"
                                />
                              </div>

                              <Link
                                href="/produits/facturation-electronique"
                                className="inline-block text-center px-4 py-2 bg-[#202020] text-white text-sm font-medium rounded-md hover:bg-[#202020] transition-colors"
                                onClick={() => setOpenDropdown(null)}
                              >
                                En savoir plus
                              </Link>
                            </div>
                          ) : (
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 flex flex-col">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                APPORTEUR D'AFFAIRE
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                                Devenez partenaire et générez des revenus en
                                recommandant newbi
                              </p>
                              <div className="flex-1 flex items-center justify-center mb-6">
                                <img
                                  src="/undraw_business-deal_nx2n.svg"
                                  alt="Apporteur d'affaire"
                                  className="w-48 h-auto object-contain"
                                />
                              </div>

                              <Link
                                href="https://partenaire.newbi.fr/"
                                className="inline-block text-center px-4 py-2 bg-[#202020] text-white text-sm font-medium rounded-md hover:bg-[#202020] transition-colors"
                                onClick={() => setOpenDropdown(null)}
                              >
                                Commencer avec newbi
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-2 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="md"
                  className={cn(isScrolled && "lg:hidden")}
                >
                  <Link href="/auth/signin">
                    <span>Connexion</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="md"
                  className={cn(isScrolled && "lg:hidden")}
                >
                  <Link href="/auth/signup">
                    <span>Inscription</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="md"
                  className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
                >
                  <Link href="/auth/signup">
                    <span>Démarrer</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
