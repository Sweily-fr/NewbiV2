"use client";
import React from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard } from "lucide-react";
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
  { name: "Tarifs", href: "#pricing" },
  { name: "Ressources", href: "/blog" },
];

const HeroHeader = ({ className }) => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState(null);
  const [dropdownTimeout, setDropdownTimeout] = React.useState(null);
  const session = useUser();
  console.log(session.session, "session");

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
        className="fixed z-20 w-full px-2 py-4 group"
      >
        <div
          className={cn(
            "mx-auto mt-4 bg-[#fff] rounded-2xl shadow-xs max-w-4xl px-2 transition-all duration-300 lg:px-3",
            isScrolled &&
              "mt-0 bg-background/50 backdrop-blur-lg border max-w-3xl"
            // "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-6"
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

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
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
                        className="absolute w-150 shadow-none top-full left-1/2 transform -translate-x-1/2 mt-10 p-3 z-50"
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
                      </Card>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
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
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      // className={cn(isScrolled && "lg:hidden")}
                    >
                      <Link href="/auth/login">
                        <span>Connexion</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      // className={cn(isScrolled && "lg:hidden")}
                    >
                      <Link href="/auth/signup">
                        <span>Inscription</span>
                      </Link>
                    </Button>
                    {/* <Button
                      asChild
                      size="sm"
                      className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
                    >
                      <Link href="/auth/signup">
                        <span>Commencez</span>
                      </Link>
                    </Button> */}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

const Logo = ({ className }) => {
  return (
    <img
      src="http://localhost:3000/newbiLogo.png"
      alt="Logo newbi"
      //   className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block"
      width="100"
      height="100"
    />
  );
};

export default HeroHeader;
