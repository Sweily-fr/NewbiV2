"use client";
import React from "react";
import { useSession } from "@/src/lib/auth-client";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { Button } from "@/src/components/ui/button";
import { getAssetUrl } from "@/src/lib/image-utils";

const defaultSections = [
  {
    title: "Produits",
    links: [
      { name: "Facturation", href: "#" },
      { name: "Devis", href: "#" },
      { name: "Signature Email", href: "#" },
      { name: "Optimisation Blog SEO", href: "#" },
      { name: "Tous nos outils", href: "#" },
    ],
  },
  {
    title: "Ressources",
    links: [
      // { name: "Blog", href: "#" },
      { name: "FAQ", href: "#" },
      { name: "Tarifs", href: "#" },
      { name: "Communauté", href: "#" },
    ],
  },
  {
    title: "Légal",
    links: [
      { name: "Conditions d'utilisation", href: "#" },
      { name: "Politique de confidentialité", href: "#" },
      { name: "CGV", href: "#" },
      { name: "Cookies", href: "#" },
    ],
  },
];

const defaultSocialLinks = [
  { icon: <FaInstagram className="size-5" />, href: "#", label: "Instagram" },
  { icon: <FaFacebook className="size-5" />, href: "#", label: "Facebook" },
  { icon: <FaTwitter className="size-5" />, href: "#", label: "Twitter" },
  { icon: <FaLinkedin className="size-5" />, href: "#", label: "LinkedIn" },
];

const defaultLegalLinks = [
  { name: "Conditions d'utilisation", href: "#" },
  { name: "Politique de confidentialité", href: "#" },
];

