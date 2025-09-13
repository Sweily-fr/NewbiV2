"use client";

import { useEffect, useRef } from "react";
import MySVG from "./hero-svg";

const HeroAnimation = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    // Créer l'effet de trait lumineux qui traverse les dash (comme Lottie)
    const createLightTrailEffect = () => {
      if (!svgRef.current) return;

      // Sélectionner tous les chemins avec stroke blanc et dasharray
      const paths = svgRef.current.querySelectorAll(
        'path[stroke="rgb(255,255,255)"]'
      );
      console.log("Chemins lumineux trouvés:", paths.length);

      paths.forEach((path, index) => {
        const dashArray = path.getAttribute("stroke-dasharray");
        if (dashArray && dashArray.includes("4")) {
          // Obtenir la longueur du chemin
          const pathLength = path.getTotalLength ? path.getTotalLength() : 1000;

          // Configurer le chemin pour l'effet de trait lumineux
          path.style.stroke = "rgb(99,102,241)";
          path.style.strokeWidth = "2";
          path.style.filter = "drop-shadow(0 0 6px rgba(99, 102, 241, 0.8))";

          // Créer l'effet de trait lumineux avec stroke-dasharray animé
          const dashLength = 20; // Longueur du trait lumineux
          const gapLength = pathLength; // Espace entre les traits

          path.style.strokeDasharray = `${dashLength} ${gapLength}`;
          path.style.strokeDashoffset = `${pathLength + dashLength}`;

          // Animation du trait lumineux qui traverse le chemin
          const animateTrail = () => {
            path.style.transition = "none";
            path.style.strokeDashoffset = `${pathLength + dashLength}`;

            // Petite pause puis démarrer l'animation
            setTimeout(() => {
              path.style.transition = "stroke-dashoffset 2s ease-in-out";
              path.style.strokeDashoffset = `-${dashLength}`;
            }, 50);
          };

          // Démarrer l'animation avec délai échelonné
          setTimeout(() => {
            animateTrail();

            // Répéter l'animation en boucle
            setInterval(animateTrail, 3000);
          }, index * 400);
        }
      });
    };

    // Démarrer l'effet après un délai
    const timer = setTimeout(createLightTrailEffect, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Version Mobile */}
      <div className="block md:hidden relative w-full">
        <div className="flex flex-col items-center justify-center text-center px-6 py-8">
          <h1 className="max-w-sm text-center mx-auto text-balance font-medium text-2xl sm:text-3xl font-['Poppins'] leading-tight">
            <span className="text-[#2E2E2E] block mb-2">
              Les meilleurs outils
            </span>
            <span className="bg-gradient-to-r from-[#171717] to-[#171717]/90 px-4 py-2 text-white rounded-lg inline-block my-3">
              pour être indépendant,
            </span>
            <span className="text-[#2E2E2E] mt-2 block">sans le prix fort</span>
          </h1>

          <p className="text-[#2E2E2E] text-base sm:text-lg mt-6 max-w-sm mx-auto leading-relaxed">
            Créez votre business parfait en quelques clics.
          </p>
        </div>
      </div>

      {/* Version Desktop */}
      <div className="hidden md:block relative w-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-6 z-10">
          <h1 className="max-w-8xl text-center mx-auto text-balance font-medium text-6xl md:text-7xl xl:text-[3.2rem] font-['Poppins'] leading-tight">
            <span className="text-[#2E2E2E] block">Les meilleurs outils</span>
            <span className="text-[#2E2E2E] block">pour être</span>
            <span className="bg-gradient-to-r from-[#171717] to-[#171717]/90 px-4 text-white rounded-lg inline-block my-4">
              indépendant,
            </span>
            <span className="text-[#2E2E2E] block">sans le prix fort</span>
          </h1>

          <span className="text-[#2E2E2E] block mt-6">
            Créez votre business parfait en quelques clics.
          </span>
        </div>
        <div className="w-full flex justify-center">
          <div ref={svgRef} className="w-full p-20">
            <MySVG />
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroAnimation;
