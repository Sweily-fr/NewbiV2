"use client";
import React from "react";

export function BlackFridayBanner() {
  return (
    <div className="relative w-full bg-black text-white py-3 pt-4 mt-0 mb-8 overflow-hidden rounded-t-[15px] md:rounded-t-[18px]">
      <div className="animate-scroll whitespace-nowrap inline-block">
        <span className="inline-block px-8 text-sm md:text-base font-medium">
          BLACK FRIDAY - GRATUIT 6 MOIS - S'INSCRIRE AVANT LE 28 NOVEMBRE 2025
        </span>
        <span className="inline-block px-8 text-sm md:text-base font-medium">
          BLACK FRIDAY - GRATUIT 6 MOIS - S'INSCRIRE AVANT LE 28 NOVEMBRE 2025
        </span>
        <span className="inline-block px-8 text-sm md:text-base font-medium">
          BLACK FRIDAY - GRATUIT 6 MOIS - S'INSCRIRE AVANT LE 28 NOVEMBRE 2025
        </span>
        <span className="inline-block px-8 text-sm md:text-base font-medium">
          BLACK FRIDAY - GRATUIT 6 MOIS - S'INSCRIRE AVANT LE 28 NOVEMBRE 2025
        </span>
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
