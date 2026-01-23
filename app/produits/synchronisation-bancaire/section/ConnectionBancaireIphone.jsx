"use client";
import React from "react";
import Image from "next/image";

export function ConnectionBancaireIphone() {
  return (
    <div className="relative w-full h-full">
      <Image
        src="/lp/bank/Connection bancaire.svg"
        alt="Connection bancaire"
        width={366}
        height={419}
        className="w-full h-auto object-contain"
        priority
      />
    </div>
  );
}
