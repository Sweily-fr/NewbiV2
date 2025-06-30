"use client";

import React from "react";
import HeroHeader from "@/src/components/blocks/hero-header";
import { Footer7 } from "@/src/components/footer7";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeroHeader />
      <main>{children}</main>
      <Footer7 />
    </>
  );
}