const Footer7 = ({
  logo = {
    url: "https://www.shadcnblocks.com",
    src: getAssetUrl("newbiLogo.png"),
    alt: "logo",
    title: "",
  },
  sections = defaultSections,
  description = "Simplifiez votre gestion d'entreprise avec nos outils innovants.",
  socialLinks = defaultSocialLinks,
  copyright = "Conçu avec ❤️ en France par Sweily",
  legalLinks = defaultLegalLinks,
}) => {
  const { data: session } = useSession();

  // Helper function to get the appropriate link based on authentication
  const getToolLink = (toolPath) => {
    return session?.user ? `/dashboard/outils/${toolPath}` : "/auth/login";
  };

  return (
    <div className="px-2 py-2 lg:px-2 bg-gradient-to-t from-[#fbd7d3] via-[#f6f7fc] to-[#cad8f7]">
      <div className="mx-auto w-full lg:px-8 rounded-[15px] md:rounded-[18px] lg:rounded-[18px] bg-white/50">
        <div className="relative pt-12 pb-12 md:pt-20 md:pb-16 text-center sm:py-24 px-4 md:px-0">
          <hgroup>
            <h2 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase">
              Commencez gratuitement aujourd'hui
            </h2>
            <p className="mt-4 md:mt-6 text-xl md:text-2xl lg:text-4xl font-medium tracking-tight text-gray-950">
              Prêt à simplifier votre gestion d'entreprise ?
              <br className="hidden md:block" />
              <span className="md:hidden"> </span>Commencez gratuitement
              aujourd'hui.
            </p>
          </hgroup>
          <p className="mx-auto mt-4 md:mt-6 max-w-sm text-sm/6 text-gray-500">
            Commencez à gagner plus rapidement avec NewBi.
          </p>
          <div className="mt-4 md:mt-6">
            <Button variant="default" asChild>
              <a href="/auth/signup">Essayez Gratuitement</a>
            </Button>
          </div>
        </div>
        <div className="pb-6">
          <div className="group/row relative isolate pt-[calc(--spacing(2)+1px)] last:pb-[calc(--spacing(2)+1px)]">
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2"
            >
              <div className="absolute inset-x-0 top-0 border-t border-black/5"></div>
              <div className="absolute inset-x-0 top-2 border-t border-black/5"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-8 md:gap-y-10 pt-4 md:pt-6 pb-4 md:pb-6 lg:grid-cols-6 lg:gap-8 px-4 md:px-0">
              <div className="col-span-1 sm:col-span-2 md:col-span-2 flex justify-center md:justify-start mb-6 sm:mb-4 md:mb-0">
                <div className="lg:pb-6 group/item relative">
                  <img
                    src="/newbiLogo.svg"
                    alt="logo"
                    width="80"
                    height="80"
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-[100px] md:h-[100px]"
                  />
                  {/* SVG elements can be added here */}
                </div>
              </div>
              <div className="col-span-1">
                <h3 className="text-sm/6 font-medium text-gray-950/50 mb-2 sm:mb-3 md:mb-6">
                  Produits
                </h3>
                <ul className="mt-2 sm:mt-3 md:mt-6 space-y-2 sm:space-y-3 md:space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={getToolLink("factures")}
                    >
                      Facturation
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={getToolLink("devis")}
                    >
                      Devis
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={getToolLink("transferts-fichiers")}
                    >
                      Transferts fichiers
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={getToolLink("gestion-depenses")}
                    >
                      Gestion des dépenses
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={getToolLink("kanban")}
                    >
                      Tableau Kanban
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={getToolLink("signatures-mail")}
                    >
                      Signatures de mail
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={session?.user ? "/dashboard/outils" : "/auth/login"}
                    >
                      Tous nos outils
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-span-1">
                <h3 className="text-sm/6 font-medium text-gray-950/50 mb-2 sm:mb-3 md:mb-6">
                  Ressources
                </h3>
                <ul className="mt-2 sm:mt-3 md:mt-6 space-y-2 sm:space-y-3 md:space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/blog"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/faq"
                    >
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/#pricing"
                    >
                      Tarifs
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-span-1">
                <h3 className="text-sm/6 font-medium text-gray-950/50 mb-2 sm:mb-3 md:mb-6">
                  Support
                </h3>
                <ul className="mt-2 sm:mt-3 md:mt-6 space-y-2 sm:space-y-3 md:space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL?mode=ems_copy_h_t"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Communauté
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-span-1">
                <h3 className="text-sm/6 font-medium text-gray-950/50 mb-2 sm:mb-3 md:mb-6">
                  Legal
                </h3>
                <ul className="mt-2 sm:mt-3 md:mt-6 space-y-2 sm:space-y-3 md:space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="mentions-legales"
                    >
                      Mentions légales
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="politique-de-confidentialite"
                    >
                      Politique de confidentialité
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="cgv"
                    >
                      CGV
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="cookies"
                    >
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between group/row relative isolate pt-[calc(--spacing(2)+1px)] last:pb-[calc(--spacing(2)+1px)] px-4 md:px-0 gap-4 sm:gap-0">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2"
          >
            <div className="absolute inset-x-0 top-0 border-t border-black/5"></div>
            <div className="absolute inset-x-0 top-2 border-t border-black/5"></div>
          </div>
          <div className="text-center sm:text-left">
            <div className="py-2 sm:py-3 group/item relative">
              <div className="text-xs sm:text-sm/6 text-gray-950">
                <a
                  href="https://www.sweily.fr"
                  className="hover:text-gray-700 transition-colors"
                >
                  Sweily
                </a>{" "}
                — Made with ❤️ in France • © {new Date().getFullYear()}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-4 sm:gap-6 md:gap-8 py-2 sm:py-3 group/item relative">
            <a
              target="_blank"
              aria-label="Visit us on Facebook"
              className="text-gray-950 hover:text-gray-700 transition-colors duration-200 p-1"
              href="https://facebook.com"
            >
              {/* Facebook Icon SVG */}
            </a>
            <a
              target="_blank"
              aria-label="Visit us on Twitter"
              className="text-gray-950 hover:text-gray-700 transition-colors duration-200 p-1"
              href="https://x.com"
            >
              {/* Twitter Icon SVG */}
            </a>
            <a
              target="_blank"
              aria-label="Visit us on LinkedIn"
              className="text-gray-950 hover:text-gray-700 transition-colors duration-200 p-1"
              href="https://linkedin.com"
            >
              {/* LinkedIn Icon SVG */}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer7;
