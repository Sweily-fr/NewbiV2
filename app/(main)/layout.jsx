"use client";

import React from "react";
import HeroHeader from "@/src/components/blocks/hero-header";
import Footer7 from "@/src/components/footer7";
import { ApolloWrapper } from "@/src/providers/apollo-provider";
import { AuthProvider } from "@/src/contexts/AuthContext";

export default function MainLayout({ children }) {
  return (
    <div>
      <HeroHeader />
      <main>{children}</main>
      <Footer7 />
    </div>
  );
}
