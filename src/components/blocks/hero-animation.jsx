"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import MySVG from "./hero-svg";

const HeroAnimation = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    // Animation des chemins lumineux
    const animatePaths = () => {
      if (!svgRef.current) {
        console.log('SVG ref not found');
        return;
      }
      
      // Sélectionner tous les chemins avec stroke blanc (chemins lumineux)
      const paths = svgRef.current.querySelectorAll('path[stroke="rgb(255,255,255)"]');
      console.log('Found paths:', paths.length);
      
      paths.forEach((path, index) => {
        // Vérifier si le chemin a strokeDasharray (indique que c'est un chemin animé)
        const dashArray = path.getAttribute('stroke-dasharray');
        if (dashArray && dashArray.includes('4')) {
          console.log('Animating path', index);
          
          // Animation de dashoffset pour créer un effet de tracé
          const length = path.getTotalLength ? path.getTotalLength() : 1000;
          
          // Configurer le dash array et offset pour l'animation
          path.style.strokeDasharray = `${length}`;
          path.style.strokeDashoffset = `${length}`;
          
          // Animation avec délai basé sur l'index
          setTimeout(() => {
            path.style.transition = `stroke-dashoffset 3s ease-in-out`;
            path.style.strokeDashoffset = '0';
          }, index * 500); // Délai plus long entre chaque chemin
        }
      });
      
      // Animation en boucle
      setTimeout(() => {
        paths.forEach((path, index) => {
          const dashArray = path.getAttribute('stroke-dasharray');
          if (dashArray && dashArray.includes('4')) {
            const length = path.getTotalLength ? path.getTotalLength() : 1000;
            path.style.strokeDashoffset = `${length}`;
            setTimeout(() => {
              path.style.strokeDashoffset = '0';
            }, index * 500);
          }
        });
      }, 5000); // Relancer l'animation toutes les 5 secondes
    };
    
    // Lancer l'animation après un court délai pour s'assurer que le SVG est chargé
    const timer = setTimeout(animatePaths, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hidden md:block relative w-full p-20">
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-35 z-10">
        <h1 className="max-w-8xl text-center mx-auto text-balance font-semibold text-6xl md:text-7xl xl:text-[2.8rem] font-['Poppins'] leading-tight">
          <span className="text-[#2E2E2E] block">Les outils SaaS pour</span>
          <span className="bg-gradient-to-r from-[#5B4FFF] to-[#7A70FF] px-4 text-white rounded-xl inline-block my-4">
            lancer votre business
          </span>
          <br />
          <span className="text-[#2E2E2E]">en un </span>
          <span className="text-[#5B4FFF] font-semibold">CLIC</span>
        </h1>
        <div
          key={1}
          className="bg-foreground/10 rounded-[14px] border p-0.5 mt-20"
        >
          <Button
            asChild
            size="lg"
            className="rounded-xl px-5 text-sm cursor-pointer"
          >
            <span className="text-nowrap">Commencez gratuitement</span>
          </Button>
        </div>
      </div>
      <div className="w-full flex justify-center">
        <div ref={svgRef}>
          <MySVG />
        </div>
      </div>
    </div>
  );
};

export default HeroAnimation;
