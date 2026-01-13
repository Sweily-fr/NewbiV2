"use client";
import React from "react";
import Image from "next/image";

export function SynchronisationAnimation() {
  return (
    <div className="relative w-full h-auto">
      <Image
        src="/lp/factures/Factures_Desk.svg"
        alt="Synchronisation bancaire automatique"
        width={1920}
        height={1080}
        className="w-full h-auto"
        priority
      />
    </div>
  );
}
