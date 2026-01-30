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
  HelpCircle,
  Quote,
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
            href: "/produits/synchronisation-bancaire",
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
          // {
          //   name: "Partage de documents",
          //   description: "Partagez vos documents en toute sécurité",
          //   icon: <Share2 size={18} />,
          //   href: "/produits/documents",
          // },
          {
            name: "Signature de mail",
            description: "Créez des signatures professionnelles",
            icon: <Mail size={18} />,
            href: "/produits/signatures",
          },
          {
            name: "Transfert de fichiers",
            description: "Envoyez vos fichiers en toute sécurité",
            icon: <Zap size={18} />,
            href: "/produits/transfers",
          },
          {
            name: "Gestion de projets",
            description: "Organisez vos projets avec des tableaux Kanban",
            icon: <Kanban size={18} />,
            href: "/produits/kanban",
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
            href: "https://docs.newbi.fr/",
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
            href: "https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL",
          },
          // {
          //   name: "Questions fréquentes",
          //   description: "Tout ce que vous devez savoir avant de commencer",
          //   icon: <HelpCircle size={18} />,
          //   href: "/faq",
          // },
        ],
      },
      {
        title: "À PROPOS",
        items: [
          {
            name: "Qui sommes-nous",
            description: "Découvrez l'équipe et la vision de newbi",
            icon: <Info size={18} />,
            href: "/qui-sommes-nous",
          },
          // {
          //   name: "Pourquoi choisir Newbi",
          //   description:
          //     "Les avantages qui font vraiment la différence au quotidien.",
          //   icon: <Award size={18} />,
          //   href: "/pourquoi-newbi",
          // },
          {
            name: "Apporteur d'affaire",
            description: "Devenez partenaire et gagnez des commissions",
            icon: <HandCoins size={18} />,
            href: "https://partenaire.newbi.fr",
          },
          // {
          //   name: "Témoignages clients",
          //   description:
          //     "Découvrez comment nos clients améliorent leur crédibilité",
          //   icon: <Quote size={18} />,
          //   href: "/temoignages",
          // },
        ],
      },
    ],
  },
];

export function NewHeroNavbar({ hasBanner = false }) {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = React.useState(null);

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
          hasBanner
            ? isScrolled
              ? "top-0"
              : "top-[80px] sm:top-[58px]"
            : "top-0"
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
                  width="90"
                  height="36"
                  className="object-contain"
                />
              </Link>

              <button
                onClick={() => {
                  setMenuState(!menuState);
                  if (menuState) setMobileDropdownOpen(null);
                }}
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
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[850px] bg-gray-50 dark:bg-background border rounded-xl shadow-sm p-6 z-50"
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
                                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-muted transition-colors"
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

            {/* Desktop buttons */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              <Button asChild variant="outline" size="md">
                <Link href="/auth/login">
                  <span>Connexion</span>
                </Link>
              </Button>
              <Button asChild size="md">
                <Link href="/auth/signup">
                  <span>Inscription</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay - Fullscreen */}
        {menuState && (
          <div
            className={`lg:hidden fixed inset-0 bg-white z-50 overflow-hidden transition-all duration-300 ${hasBanner && !isScrolled ? "top-[152px] sm:top-[130px]" : "top-[72px]"}`}
          >
            <div className="flex flex-col h-full">
              {/* Menu content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {menuItems.map((item, index) => (
                    <div key={index}>
                      {item.hasDropdown ? (
                        <div>
                          {/* Accordion Header */}
                          <button
                            onClick={() =>
                              setMobileDropdownOpen(
                                mobileDropdownOpen === index ? null : index
                              )
                            }
                            className="flex items-center justify-between w-full px-6 py-5 text-left border-b border-gray-100"
                          >
                            <span className="text-xl font-normal text-black">
                              {item.name}
                            </span>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${mobileDropdownOpen === index ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>

                          {/* Accordion Content */}
                          {mobileDropdownOpen === index && (
                            <div className="bg-gray-50 border-b border-gray-100">
                              {item.dropdownColumns?.map((column, colIdx) => (
                                <div key={colIdx} className="px-6 py-4">
                                  <h3 className="text-xs font-normal text-gray-400 uppercase tracking-wider mb-4">
                                    {column.title}
                                  </h3>
                                  <div className="space-y-1">
                                    {column.items.map((dropdownItem, idx) => (
                                      <Link
                                        key={idx}
                                        href={dropdownItem.href}
                                        className="flex items-center gap-4 py-3 hover:bg-gray-100 rounded-lg px-2 -mx-2 transition-colors duration-200"
                                        onClick={() => {
                                          setMenuState(false);
                                          setMobileDropdownOpen(null);
                                        }}
                                      >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <span className="text-gray-600">
                                            {dropdownItem.icon}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-medium text-black">
                                            {dropdownItem.name}
                                          </h4>
                                          <p className="text-sm text-gray-500 mt-0.5">
                                            {dropdownItem.description}
                                          </p>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex items-center justify-between w-full px-6 py-5 border-b border-gray-100"
                          onClick={() => setMenuState(false)}
                        >
                          <span className="text-xl font-normal text-black">
                            {item.name}
                          </span>
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons at bottom - Fixed */}
              <div className="px-6 pb-8 pt-6 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-col space-y-3">
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-xl py-6 text-base bg-[#202020]"
                  >
                    <Link
                      href="/auth/signup"
                      className="flex items-center justify-center"
                      onClick={() => setMenuState(false)}
                    >
                      <span>Inscription</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full rounded-xl py-6 text-base border-gray-300"
                  >
                    <Link
                      href="/auth/login"
                      className="flex items-center justify-center"
                      onClick={() => setMenuState(false)}
                    >
                      <span>Se connecter</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
