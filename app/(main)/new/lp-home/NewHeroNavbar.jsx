"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DocumentTextIcon,
  TrendUpIcon,
  ShoppingCartIcon,
  ReceiptItemIcon,
  SmsIcon,
  DocumentCloudIcon,
  TaskIcon,
  Book2Icon,
  NoteTextIcon,
} from "@/src/components/icons";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  Camera,
  ChevronDown,
  CreditCard,
  Equal,
  FileText,
  HardHat,
  HeartHandshake,
  HelpCircle,
  Info,
  Kanban,
  Landmark,
  Mail,
  Quote,
  Receipt,
  Rocket,
  Scale,
  Share2,
  Stethoscope,
  TrendingUp,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  WhatsAppContactButton,
  WhatsAppIcon,
  WHATSAPP_CONTACT_URL,
} from "@/src/components/whatsapp-contact-button";
import React from "react";
import { cn } from "@/src/lib/utils";
import { useSession } from "@/src/lib/auth-client";
import { SIGNUP_HREF, CTA_LABEL } from "@/app/lp/_components/lp-config";

// Landing pages Ads sur lesquelles la navbar adapte ses CTA (libellé +
// couleur du bouton d'inscription). À étendre si d'autres LP l'utilisent.
const ADS_LP_PATHS = [
  "/lp/facturation-electronique",
  "/lp/facturation-auto-entrepreneur",
  "/lp/gestion",
];

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
            icon: <DocumentTextIcon width={18} height={18} />,
            href: "/produits/factures",
          },
          {
            name: "Suivi de trésorerie",
            description: "Gardez le contrôle de vos flux financiers",
            icon: <TrendUpIcon width={18} height={18} />,
            href: "/produits/tresorerie",
          },
          {
            name: "Gestion des achats",
            description: "Gérez vos achats simplement. Contrôlez vos dépenses.",
            icon: <ShoppingCartIcon width={18} height={18} />,
            href: "/produits/gestion-des-achats",
          },
          {
            name: "Facturation électronique",
            description: "Conformité 2026 garantie avec l'e-invoicing",
            icon: <ReceiptItemIcon width={18} height={18} />,
            href: "/produits/facturation-electronique",
            // Incluse sans supplément : on l'annonce dès le menu
            badge: "Gratuit",
          },
        ],
      },
      {
        title: "AUTRES OUTILS",
        items: [
          {
            name: "Gestion de projets",
            description: "Organisez vos projets avec des tableaux Kanban",
            icon: <TaskIcon width={18} height={18} />,
            href: "/produits/kanban",
          },
          {
            name: "Transfert de fichiers",
            description: "Envoyez vos fichiers en toute sécurité",
            icon: <DocumentCloudIcon width={18} height={18} />,
            href: "/produits/transfers",
          },
          {
            name: "Signature de mail",
            description: "Créez des signatures professionnelles",
            icon: <SmsIcon width={18} height={18} />,
            href: "/produits/signatures",
          },
          // {
          //   name: "Partage de documents",
          //   description: "Partagez vos documents en toute sécurité",
          //   icon: <Share2 size={18} />,
          //   href: "/produits/documents",
          // },
        ],
      },
    ],
  },
  // Menu d'audience : à gauche les formes juridiques, au milieu les métiers.
  // Les destinations sont les pages qui existent réellement aujourd'hui —
  // la LP auto-entrepreneur et les hubs sectoriels du blog.
  {
    name: "Pour qui",
    href: "#link",
    hasDropdown: true,
    dropdownColumns: [
      {
        title: "STATUT",
        items: [
          {
            name: "Auto-entrepreneur",
            description: "Facturez sans TVA et sans vous tromper",
            icon: <UserRound size={18} />,
            href: "/auto-entrepreneur",
          },
          {
            name: "SASU et EURL",
            description: "La gestion d'une société à associé unique",
            icon: <Rocket size={18} />,
            href: "/sasu-eurl",
          },
          {
            name: "SCI",
            description: "Loyers, charges et factures de travaux",
            icon: <Building2 size={18} />,
            href: "/sci",
          },
          {
            name: "Entreprise individuelle",
            description: "Vos obligations et vos documents en EI",
            icon: <Zap size={18} />,
            href: "/entreprise-individuelle",
          },
          {
            name: "Association",
            description: "Factures, dépenses et pièces justificatives",
            icon: <HeartHandshake size={18} />,
            href: "/association",
          },
        ],
      },
      {
        title: "MÉTIER",
        items: [
          {
            name: "BTP et artisans",
            description: "Devis de chantier, acomptes et situations",
            icon: <HardHat size={18} />,
            href: "/btp-artisans",
          },
          {
            name: "Professions médicales",
            description: "Facturation et obligations de votre cabinet",
            icon: <Stethoscope size={18} />,
            href: "/professions-medicales",
          },
          {
            name: "Avocats",
            description: "Honoraires, provisions et débours",
            icon: <Scale size={18} />,
            href: "/avocats",
          },
          {
            name: "Photographes et créatifs",
            description: "Cessions de droits, acomptes et livrables",
            icon: <Camera size={18} />,
            href: "/photographes-creatifs",
          },
        ],
      },
    ],
  },
  {
    name: "Ressources",
    href: "#link",
    hasDropdown: true,
    dropdownColumns: [
      {
        title: "À PROPOS",
        items: [
          {
            name: "Documentation",
            description: "Guides et tutoriels pour maîtriser newbi",
            icon: <Book2Icon width={18} height={18} />,
            href: "https://docs.newbi.fr/",
          },
          {
            name: "Blog",
            description: "Actualités, conseils et bonnes pratiques",
            icon: <NoteTextIcon width={18} height={18} />,
            href: "/blog",
          },
          {
            name: "Qui sommes-nous",
            description: "Découvrez l'équipe et la vision de newbi",
            icon: <Info size={18} />,
            href: "/qui-sommes-nous",
          },
          // {
          //   name: "Questions fréquentes",
          //   description: "Tout ce que vous devez savoir avant de commencer",
          //   icon: <HelpCircle size={18} />,
          //   href: "/faq",
          // },
          // {
          //   name: "Pourquoi choisir Newbi",
          //   description:
          //     "Les avantages qui font vraiment la différence au quotidien.",
          //   icon: <Award size={18} />,
          //   href: "/pourquoi-newbi",
          // },
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
  { name: "Tarifs", href: "/tarifs" },
  { name: "Contact", href: "/contact" },
];

export function NewHeroNavbar({ hasBanner = false, solidBackground = false }) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const pathname = usePathname();
  const isAdsLp = ADS_LP_PATHS.includes(pathname);
  // CTA d'inscription : toujours en violet Newbi. Sur une LP Ads, il reprend le
  // libellé partagé des LP (« Commencer gratuitement »).
  const signupHref = isAdsLp ? SIGNUP_HREF : "/auth/signup";
  const signupLabel = isAdsLp ? CTA_LABEL : "Essayer Newbi gratuitement";

  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [onDark, setOnDark] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState(null);
  // Le menu qui se referme reste monté le temps de son animation de sortie.
  const [closingDropdown, setClosingDropdown] = React.useState(null);
  const closeTimer = React.useRef(null);

  // L'index courant est suivi dans une ref : la fermeture a besoin de le lire
  // sans passer par un updater de state (les effets de bord y sont proscrits).
  const openRef = React.useRef(null);

  const openMenu = (index) => {
    clearTimeout(closeTimer.current);
    openRef.current = index;
    setClosingDropdown(null);
    setOpenDropdown(index);
  };

  const closeMenu = () => {
    const current = openRef.current;
    if (current === null) return;
    openRef.current = null;
    setOpenDropdown(null);
    setClosingDropdown(current);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setClosingDropdown(null), 160);
  };

  React.useEffect(() => () => clearTimeout(closeTimer.current), []);
  const [mobileDropdownOpen, setMobileDropdownOpen] = React.useState(null);
  const [bannerVisible, setBannerVisible] = React.useState(hasBanner);

  // Listen for banner close event
  React.useEffect(() => {
    const handleBannerClosed = () => setBannerVisible(false);
    window.addEventListener("banner-closed", handleBannerClosed);
    return () =>
      window.removeEventListener("banner-closed", handleBannerClosed);
  }, []);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (menuState) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuState]);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // La navbar s'inverse quand elle survole une section sombre. Les sections
  // concernées se déclarent avec data-nav-theme="dark" : sur les pages qui
  // n'en ont pas, l'observateur ne se monte même pas.
  React.useEffect(() => {
    const targets = document.querySelectorAll('[data-nav-theme="dark"]');
    if (!targets.length) return;

    let io;
    const visible = new Set();
    const NAV_HEIGHT = 68;

    const observe = () => {
      io?.disconnect();
      visible.clear();
      // La racine est réduite à une bande de la hauteur de la navbar, en haut
      // de l'écran : une section n'« intersecte » donc que lorsqu'elle passe
      // dessous.
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) =>
            e.isIntersecting ? visible.add(e.target) : visible.delete(e.target),
          );
          setOnDark(visible.size > 0);
        },
        {
          rootMargin: `0px 0px -${Math.max(0, window.innerHeight - NAV_HEIGHT)}px 0px`,
        },
      );
      targets.forEach((t) => io.observe(t));
    };

    observe();
    window.addEventListener("resize", observe);
    return () => {
      io?.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, []);

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className={`fixed left-0 w-full z-100 transition-all duration-300 ${
          bannerVisible
            ? isScrolled
              ? "top-0"
              : "top-[80px] sm:top-[58px]"
            : "top-0"
        }`}
      >
        <div
          className={cn(
            "w-full px-6 lg:px-12 transition-colors duration-300",
            (isScrolled || solidBackground) &&
              !onDark &&
              "bg-[#FDFDFD] dark:bg-background border-b border-gray-200 dark:border-neutral-800",
            onDark &&
              "bg-[#0B0B0C]/55 backdrop-blur-xl backdrop-saturate-150 border-b border-white/10",
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
                  className={cn(
                    "object-contain transition-[filter] duration-300",
                    onDark && "brightness-0 invert",
                  )}
                />
              </Link>

              <div className="flex items-center gap-2 lg:hidden">
                <Button
                  asChild
                  variant={isLoggedIn ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "transition-colors duration-300",
                    onDark && !isLoggedIn && "text-white hover:bg-white/10",
                  )}
                >
                  <Link
                    href={isLoggedIn ? "/mobile-non-disponible" : "/auth/login"}
                  >
                    <span>
                      {isLoggedIn ? "Continuer sur l'app" : "Connexion"}
                    </span>
                  </Link>
                </Button>
                <button
                  onClick={() => {
                    setMenuState(!menuState);
                    if (menuState) setMobileDropdownOpen(null);
                  }}
                  aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                  className={cn(
                    "relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 transition-colors duration-300",
                    onDark && "text-white",
                  )}
                >
                  <Equal className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                  <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                </button>
              </div>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm font-medium leading-5 tracking-tight">
                {menuItems.map((item, index) => (
                  <li key={index} className="relative group">
                    {item.hasDropdown ? (
                      <span
                        className={cn(
                          "flex items-center gap-1 cursor-pointer transition-colors duration-300 hover:opacity-70",
                          onDark ? "text-white" : "text-[#242529]",
                        )}
                        onMouseEnter={() => openMenu(index)}
                      >
                        {item.name}
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-200",
                            openDropdown === index && "rotate-180",
                          )}
                          aria-hidden="true"
                        />
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "block transition-colors duration-300 hover:opacity-70",
                          onDark ? "text-white" : "text-[#242529]",
                        )}
                      >
                        <span>{item.name}</span>
                      </Link>
                    )}

                    {/* Dropdown Menu */}
                    {item.hasDropdown &&
                      (openDropdown === index || closingDropdown === index) && (
                        <div
                          className={cn(
                            // Apparition et disparition : léger glissement
                            // vertical et fondu, façon Notion.
                            "absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-50 dark:bg-background border rounded-2xl shadow-sm p-6 z-50",
                            openDropdown === index
                              ? "animate-in fade-in-0 slide-in-from-top-2 duration-200 ease-out"
                              : "animate-out fade-out-0 slide-out-to-top-2 duration-150 ease-in",
                            item.dropdownColumns?.length === 1
                              ? "w-[600px]"
                              : "w-[850px]",
                          )}
                          onMouseEnter={() => openMenu(index)}
                          onMouseLeave={closeMenu}
                        >
                          <div
                            className={cn(
                              "grid gap-6",
                              item.dropdownColumns?.length === 1
                                ? "grid-cols-2"
                                : "grid-cols-3",
                            )}
                          >
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
                                      onClick={closeMenu}
                                    >
                                      <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                                        {dropdownItem.icon}
                                      </div>
                                      <div className="flex-1">
                                        <p className="flex items-center gap-2 font-normal text-sm text-gray-900 dark:text-white">
                                          {dropdownItem.name}
                                          {dropdownItem.badge && (
                                            <span className="rounded-md bg-[#E4E2FF] px-1.5 py-0.5 text-[10px] font-medium text-[#5A50FF]">
                                              {dropdownItem.badge}
                                            </span>
                                          )}
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
                              /* Visuel de la carte « Gestion de projets » de
                               la LP home, puis le titre et le texte en
                               dessous. Le bloc entier est cliquable. */
                              <Link
                                href="/produits/facturation-electronique"
                                onClick={closeMenu}
                                className="group flex flex-col"
                              >
                                <div className="relative flex-1 min-h-[180px] overflow-hidden rounded-xl">
                                  <img
                                    src="/images/lp-home/tools/projets.png"
                                    alt=""
                                    className="absolute inset-0 size-full object-cover"
                                  />
                                  {/* La flèche sort par le haut et une seconde
                                    revient par le bas */}
                                  <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/25 ring-1 ring-white/40 backdrop-blur-sm text-white transition-colors group-hover:bg-white/40">
                                    <span className="relative block size-4 overflow-hidden">
                                      <ArrowUpRight
                                        size={16}
                                        className="absolute inset-0 transition-transform duration-500 ease-out group-hover:-translate-y-full"
                                      />
                                      <ArrowUpRight
                                        size={16}
                                        className="absolute inset-0 translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0"
                                      />
                                    </span>
                                  </span>

                                  {/* Badge de conformité, posé dans l'angle bas
                                    droit de la photo */}
                                  <span className="absolute bottom-3 right-3 rounded-md bg-white px-2 py-1.5 shadow-sm">
                                    <img
                                      src="/logo_Compatible_Facturation_electronique-footer.png"
                                      alt="Solution compatible Facturation électronique"
                                      className="h-7 w-auto object-contain"
                                    />
                                  </span>
                                </div>

                                <h3 className="mt-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                                  FACTURATION ÉLECTRONIQUE
                                  {/* Incluse sans supplément : autant le dire
                                      dès le menu */}
                                  <span className="rounded-md bg-[#E4E2FF] px-2 py-0.5 text-[11px] font-medium text-[#5A50FF]">
                                    Gratuit
                                  </span>
                                </h3>
                                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                                  Préparez-vous dès maintenant à l'obligation de
                                  facturation électronique
                                </p>
                              </Link>
                            ) : item.name === "Pour qui" ? (
                              /* Troisième colonne du menu « Pour qui » : la photo
                                 en haut, le message dessous, et le lien vers un
                                 conseiller. Le bloc entier est cliquable. */
                              <Link
                                href="/contact"
                                onClick={closeMenu}
                                className="group flex flex-col"
                              >
                                <div className="relative flex-1 min-h-[180px] overflow-hidden rounded-xl">
                                  <img
                                    src="/lp/facturation-electronique/cta-laptop.jpg"
                                    alt=""
                                    className="absolute inset-0 size-full object-cover"
                                  />
                                  {/* Même flèche roulante que les autres
                                      colonnes de visuel */}
                                  <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/25 ring-1 ring-white/40 backdrop-blur-sm text-white transition-colors group-hover:bg-white/40">
                                    <span className="relative block size-4 overflow-hidden">
                                      <ArrowUpRight
                                        size={16}
                                        className="absolute inset-0 transition-transform duration-500 ease-out group-hover:-translate-y-full"
                                      />
                                      <ArrowUpRight
                                        size={16}
                                        className="absolute inset-0 translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0"
                                      />
                                    </span>
                                  </span>
                                </div>

                                <h3 className="mt-4 text-lg font-medium leading-snug text-gray-900 dark:text-white">
                                  Découvrez si newbi est adapté à votre activité
                                </h3>
                                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#5A50FF]">
                                  Échanger avec un conseiller
                                  <ArrowRight
                                    size={14}
                                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                                  />
                                </span>
                              </Link>
                            ) : (
                              /* Même traitement que le bloc « Facturation
                                 électronique » du menu Produits : la photo en
                                 haut, le texte dessous, le bloc cliquable. */
                              <a
                                href={WHATSAPP_CONTACT_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeMenu}
                                className="group flex flex-col"
                              >
                                <div className="relative flex-1 min-h-[180px] overflow-hidden rounded-xl">
                                  <img
                                    src="/lp/home/menu/accompagnement.jpg"
                                    alt=""
                                    className="absolute inset-0 size-full object-cover"
                                  />
                                  {/* La flèche sort par le haut et une seconde
                                      revient par le bas */}
                                  <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/25 ring-1 ring-white/40 backdrop-blur-sm text-white transition-colors group-hover:bg-white/40">
                                    <span className="relative block size-4 overflow-hidden">
                                      <ArrowUpRight
                                        size={16}
                                        className="absolute inset-0 transition-transform duration-500 ease-out group-hover:-translate-y-full"
                                      />
                                      <ArrowUpRight
                                        size={16}
                                        className="absolute inset-0 translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0"
                                      />
                                    </span>
                                  </span>

                                  {/* Pastille WhatsApp, dans l'angle bas droit */}
                                  <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white shadow-sm">
                                    <WhatsAppIcon className="size-5 text-[#25D366]" />
                                  </span>
                                </div>

                                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                                  FAITES-VOUS ACCOMPAGNER
                                </h3>
                                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                                  Une question, un doute ? Un conseiller newbi
                                  vous répond sur WhatsApp et vous aide à
                                  démarrer sereinement.
                                </p>
                              </a>
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
              {isLoggedIn ? (
                <Button asChild size="md">
                  <Link href="/dashboard">
                    <span>Tableau de bord</span>
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="md"
                    className={cn(
                      "transition-colors duration-300",
                      onDark && "text-white hover:bg-white/10",
                    )}
                  >
                    <Link href="/auth/login">
                      <span>Connexion</span>
                    </Link>
                  </Button>
                  <Button asChild size="md" variant="primary" className="px-4">
                    <Link href={signupHref}>
                      <span>{signupLabel}</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu overlay - Fullscreen */}
        {menuState && (
          <div
            className={`lg:hidden fixed inset-0 bg-[#FDFDFD] z-50 overflow-hidden transition-all duration-300 ${bannerVisible && !isScrolled ? "top-[148px] sm:top-[126px]" : "top-[65px]"}`}
          >
            <div className="flex flex-col h-full">
              {/* Menu content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-200/60">
                  {menuItems.map((item, index) => (
                    <div key={index}>
                      {item.hasDropdown ? (
                        <div>
                          {/* Accordion Header */}
                          <button
                            onClick={() =>
                              setMobileDropdownOpen(
                                mobileDropdownOpen === index ? null : index,
                              )
                            }
                            className="flex items-center justify-between w-full px-6 py-3.5 text-left"
                          >
                            <span className="text-base font-normal text-[#202020]">
                              {item.name}
                            </span>
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileDropdownOpen === index ? "rotate-180" : ""}`}
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
                            <div className="">
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
                                          <h4 className="flex items-center gap-2 text-sm font-medium text-black">
                                            {dropdownItem.name}
                                            {dropdownItem.badge && (
                                              <span className="rounded-md bg-[#E4E2FF] px-1.5 py-0.5 text-[10px] font-medium text-[#5A50FF]">
                                                {dropdownItem.badge}
                                              </span>
                                            )}
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
                          className="flex items-center w-full px-6 py-3.5"
                          onClick={() => setMenuState(false)}
                        >
                          <span className="text-base font-normal text-[#202020]">
                            {item.name}
                          </span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons at bottom - Fixed */}
              <div className="px-6 pb-8 pt-6 border-t border-gray-100">
                <div className="flex flex-col space-y-3">
                  {isLoggedIn ? (
                    <Button
                      asChild
                      size="lg"
                      className="w-full rounded-xl py-6 text-base bg-[#202020]"
                    >
                      <Link
                        href="/mobile-non-disponible"
                        className="flex items-center justify-center"
                        onClick={() => setMenuState(false)}
                      >
                        <span>Continuer sur l'app</span>
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        asChild
                        size="lg"
                        variant="primary"
                        className="w-full rounded-lg py-2 text-sm"
                      >
                        <Link
                          href={signupHref}
                          className="flex items-center justify-center"
                          onClick={() => setMenuState(false)}
                        >
                          <span>{signupLabel}</span>
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="default"
                        className="w-full rounded-lg py-2 text-sm border-gray-300"
                      >
                        <Link
                          href="/auth/login"
                          className="flex items-center justify-center"
                          onClick={() => setMenuState(false)}
                        >
                          <span>Se connecter</span>
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
}
