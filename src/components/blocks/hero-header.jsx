"use client";
import React from "react";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Rocket,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { authClient } from "@/src/lib/auth-client";
import { useUser } from "@/src/lib/auth/hooks";
import { Card } from "@/src/components/ui/card";
import {
  IconFileInvoice,
  IconFileDescription,
  IconMailForward,
  IconLayoutKanban,
  IconTransfer,
} from "@tabler/icons-react";
import { getAssetUrl } from "@/src/lib/image-utils";

const menuItems = [
  {
    name: "Produits",
    href: "#link",
    hasDropdown: true,
    dropdownItems: [
      {
        name: "Factures simplifiées",
        description: "Automatisez et suivez facilement votre facturation.",
        icon: <IconFileInvoice size={20} />,
        bgColor: "bg-[#8681FF]",
        textColor: "text-white",
        href: "/produits/factures",
      },
      {
        name: "Devis en un clic",
        description: "Créez, envoyez et validez vos devis en toute simplicité.",
        icon: <IconFileDescription size={20} />,
        bgColor: "bg-[#FFC782]",
        textColor: "text-white",
        href: "/produits/devis",
      },
      {
        name: "Signatures rapides",
        description:
          "Faites signer vos documents en ligne en quelques secondes.",
        icon: <IconMailForward size={20} />,
        bgColor: "bg-[#FF7D65]",
        textColor: "text-white",
        href: "/produits/signatures",
      },
      {
        name: "Tableaux Kanban",
        description: "Organisez vos projets et suivez vos tâches visuellement.",
        icon: <IconLayoutKanban size={20} />,
        bgColor: "bg-[#8BA6FF]",
        textColor: "text-white",
        href: "/produits/kanban",
      },
      {
        name: "Transferts sécurisés",
        description: "Envoyez et recevez vos fichiers en toute sécurité.",
        icon: <IconTransfer size={20} />,
        bgColor: "bg-[#FF9F65]",
        textColor: "text-white",
        href: "/produits/transfers",
      },
    ],
  },
  { name: "Tarifs", href: "/#pricing" },
  { name: "Blog", href: "/blog" },
  // {
  //   name: "Blog",
  //   href: "#link",
  //   hasDropdown: true,
  //   isBlogDropdown: true,
  //   dropdownItems: [
  //     {
  //       name: "Comment optimiser votre facturation",
  //       description:
  //         "Découvrez les meilleures pratiques pour automatiser et simplifier votre processus de facturation.",
  //       image: "/images/blog/facturation-optimisation.jpg",
  //       href: "/blog/optimiser-facturation",
  //       category: "Facturation",
  //       readTime: "5 min",
  //       isLarge: true,
  //     },
  //     {
  //       name: "Gérer sa trésorerie efficacement",
  //       description:
  //         "Les clés pour un suivi financier optimal de votre entreprise.",
  //       image: "/images/blog/tresorerie.jpg",
  //       href: "/blog/gerer-tresorerie",
  //       category: "Finance",
  //       readTime: "4 min",
  //     },
  //     {
  //       name: "Digitaliser son entreprise en 2025",
  //       description:
  //         "Guide complet pour réussir votre transformation digitale.",
  //       image: "/images/blog/digitalisation.jpg",
  //       href: "/blog/digitalisation-entreprise",
  //       category: "Digital",
  //       readTime: "6 min",
  //     },
  //   ],
  // },
];

