"use client";

import React from "react";
import Footer7 from "@/src/components/footer7";

export default function MainLayout({ children }) {
  return (
    <div>
      <main>{children}</main>
      <Footer7 />
    </div>
  );
}
