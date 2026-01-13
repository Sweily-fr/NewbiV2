"use client";
import React from "react";
import Image from "next/image";

export function TransfersAnimation() {
  return (
    <div className="relative w-full h-auto">
      <Image
        src="/images/lp-transfert/Transfert.jpg"
        alt="Transfert de fichiers sécurisé"
        width={1920}
        height={1080}
        className="w-full h-auto"
        priority
      />
    </div>
  );
}
