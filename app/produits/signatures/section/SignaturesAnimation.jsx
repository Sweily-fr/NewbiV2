"use client";
import React from "react";
import Image from "next/image";

export function SignaturesAnimation() {
  return (
    <div className="relative w-full h-auto">
      <Image
        src="/lp/signature-mail/Signature.png"
        alt="Signature email professionnelle"
        width={1920}
        height={1080}
        className="w-full h-auto object-cover"
        priority
      />
    </div>
  );
}