const HeroHeader = ({ className }) => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState(null);
  const [dropdownTimeout, setDropdownTimeout] = React.useState(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = React.useState(null);
  const session = useUser();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <header className={className}>
      <nav
        data-state={menuState && "active"}
        className="fixed z-[100] w-full group"
      >
        {/* Mobile navbar */}
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" aria-label="home" className="flex items-center">
              <Logo />
            </Link>

            <button
              onClick={() => setMenuState(!menuState)}
              aria-label={menuState == true ? "Close Menu" : "Open Menu"}
              className="relative z-20 p-2 cursor-pointer"
            >
              <Menu className="group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 size-5 duration-200" />
              <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-5 -rotate-180 scale-0 opacity-0 duration-200" />
            </button>
          </div>
        </div>

        {/* Desktop navbar */}
        <div
          className={cn(
            "hidden lg:block mx-auto mt-8 bg-[#fff] rounded-2xl shadow-xs max-w-4xl px-2 transition-all duration-300 lg:px-3",
            isScrolled &&
              "mt-2 bg-background/50 backdrop-blur-lg border max-w-3xl"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-2">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                <Logo />
              </Link>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li
                    key={index}
                    className="relative"
                    onMouseEnter={() => {
                      if (item.hasDropdown) {
                        if (dropdownTimeout) {
                          clearTimeout(dropdownTimeout);
                          setDropdownTimeout(null);
                        }
                        setActiveDropdown(index);
                      }
                    }}
                    onMouseLeave={() => {
                      if (item.hasDropdown) {
                        const timeout = setTimeout(() => {
                          setActiveDropdown(null);
                        }, 150);
                        setDropdownTimeout(timeout);
                      }
                    }}
                  >
                    {item.hasDropdown ? (
                      <button className="text-muted-foreground hover:text-accent-foreground block duration-150">
                        <span>{item.name}</span>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    )}

                    {/* Dropdown */}
                    {item.hasDropdown && activeDropdown === index && (
                      <Card
                        className={cn(
                          "absolute shadow-none top-full left-1/2 transform -translate-x-1/2 mt-10 p-3 z-50",
                          item.isBlogDropdown ? "w-[600px]" : "w-150"
                        )}
                        onMouseEnter={() => {
                          if (dropdownTimeout) {
                            clearTimeout(dropdownTimeout);
                            setDropdownTimeout(null);
                          }
                          setActiveDropdown(index);
                        }}
                        onMouseLeave={() => {
                          const timeout = setTimeout(() => {
                            setActiveDropdown(null);
                          }, 150);
                          setDropdownTimeout(timeout);
                        }}
                      >
                        {item.isBlogDropdown ? (
                          <div className="space-y-0 divide-y divide-gray-100">
                            {/* Première ligne - 1 bloc large */}
                            {item.dropdownItems
                              .filter((item) => item.isLarge)
                              .map((dropdownItem, dropdownIndex) => (
                                <Link
                                  key={dropdownIndex}
                                  href={dropdownItem.href}
                                  className="flex items-start gap-4 p-4 hover:bg-gray-50 hover:rounded-lg transition-all duration-200 group"
                                >
                                  <div className="w-24 h-20 rounded-lg flex-shrink-0 border border-dashed border-gray-300 flex items-center justify-center">
                                    <TrendingUp
                                      size={24}
                                      className="text-gray-400"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-[#171717] text-sm mb-1">
                                      {dropdownItem.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                      {dropdownItem.description}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            {/* Deuxième ligne - 2 blocs */}
                            <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
                              {item.dropdownItems
                                .filter((item) => !item.isLarge)
                                .map((dropdownItem, dropdownIndex) => (
                                  <Link
                                    key={dropdownIndex}
                                    href={dropdownItem.href}
                                    className="flex flex-col gap-3 p-4 hover:bg-gray-50 hover:rounded-lg transition-all duration-200 group"
                                  >
                                    <div className="w-full h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                                      {dropdownIndex === 0 ? (
                                        <Rocket
                                          size={24}
                                          className="text-gray-400"
                                        />
                                      ) : (
                                        <Lightbulb
                                          size={24}
                                          className="text-gray-400"
                                        />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="text-[#171717] text-sm mb-1">
                                        {dropdownItem.name}
                                      </h3>
                                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                        {dropdownItem.description}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {item.dropdownItems.map(
                              (dropdownItem, dropdownIndex) => (
                                <Link
                                  key={dropdownIndex}
                                  href={dropdownItem.href}
                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                                >
                                  <div
                                    className={`w-10 h-10 ${dropdownItem.bgColor} rounded-lg flex items-center justify-center ${dropdownItem.textColor} text-lg flex-shrink-0 bg-opacity-30`}
                                  >
                                    {dropdownItem.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-[#171717] text-sm mb-1">
                                      {dropdownItem.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                      {dropdownItem.description}
                                    </p>
                                  </div>
                                </Link>
                              )
                            )}
                          </div>
                        )}
                      </Card>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop menu items and buttons */}
            <div className="hidden lg:flex lg:items-center lg:gap-6">
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                {session.session ? (
                  <Button asChild size="sm" variant="default">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/auth/login">
                        <span>Connexion</span>
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/auth/signup">
                        <span>Inscription</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {menuState && (
          <div className="lg:hidden fixed inset-0 top-[52px] bg-white z-10">
            <div className="flex flex-col h-full">
              {/* Menu content */}
              <div className="flex-1 px-4 py-6 overflow-y-auto">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      {item.hasDropdown ? (
                        <div>
                          <button
                            onClick={() =>
                              setMobileDropdownOpen(
                                mobileDropdownOpen === index ? null : index
                              )
                            }
                            className="text-muted-foreground hover:text-accent-foreground flex items-center justify-between w-full duration-150"
                          >
                            <span>{item.name}</span>
                            {mobileDropdownOpen === index ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          {mobileDropdownOpen === index && (
                            <div className="mt-3 ml-4 space-y-3">
                              {item.isBlogDropdown
                                ? // Layout spécial pour Blog mobile
                                  item.dropdownItems.map(
                                    (dropdownItem, dropdownIndex) => (
                                      <Link
                                        key={dropdownIndex}
                                        href={dropdownItem.href}
                                        className="flex flex-col gap-3 p-4 hover:bg-gray-50 hover:rounded-lg transition-all duration-200"
                                        onClick={() => {
                                          setMenuState(false);
                                          setMobileDropdownOpen(null);
                                        }}
                                      >
                                        <div className="w-full h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                                          {dropdownIndex === 0 ? (
                                            <TrendingUp
                                              size={24}
                                              className="text-gray-400"
                                            />
                                          ) : dropdownIndex === 1 ? (
                                            <Rocket
                                              size={24}
                                              className="text-gray-400"
                                            />
                                          ) : (
                                            <Lightbulb
                                              size={24}
                                              className="text-gray-400"
                                            />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <h3 className="text-[#171717] text-sm mb-1">
                                            {dropdownItem.name}
                                          </h3>
                                          <p className="text-xs text-gray-500 leading-relaxed">
                                            {dropdownItem.description}
                                          </p>
                                        </div>
                                      </Link>
                                    )
                                  )
                                : // Layout standard pour Produits
                                  item.dropdownItems.map(
                                    (dropdownItem, dropdownIndex) => (
                                      <Link
                                        key={dropdownIndex}
                                        href={dropdownItem.href}
                                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                        onClick={() => {
                                          setMenuState(false);
                                          setMobileDropdownOpen(null);
                                        }}
                                      >
                                        <div
                                          className={`w-8 h-8 ${dropdownItem.bgColor} rounded-lg flex items-center justify-center ${dropdownItem.textColor} flex-shrink-0 bg-opacity-30`}
                                        >
                                          {dropdownItem.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="text-[#171717] text-sm font-medium mb-1">
                                            {dropdownItem.name}
                                          </h3>
                                          <p className="text-xs text-gray-500 leading-relaxed">
                                            {dropdownItem.description}
                                          </p>
                                        </div>
                                      </Link>
                                    )
                                  )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                          onClick={() => setMenuState(false)}
                        >
                          <span>{item.name}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buttons at bottom */}
              <div className="px-4 pb-6 pt-4 border-t border-gray-100 bg-white">
                <div className="flex flex-col space-y-3">
                  {session.session ? (
                    <Button
                      asChild
                      size="sm"
                      variant="default"
                      className="w-full"
                    >
                      <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Link
                          href="/auth/login"
                          className="flex items-center justify-center"
                        >
                          <span>Connexion</span>
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="w-full">
                        <Link
                          href="/auth/signup"
                          className="flex items-center justify-center"
                        >
                          <span>Inscription</span>
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

const Logo = ({ className }) => {
  return (
    <div className="relative inline-block">
      <img
        src={getAssetUrl("NewbiLogo.svg")}
        alt="Logo newbi"
        width="100"
        height="100"
      />
      <svg
        width="19"
        height="19"
        viewBox="0 0 19 19"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute"
        style={{
          top: "-9px",
          left: "11px",
          width: "21px",
          height: "21px",
          rotate: "10deg",
        }}
      >
        <path
          d="M17.0894 12.8551C17.0172 13.2886 16.992 14.181 16.8889 14.548C16.8082 14.8355 16.7294 15.0784 16.6409 15.2945C16.2212 16.3188 14.8058 16.2029 13.9539 15.4961C11.8935 13.7866 8.28389 11.3723 5.44925 11.5199C3.60053 11.5199 2.78441 12.2557 1.4747 12.2187C0.462474 12.1901 0.419678 11.1702 0.419678 10.7253C0.419678 9.17739 1.55009 6.94355 2.39598 5.63987C2.67037 5.21699 3.12148 4.94317 3.6252 4.92362C5.66959 4.84428 8.66419 5.47922 10.055 6.05561C11.8624 6.80443 17.4742 5.01432 18.0654 8.17788C18.2019 8.90825 17.2877 11.6655 17.0894 12.8551Z"
          fill="#4B5563"
        ></path>
        <path
          d="M14.058 15.0757C14.4647 16.1463 13.7261 17.6881 12.6525 18.096C11.5789 18.5039 9.97218 17.4173 9.56547 16.3467C9.15876 15.2762 9.7717 14.268 10.8453 13.8601C11.9189 13.4522 13.6513 14.0051 14.058 15.0757Z"
          fill="#4B5563"
        ></path>
        <path
          d="M16.1484 13.3764C16.1484 13.8639 16.1168 14.2139 16.0254 14.5047C15.7048 15.5244 14.2246 15.3306 13.408 14.6408C11.4715 13.0052 8.10014 10.6455 5.47229 10.7758C3.75121 10.7758 2.66599 11.6546 1.44671 11.6218C0.504369 11.5964 0.51242 10.995 0.51242 10.6008C0.51242 9.23692 1.64568 6.94835 2.46272 5.68202C2.72996 5.26782 3.17423 5.00794 3.66678 4.98872C5.59668 4.91345 8.47203 5.42532 9.76002 5.93343C11.8312 6.75022 16.1484 10.557 16.1484 13.3764Z"
          fill="white"
        ></path>
        <path
          d="M15.582 12.1143C15.6921 12.1143 15.8002 12.1226 15.9062 12.1348C16.0599 12.561 16.1484 12.9779 16.1484 13.376C16.1484 13.8635 16.1168 14.2141 16.0254 14.5049C15.7047 15.5244 14.2248 15.3303 13.4082 14.6406C13.3452 14.5874 13.2799 14.5342 13.2139 14.4795C13.1939 14.3736 13.1816 14.265 13.1816 14.1543C13.1819 13.0278 14.2565 12.1143 15.582 12.1143Z"
          fill="#fff"
        ></path>
        <path
          d="M17.9819 8.23983C17.9819 11.3505 17.1426 10.8132 16.0906 12.9176C15.6714 10.8974 15.1672 13.4229 12.5547 15.1421C11.8451 15.609 11.9397 15.5814 11.4871 15.1421C11.4871 13.1202 10.9116 8.10991 10.1557 7.0614C9.27191 5.83531 5.67518 4.99652 3.7019 4.99652C5.38417 2.01401 5.3475 0.159215 6.86264 0.15918C8.88407 0.15918 10.5602 3.64347 13.0577 4.53618C15.9771 5.57968 17.9819 6.56336 17.9819 8.23983Z"
          fill="#D8001B"
        ></path>
        <path
          d="M13.0397 15.0393C13.3801 15.9353 13.0054 17.1366 12.1095 17.477C11.2135 17.8174 10.1356 17.1678 9.79528 16.2719C9.45491 15.376 9.9658 14.533 10.8617 14.1927C11.7577 13.8523 12.6994 14.1434 13.0397 15.0393Z"
          fill="#fff"
        ></path>
        <path
          d="M17.9771 8.11267C17.9796 8.15455 17.9819 8.19685 17.9819 8.23962C17.9819 11.3503 17.1423 10.813 16.0903 12.9174C15.9222 12.1074 15.7423 12.0298 15.4165 12.3363C16.0977 11.45 17.5889 10.3388 17.9565 8.11169C17.9634 8.1117 17.9702 8.11245 17.9771 8.11267Z"
          fill="#B8000F"
        ></path>
      </svg>
    </div>
  );
};

export default HeroHeader;
