"use client";

import React from "react";
import { usePathname } from "next/navigation";
import HeroHeader from "@/src/components/blocks/hero-header";
import Footer7 from "@/src/components/footer7";
import { ApolloWrapper } from "@/src/providers/apollo-provider";
import { AuthProvider } from "@/src/contexts/AuthContext";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const isNewPage = pathname?.startsWith("/new");

  return (
    <div>
      {!isNewPage && <HeroHeader />}
      <main>{children}</main>
      {!isNewPage && <Footer7 />}
    </div>
  );
}
