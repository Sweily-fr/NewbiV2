"use client";
import React from "react";
import Image from "next/image";

export function KanbanAnimation() {
  return (
    <div className="relative w-full h-auto">
      <Image
        src="/images/lp-kanban/Kanban.jpg"
        alt="Tableau Kanban gestion de projets"
        width={1920}
        height={1080}
        className="w-full h-auto"
        priority
      />
    </div>
  );
}
