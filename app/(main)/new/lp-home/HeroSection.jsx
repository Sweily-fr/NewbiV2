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
    <div className="relative w-full h-screen mb-10 lg:mb-45 bg-[#FDFDFD]">
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {/* Mockup iPhone - Position absolue à gauche, sort de l'écran */}
        <div
          className="hidden lg:block absolute -left-0 xl:-left-[-100px] bottom-[-30px] z-0"
          style={{ bottom: "-160px" }}
        >
          <div className="relative w-[200px] xl:w-[240px]">
            <img
              src="/mockup-iphone-hero.png"
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
            {/* <img
              src="/badgeFacturation.png"
              alt="Badge Facturation"
              className="absolute top-1 left-[-50px] w-[120px] xl:w-[140px] h-auto object-contain drop-shadow-lg z-10"
            /> */}

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
        <div className="relative z-10 max-w-4xl mx-auto px-4 pb-10 lg:pb-40 text-center">
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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-black dark:text-white mb-6">
            La plateforme tout-en-un pour <br className="hidden sm:block" />{" "}
            piloter votre <span className="text-indigo-600">entreprise</span>
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
              className="block rounded-xl px-8 py-3 text-center text-base font-normal transition duration-150 active:scale-[0.98] bg-[#202020] text-white dark:bg-white dark:text-black w-full sm:w-auto"
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

      {/* Carte Activité récente - Style Qonto pastel - EN DEHORS du conteneur overflow-hidden */}
      <div
        className="hidden lg:block absolute left-1/2 -translate-x-1/2 z-50"
        style={{ bottom: "-20px" }}
      >
        <div className="relative" style={{ overflow: "visible" }}>
          <div className="w-[400px] rounded-2xl bg-[#2F2F2D] border border-gray-700 shadow-xs overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-end gap-2 border-b border-gray-600 py-3 px-4">
              {/* <div className="w-4 h-4 rounded bg-[#5A50FF]/10 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3.2 2.4V4.8H6.4"
                    stroke="#5A50FF"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.2 4.8V10.4C3.2 11.3 3.9 12 4.8 12H6.4"
                    stroke="#5A50FF"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="8.8"
                    y="2.4"
                    width="4"
                    height="4"
                    rx="0.4"
                    fill="#5A50FF"
                    opacity="0.6"
                  />
                  <rect
                    x="8.8"
                    y="9.6"
                    width="4"
                    height="4"
                    rx="0.4"
                    fill="#5A50FF"
                    opacity="0.6"
                  />
                </svg>
              </div> */}
              <p className="text-xs text-right font-medium text-white">
                Activité récente
              </p>
            </div>

            {/* Activity items - Style pastel léger */}
            <div className="py-2 space-y-0.5">
              {/* Item 1 */}
              <div className="flex items-center justify-between px-3 py-2 mx-2 rounded-md hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm border border-white"></div>
                  <span className="text-xs text-white">Facture envoyée</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4F39F6]/20 text-[#4F39F6] font-medium">
                    payé
                  </span>
                </div>
                <span className="text-[10px] text-gray-300">2m</span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between px-3 py-2 mx-2 rounded-md hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm border border-white"></div>
                  <span className="text-xs text-white">Devis accepté</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                    signé
                  </span>
                </div>
                <span className="text-[10px] text-gray-300">15m</span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between px-3 py-2 mx-2 rounded-md hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm border border-white"></div>
                  <span className="text-xs text-white">Reçu numérisé</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 font-medium">
                    ocr
                  </span>
                </div>
                <span className="text-[10px] text-gray-300">1h</span>
              </div>

              {/* Item 4 */}
              <div className="flex items-center justify-between px-3 py-2 mx-2 rounded-md hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm border border-white"></div>
                  <span className="text-xs text-white">Paiement reçu</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4F39F6]/20 text-[#4F39F6] font-medium">
                    +3 500€
                  </span>
                </div>
                <span className="text-[10px] text-gray-300">2h</span>
              </div>
            </div>
          </div>

          {/* Petite carte flottante 1 - Facturation électronique (style Qonto) */}
          <div className="absolute -top-9 -left-20 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-w-[320px]">
            {/* Header gris clair */}
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-3.5 flex items-center justify-between">
              {/* Icône drapeau FR */}
              <div className="flex">
                <svg
                  width="68"
                  height="13"
                  viewBox="0 0 92 13"
                  fill="#00f"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="7" cy="6.5" r="5"></circle>
                  <path d="M22.9171 11.16C22.1262 11.16 21.4557 11.0267 20.9055 10.7603C20.3554 10.4852 19.8868 10.1327 19.5 9.70289L20.7895 8.40052C21.3998 9.08824 22.152 9.4321 23.0461 9.4321C23.5275 9.4321 23.8842 9.33324 24.1163 9.13552C24.3484 8.9378 24.4645 8.67561 24.4645 8.34894C24.4645 8.09964 24.3957 7.89333 24.2582 7.72999C24.1206 7.55807 23.8412 7.44201 23.42 7.38184L22.5303 7.26578C21.5761 7.14543 20.8754 6.85745 20.4284 6.40184C19.99 5.94622 19.7708 5.34017 19.7708 4.58368C19.7708 4.17965 19.8482 3.81 20.0029 3.47473C20.1576 3.13947 20.3768 2.85149 20.6605 2.61079C20.9528 2.37009 21.3053 2.18526 21.7179 2.05631C22.1391 1.91877 22.6162 1.85 23.1492 1.85C23.8283 1.85 24.4258 1.95745 24.9416 2.17237C25.4574 2.38728 25.9001 2.70105 26.2697 3.11368L24.9674 4.42894C24.7525 4.17965 24.4903 3.97763 24.1808 3.82289C23.8799 3.65956 23.4974 3.57789 23.0332 3.57789C22.5947 3.57789 22.2681 3.65526 22.0532 3.81C21.8382 3.96473 21.7308 4.17965 21.7308 4.45473C21.7308 4.76421 21.8125 4.98772 21.9758 5.12526C22.1477 5.2628 22.4228 5.36166 22.8011 5.42184L23.6908 5.56368C24.6192 5.70982 25.3069 5.9978 25.7539 6.42763C26.201 6.84886 26.4245 7.45061 26.4245 8.23289C26.4245 8.66271 26.3471 9.05815 26.1924 9.4192C26.0376 9.78026 25.8098 10.0897 25.5089 10.3476C25.2167 10.6055 24.8513 10.8075 24.4129 10.9537C23.9745 11.0912 23.4759 11.16 22.9171 11.16Z"></path>
                  <path d="M29.9063 2.00474V7.52368C29.9063 8.15982 30.031 8.63693 30.2803 8.955C30.5296 9.26447 30.9465 9.41921 31.5311 9.41921C32.1156 9.41921 32.5326 9.26447 32.7819 8.955C33.0312 8.63693 33.1558 8.15982 33.1558 7.52368V2.00474H35.0642V7.31737C35.0642 7.9793 34.9998 8.55526 34.8708 9.04526C34.7505 9.52666 34.5484 9.9264 34.2648 10.2445C33.9811 10.5539 33.6157 10.786 33.1687 10.9408C32.7217 11.0869 32.1758 11.16 31.5311 11.16C30.8863 11.16 30.3405 11.0869 29.8935 10.9408C29.4464 10.786 29.0811 10.5539 28.7974 10.2445C28.5137 9.9264 28.3074 9.52666 28.1785 9.04526C28.0581 8.55526 27.9979 7.9793 27.9979 7.31737V2.00474H29.9063Z"></path>
                  <path d="M37.0028 11.0053V2.00474H41.258C41.6793 2.00474 42.0575 2.07781 42.3928 2.22395C42.728 2.36149 43.0117 2.55491 43.2438 2.80421C43.4845 3.05351 43.6694 3.35868 43.7983 3.71974C43.9272 4.07219 43.9917 4.45903 43.9917 4.88026C43.9917 5.31009 43.9272 5.70123 43.7983 6.05368C43.6694 6.40614 43.4845 6.70702 43.2438 6.95631C43.0117 7.20561 42.728 7.40333 42.3928 7.54947C42.0575 7.68701 41.6793 7.75579 41.258 7.75579H38.9628V11.0053H37.0028ZM38.9628 6.05368H41.0259C41.3182 6.05368 41.546 5.98061 41.7094 5.83447C41.8813 5.67974 41.9672 5.45623 41.9672 5.16395V4.59658C41.9672 4.3043 41.8813 4.08509 41.7094 3.93895C41.546 3.78421 41.3182 3.70684 41.0259 3.70684H38.9628V6.05368Z"></path>
                  <path d="M45.4649 11.0053V2.00474H51.5899V3.74553H47.4249V5.58947H50.9968V7.31737H47.4249V9.26447H51.5899V11.0053H45.4649Z"></path>
                  <path d="M55.2575 11.0053H53.2975V2.00474H57.5656C57.9783 2.00474 58.3522 2.07351 58.6875 2.21105C59.0227 2.3486 59.3064 2.54632 59.5385 2.80421C59.7792 3.05351 59.9641 3.35439 60.093 3.70684C60.222 4.0593 60.2864 4.45044 60.2864 4.88026C60.2864 5.49061 60.1489 6.0236 59.8738 6.47921C59.6073 6.93482 59.199 7.26579 58.6488 7.4721L60.4154 11.0053H58.2362L56.663 7.70421H55.2575V11.0053ZM57.3206 6.05368C57.6129 6.05368 57.8407 5.98061 58.0041 5.83447C58.176 5.67974 58.262 5.45623 58.262 5.16395V4.59658C58.262 4.3043 58.176 4.08509 58.0041 3.93895C57.8407 3.78421 57.6129 3.70684 57.3206 3.70684H55.2575V6.05368H57.3206Z"></path>
                  <path d="M65.0337 11.0053V2.00474H69.289C69.7102 2.00474 70.0884 2.07781 70.4237 2.22395C70.759 2.36149 71.0426 2.55491 71.2747 2.80421C71.5154 3.05351 71.7003 3.35868 71.8292 3.71974C71.9582 4.07219 72.0226 4.45903 72.0226 4.88026C72.0226 5.31009 71.9582 5.70123 71.8292 6.05368C71.7003 6.40614 71.5154 6.70702 71.2747 6.95631C71.0426 7.20561 70.759 7.40333 70.4237 7.54947C70.0884 7.68701 69.7102 7.75579 69.289 7.75579H66.9937V11.0053H65.0337ZM66.9937 6.05368H69.0568C69.3491 6.05368 69.5769 5.98061 69.7403 5.83447C69.9122 5.67974 69.9982 5.45623 69.9982 5.16395V4.59658C69.9982 4.3043 69.9122 4.08509 69.7403 3.93895C69.5769 3.78421 69.3491 3.70684 69.0568 3.70684H66.9937V6.05368Z"></path>
                  <path d="M73.4958 2.00474H76.8872C77.4803 2.00474 78.0219 2.0993 78.5119 2.28842C79.0019 2.47754 79.4188 2.76123 79.7627 3.13947C80.1065 3.50912 80.373 3.97763 80.5622 4.545C80.7513 5.10377 80.8458 5.7571 80.8458 6.505C80.8458 7.25289 80.7513 7.91052 80.5622 8.47789C80.373 9.03666 80.1065 9.50517 79.7627 9.88342C79.4188 10.2531 79.0019 10.5325 78.5119 10.7216C78.0219 10.9107 77.4803 11.0053 76.8872 11.0053H73.4958V2.00474ZM76.8872 9.26447C77.4717 9.26447 77.9316 9.10114 78.2669 8.77447C78.6022 8.4478 78.7698 7.92342 78.7698 7.20131V5.80868C78.7698 5.08658 78.6022 4.56219 78.2669 4.23553C77.9316 3.90886 77.4717 3.74553 76.8872 3.74553H75.4559V9.26447H76.8872Z"></path>
                  <path d="M82.4869 11.0053V2.00474H86.7422C87.1634 2.00474 87.5417 2.07781 87.8769 2.22395C88.2122 2.36149 88.4959 2.55491 88.728 2.80421C88.9687 3.05351 89.1535 3.35868 89.2825 3.71974C89.4114 4.07219 89.4759 4.45903 89.4759 4.88026C89.4759 5.31009 89.4114 5.70123 89.2825 6.05368C89.1535 6.40614 88.9687 6.70702 88.728 6.95631C88.4959 7.20561 88.2122 7.40333 87.8769 7.54947C87.5417 7.68701 87.1634 7.75579 86.7422 7.75579H84.4469V11.0053H82.4869ZM84.4469 6.05368H86.5101C86.8024 6.05368 87.0302 5.98061 87.1935 5.83447C87.3654 5.67974 87.4514 5.45623 87.4514 5.16395V4.59658C87.4514 4.3043 87.3654 4.08509 87.1935 3.93895C87.0302 3.78421 86.8024 3.70684 86.5101 3.70684H84.4469V6.05368Z"></path>
                </svg>
              </div>
              <span className="text-sm font-medium">
                Facturation électronique
              </span>
            </div>
            {/* Contenu */}
            <div className="px-3 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Conforme 2026</span>
              <img
                src="/flag-for-flag-france-svgrepo-com.svg"
                alt="french flag"
                className="w-[16px]"
              />
              {/* <span className="text-xs font-medium text-gray-900">Activé</span> */}
            </div>
          </div>

          {/* Petite carte flottante 2 - Gain de temps (style Qonto) */}
          {/* <div className="absolute -bottom-6 -right-16 bg-white rounded-t-xl border border-gray-200 shadow-sm overflow-hidden min-w-[180px]">
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
              <span className="text-sm font-medium text-gray-900">
                Gain de temps
              </span>
            </div>
            <div className="px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">Automatisation</span>
              <span className="text-xs font-medium text-green-600">+40%</span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
