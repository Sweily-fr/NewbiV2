import React from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { Button } from "@/src/components/ui/button";

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
    src: "http://localhost:3000/newbiLogo.png",
    alt: "logo",
    title: "",
  },
  sections = defaultSections,
  description = "Simplifiez votre gestion d'entreprise avec nos outils innovants.",
  socialLinks = defaultSocialLinks,
  copyright = "Conçu avec ❤️ en France par Sweily",
  legalLinks = defaultLegalLinks,
}) => {
  return (
    <div className="px-2 py-2 lg:px-2 bg-gradient-to-t from-[#fbd7d3] via-[#f6f7fc] to-[#cad8f7]">
      <div className="mx-auto w-full lg:px-8 rounded-[15px] md:rounded-[18px] lg:rounded-[18px] bg-white/50">
        <div className="relative pt-20 pb-16 text-center sm:py-24">
          <hgroup>
            <h2 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase">
              Commencez gratuitement aujourd'hui
            </h2>
            <p className="mt-6 text-2xl font-medium tracking-tight text-gray-950 sm:text-4xl">
              Prêt à simplifier votre gestion d'entreprise ?
              <br />
              Commencez gratuitement aujourd'hui.
            </p>
          </hgroup>
          <p className="mx-auto mt-6 max-w-sm text-sm/6 text-gray-500">
            Commencez à gagner plus rapidement avec NewBi.
          </p>
          <div className="mt-6">
            <Button variant="default" asChild>
              <a href="/auth/login">Essayez Gratuitement</a>
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
            <div className="grid grid-cols-2 gap-y-10 pt-6 pb-6 lg:grid-cols-6 lg:gap-8">
              <div className="col-span-2 flex">
                <div className="lg:pb-6 group/item relative">
                  <img
                    src="/newbiLogo.svg"
                    alt="logo"
                    width="100"
                    height="100"
                  />
                  {/* SVG elements can be added here */}
                </div>
              </div>
              <div>
                <h3 className="text-sm/6 font-medium text-gray-950/50">
                  Produits
                </h3>
                <ul className="mt-6 space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      Facturation
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      Devis
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      Transferts fichiers
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      Tous nos outils
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm/6 font-medium text-gray-950/50">
                  Ressources
                </h3>
                <ul className="mt-6 space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      Tarifs
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm/6 font-medium text-gray-950/50">
                  Support
                </h3>
                <ul className="mt-6 space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      Communauté
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm/6 font-medium text-gray-950/50">
                  Legal
                </h3>
                <ul className="mt-6 space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      Mentions légales
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      Politique de confidentialité
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      CGV
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="#"
                    >
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between group/row relative isolate pt-[calc(--spacing(2)+1px)] last:pb-[calc(--spacing(2)+1px)]">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2"
          >
            <div className="absolute inset-x-0 top-0 border-t border-black/5"></div>
            <div className="absolute inset-x-0 top-2 border-t border-black/5"></div>
          </div>
          <div>
            <div className="py-3 group/item relative">
              <div className="text-sm/6 text-gray-950">
                <a href="https://www.sweily.fr">Sweily</a> — Made with ❤️ in
                France • © {new Date().getFullYear()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 py-3 group/item relative">
            <a
              target="_blank"
              aria-label="Visit us on Facebook"
              className="text-gray-950 hover:text-gray-700"
              href="https://facebook.com"
            >
              {/* Facebook Icon SVG */}
            </a>
            <a
              target="_blank"
              aria-label="Visit us on Twitter"
              className="text-gray-950 hover:text-gray-700"
              href="https://x.com"
            >
              {/* Twitter Icon SVG */}
            </a>
            <a
              target="_blank"
              aria-label="Visit us on LinkedIn"
              className="text-gray-950 hover:text-gray-700"
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

export { Footer7 };
