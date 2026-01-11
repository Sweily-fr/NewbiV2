"use client";
import React from "react";
import Image from "next/image";

export function FacturationElectroniqueAnimation() {
  return (
    <div
      id="animation"
      className="animation w-full max-w-[1200px]"
      style={{ background: "transparent" }}
    >
      <Image
        src="/lp/factures/Factures_Desk.svg"
        alt="Trésorerie Dashboard"
        width={1200}
        height={700}
        className="w-full h-auto"
        priority
      />
    </div>
  );
}
