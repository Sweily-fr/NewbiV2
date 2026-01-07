"use client";
import React from "react";
import Link from "next/link";

// Icône étoile pour les ratings
const StarIcon = () => (
  <svg
    width="15"
    height="14"
    viewBox="0 0 15 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.1141 2.01454C7.24855 1.74216 7.31577 1.60596 7.40703 1.56245C7.48644 1.52459 7.57869 1.52459 7.65809 1.56245C7.74935 1.60596 7.81658 1.74215 7.95103 2.01454L9.22659 4.59868C9.26628 4.6791 9.28613 4.7193 9.31513 4.75052C9.34081 4.77816 9.37161 4.80056 9.40582 4.81646C9.44446 4.83443 9.48882 4.84092 9.57756 4.85389L12.4308 5.27093C12.7313 5.31485 12.8815 5.33681 12.951 5.41019C13.0115 5.47404 13.0399 5.56177 13.0284 5.64897C13.0152 5.74919 12.9064 5.85512 12.6889 6.06699L10.6251 8.07718C10.5607 8.13984 10.5286 8.17117 10.5078 8.20845C10.4894 8.24146 10.4776 8.27773 10.4731 8.31523C10.4679 8.35759 10.4755 8.40185 10.4907 8.49037L10.9777 11.3297C11.0291 11.6291 11.0547 11.7789 11.0065 11.8677C10.9645 11.945 10.8898 11.9993 10.8033 12.0153C10.7039 12.0337 10.5695 11.963 10.3005 11.8216L7.74977 10.4802C7.6703 10.4384 7.63056 10.4175 7.58869 10.4093C7.55163 10.402 7.5135 10.402 7.47643 10.4093C7.43457 10.4175 7.39483 10.4384 7.31535 10.4802L4.76459 11.8216C4.49567 11.963 4.36121 12.0337 4.26179 12.0153C4.17528 11.9993 4.10064 11.945 4.05865 11.8677C4.01039 11.7789 4.03607 11.6291 4.08743 11.3297L4.5744 8.49037C4.58958 8.40185 4.59717 8.35759 4.59204 8.31523C4.58749 8.27773 4.5757 8.24146 4.55732 8.20845C4.53656 8.17117 4.5044 8.13984 4.44006 8.07718L2.37621 6.06699C2.15869 5.85512 2.04993 5.74919 2.03669 5.64897C2.02518 5.56177 2.05362 5.47404 2.11411 5.41019C2.18364 5.33681 2.33387 5.31485 2.63433 5.27093L5.48757 4.85389C5.5763 4.84092 5.62067 4.83443 5.6593 4.81646C5.69351 4.80056 5.72431 4.77816 5.74999 4.75052C5.779 4.7193 5.79884 4.6791 5.83854 4.59868L7.1141 2.01454Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Icône France
const FranceIcon = () => (
  <svg
    width="15"
    height="14"
    viewBox="0 0 15 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.0796 4.13337H10.9872C11.0436 3.80506 11.2469 3.6213 11.6585 3.41304L12.0432 3.21703C12.7317 2.86421 13.0992 2.46484 13.0992 1.81311C13.0992 1.40394 12.94 1.08052 12.6239 0.847762C12.3078 0.615001 11.9354 0.499845 11.4993 0.499845C11.1619 0.495878 10.8307 0.590391 10.5462 0.771809C10.2595 0.948217 10.0464 1.17608 9.91406 1.46029L10.5192 2.06792C10.7545 1.5926 11.095 1.35984 11.5434 1.35984C11.9232 1.35984 12.1559 1.55585 12.1559 1.82781C12.1559 2.05567 12.0432 2.24433 11.6071 2.46484L11.3596 2.5849C10.8231 2.85686 10.4506 3.16803 10.235 3.52084C10.0194 3.87366 9.91406 4.31713 9.91406 4.85371V5.00072H13.0796V4.13337Z"
      fill="currentColor"
    />
    <path
      d="M12.8002 6.00031H9.33575L7.60352 8.99925H11.068L12.8002 12.0006L14.5325 8.99925L12.8002 6.00031Z"
      fill="currentColor"
    />
    <path
      d="M7.90258 11.001C5.69747 11.001 3.90154 9.2051 3.90154 6.99999C3.90154 4.79489 5.69747 2.99895 7.90258 2.99895L9.2722 0.134757C8.82118 0.045069 8.36243 -6.68512e-05 7.90258 7.43158e-08C4.03629 7.43158e-08 0.902588 3.1337 0.902588 6.99999C0.902588 10.8663 4.03629 14 7.90258 14C9.38422 14.0028 10.828 13.5324 12.0237 12.6573L10.5095 10.0308C9.78511 10.6565 8.85983 11.0009 7.90258 11.001Z"
      fill="currentColor"
    />
  </svg>
);

export default function HeroSection() {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-[#FDFDFD]">
      {/* Mockup iPhone - Position absolue à gauche, sort de l'écran */}
      <div
        className="hidden lg:block absolute -left-0 xl:-left-[-80px] bottom-[-30px] z-0"
        style={{ bottom: "-160px" }}
      >
        <div className="relative w-[200px] xl:w-[240px]">
          <img
            src="/mockup-iphone-hero-section.png"
            alt="Application mobile Newbi"
            className="w-full h-auto object-contain"
          />
          {/* Gradient blanc en bas */}
          <div
            className="absolute bottom-0 left-0 right-0 h-70 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, #FDFDFD 0%, #FDFDFD 60%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* Mockup Mac - Position absolue à droite, sort de l'écran */}
      <div
        className="hidden lg:block absolute -right-8 xl:-right-90 z-0"
        style={{ bottom: "-150px" }}
      >
        <div className="relative w-[700px] xl:w-[800px]">
          <img
            src="/mockup-mac-hero-section.png"
            alt="Dashboard Newbi sur Mac"
            className="w-full h-auto object-contain"
          />

          {/* Badge Facturation - Coin haut gauche */}
          <img
            src="/badgeFacturation.png"
            alt="Badge Facturation"
            className="absolute top-1 left-[-50px] w-[120px] xl:w-[140px] h-auto object-contain drop-shadow-lg z-10"
          />

          {/* Gradient blanc en bas */}
          <div
            className="absolute bottom-0 left-0 right-0 h-70 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, #FDFDFD 0%, #FDFDFD 60%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* Contenu central - Au-dessus des mockups */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-28 text-center">
        {/* Badge animé */}
        <p
          className="relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent [background-repeat:no-repeat,padding-box] text-sm font-normal mb-6"
          style={{
            "--spread": "68px",
            "--base-color": "#6366f1",
            "--base-gradient-color": "#ffffff",
            backgroundImage:
              "linear-gradient(90deg, transparent calc(50% - 68px), #ffffff, transparent calc(50% + 68px)), linear-gradient(#6366f1, #6366f1)",
            backgroundPosition: "0% center",
            animation: "shimmer 3s ease-in-out infinite",
          }}
        >
          Pour les entrepreneurs et PME françaises.
        </p>

        {/* Titre principal H1 */}
        <h1 className="text-6xl font-normal tracking-tight text-black dark:text-white mb-6">
          La plateforme tout-en-un pour <br /> piloter votre{" "}
          <span className="text-indigo-600">entreprise</span>
        </h1>

        {/* Sous-titre */}
        <h2 className="text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-3xl">
          Gérez votre comptabilité, vos factures, vos projets et votre
          communication professionnelle depuis une seule plateforme. Simple,
          puissant et made in France.
        </h2>

        {/* Boutons CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/auth/signup"
            className="block rounded-xl px-8 py-3 text-center text-base font-normal transition duration-150 active:scale-[0.98] bg-[#202020] text-white dark:bg-white dark:text-black hover:bg-gray-800 w-full sm:w-auto"
          >
            Démarrer gratuitement
          </Link>
          <Link
            href="/#pricing"
            className="block rounded-xl px-8 py-3 text-center text-base font-normal active:scale-[0.98] border border-gray-200 bg-white text-black transition duration-200 hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 w-full sm:w-auto"
          >
            Voir les tarifs
          </Link>
        </div>

        {/* Section avis / social proof */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <FranceIcon />
          <div className="flex items-center gap-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ opacity: 1 }}>
                <StarIcon />
              </div>
            ))}
          </div>
          <span className="border-l border-gray-500 pl-3 text-xs sm:text-sm text-gray-600">
            Solution innovante 2026 par
          </span>
          <img
            src="/newbiLetter.png"
            alt="newbi logo"
            className="w-[70px] ml-[-12px] h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}
