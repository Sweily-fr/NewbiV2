"use client";
import React from "react";
import Image from "next/image";
import { GestionAchatsAnimationIphone } from "./GestionAchatsAnimationIphone";

export function GestionAchatsAnimation() {
  return (
    <div
      id="animation"
      className="animation w-full max-w-[1200px] relative"
      style={{ background: "transparent" }}
    >
      <Image
        src="/lp/achats/Illustration_png (1).png"
        alt="Gestion des achats Dashboard"
        width={1200}
        height={700}
        className="w-full h-auto"
        priority
      />

      {/* iPhone positionné en bas à gauche */}
      {/* <div className="absolute bottom-0 left-[-40px] z-10">
        <GestionAchatsAnimationIphone />
      </div> */}
    </div>
  );
}
