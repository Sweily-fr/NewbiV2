"use client";

import React from "react";
import HeroHeader from "@/src/components/blocks/hero-header";
import { Footer7 } from "@/src/components/footer7";
import { Poppins } from "next/font/google";

// Configuration de Poppins uniquement pour les landing pages
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export default function MainLayout({ children }) {
  return (
    <div className={`${poppins.variable} font-poppins`}>
      <HeroHeader />
      <main className="font-poppins">{children}</main>
      <Footer7 />
    </div>
  );
}
