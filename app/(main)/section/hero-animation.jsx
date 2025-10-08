"use client";

import { useEffect, useRef } from "react";
import MySVG from "./hero-svg";

const HeroAnimation = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    const createLightTrailEffect = () => {
      if (!svgRef.current) return;

      // Sélectionner le path avec les lignes en pointillés
      const dashedPath = svgRef.current.querySelector(
        'path[stroke-dasharray=" 4 4"]'
      );

      if (!dashedPath) return;

      // Extraire les segments du path d attribute
      const pathData = dashedPath.getAttribute("d");

      // Diviser le path en segments basés sur les commandes M (moveTo)
      // Chaque M indique le début d'un nouveau segment
      const segments = pathData
        .split("M")
        .filter((s) => s.trim())
        .map((s) => "M" + s);

      // Créer un path temporaire pour chaque segment pour calculer leur longueur
      const allSegmentData = segments.map((segmentPath, index) => {
        const tempPath = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        tempPath.setAttribute("d", segmentPath);
        svgRef.current.appendChild(tempPath);
        const length = tempPath.getTotalLength();
        svgRef.current.removeChild(tempPath);
        return { path: segmentPath, length, originalIndex: index };
      });

      // Trier les segments par longueur décroissante et ne garder que les 6 plus longs
      const segmentData = allSegmentData
        .sort((a, b) => b.length - a.length)
        .slice(0, 6)
        .sort((a, b) => a.originalIndex - b.originalIndex); // Remettre dans l'ordre original pour l'animation

      // Créer le conteneur pour les paths lumineux
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      dashedPath.parentNode.insertBefore(g, dashedPath.nextSibling);

      // Configuration de l'animation
      const lightLength = 40; // Longueur de la ligne lumineuse
      const segmentDuration = 900; // Durée pour parcourir un segment (ms)
      const pauseDuration = 1000; // Pause entre segments (ms)

      let currentSegmentIndex = 0;
      let animationId;
      let currentLightPath = null;

      const animateSegment = () => {
        // Nettoyer le path précédent
        if (currentLightPath && g.contains(currentLightPath)) {
          g.removeChild(currentLightPath);
        }

        // Créer un nouveau path pour le segment actuel
        const segment = segmentData[currentSegmentIndex];
        currentLightPath = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        currentLightPath.setAttribute("d", segment.path);
        currentLightPath.setAttribute("fill", "none");
        currentLightPath.style.stroke = "#000";
        currentLightPath.style.strokeWidth = "1.5";
        // currentLightPath.style.filter =
        //   "drop-shadow(0 0 8px rgb(152, 154, 255)) drop-shadow(0 0 16px rgba(99, 102, 241, 0.6))";
        currentLightPath.style.strokeLinecap = "round";
        g.appendChild(currentLightPath);

        let startTime = null;

        const animate = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;

          if (elapsed < segmentDuration) {
            // Animation du segment
            const progress = elapsed / segmentDuration;
            const currentLength = segment.length * progress;

            // Créer l'effet de ligne qui se déplace
            currentLightPath.style.strokeDasharray = `${lightLength} ${segment.length}`;
            currentLightPath.style.strokeDashoffset = `${segment.length - currentLength + lightLength / 2}`;

            // Effet de fade in/out
            let opacity = 1;
            if (progress < 0.1) {
              opacity = progress * 10;
            } else if (progress > 0.9) {
              opacity = (1 - progress) * 10;
            }
            currentLightPath.style.opacity = opacity;

            // Variation subtile du glow
            const glowIntensity = 0.8 + Math.sin(progress * Math.PI) * 0.2;
            // currentLightPath.style.filter = `drop-shadow(0 0 ${6 + glowIntensity * 4}px rgba(99, 102, 241, ${glowIntensity})) drop-shadow(0 0 ${12 + glowIntensity * 8}px rgba(99, 102, 241, ${glowIntensity * 0.5}))`;

            animationId = requestAnimationFrame(animate);
          } else if (elapsed < segmentDuration + pauseDuration) {
            // Pause - masquer complètement
            currentLightPath.style.opacity = "0";
            animationId = requestAnimationFrame(animate);
          } else {
            // Passer au segment suivant
            currentSegmentIndex =
              (currentSegmentIndex + 1) % segmentData.length;
            animateSegment();
          }
        };

        animationId = requestAnimationFrame(animate);
      };

      // Démarrer l'animation
      setTimeout(animateSegment, 500);

      // Retourner la fonction de nettoyage
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        if (g && g.parentNode) {
          g.parentNode.removeChild(g);
        }
      };
    };

    const cleanup = createLightTrailEffect();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
      {/* Version Mobile */}
      <div className="block md:hidden relative w-full">
        <div className="flex flex-col items-center justify-center text-center px-3 py-8">
          <h1
            className="max-w-sm text-center mx-auto font-medium font-['Poppins'] leading-tight"
            style={{ fontSize: "34px" }}
          >
            <span className="text-[#2E2E2E] block mb-1">
              Les meilleurs outils
            </span>
            <span className="text-[#2E2E2E] block my-1">pour être</span>
            <span className="bg-gradient-to-r from-[#171717] to-[#171717]/90 px-4 py-2 text-white rounded-lg inline-block my-3">
              indépendant,
            </span>
            <span className="text-[#2E2E2E] mt-1 block">sans le prix fort</span>
          </h1>

          <p className="text-[#2E2E2E] text-base sm:text-lg pt-8 max-w-sm mx-auto leading-relaxed">
            Créez votre business parfait en quelques clics.
          </p>
        </div>
      </div>

      {/* Version Desktop */}
      <div className="hidden md:block relative w-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-6 z-10 px-4">
          <h1 className="max-w-8xl text-center mx-auto text-balance font-medium text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-['Poppins'] leading-tight">
            <span className="text-[#2E2E2E] block">Les meilleurs outils</span>
            <span className="text-[#2E2E2E] block">pour être</span>
            <span className="bg-gradient-to-r from-[#171717] to-[#171717]/90 px-3 md:px-4 py-1 text-white rounded-lg inline-block my-2 md:my-3 lg:my-4">
              indépendant,
            </span>
            <span className="text-[#2E2E2E] block">sans le prix fort</span>
          </h1>

          <span className="text-[#2E2E2E] block mt-4 md:mt-5 lg:mt-6 text-sm md:text-base lg:text-lg">
            Créez votre business parfait en quelques clics.
          </span>
        </div>
        <div className="w-full flex justify-center">
          <div ref={svgRef} className="w-full p-8 md:p-12 lg:p-16 xl:p-20">
            <MySVG />
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroAnimation;
