"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export default function CtaSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden">
      <div className="max-w-[1400px] px-4 mx-auto">
        <div className="rounded-3xl overflow-hidden relative max-h-[500px] md:max-h-[700px]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3' numOctaves='10' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.7'/%3E%3C/svg%3E"), linear-gradient(135deg, #4A3FE0 0%, #5A50FF 40%, #6E63FF 100%)`,
          }}>
          {/* Content */}
          <div className="flex flex-col items-center text-center px-6 lg:px-12 pt-10 md:pt-12 pb-0">
            {/* Logo */}
            <img src="/newbiLetter.png" alt="Newbi" className="h-6 mb-8 brightness-0 invert" />

            {/* Title */}
            <h2 className="text-2xl md:text-[2.75rem] lg:text-[3.25rem] font-semibold tracking-[-0.02em] text-white leading-[1.1] mb-4 max-w-3xl">
              Vos projets et votre équipe,
              <br />
              enfin réunis.
            </h2>

            {/* CTA Button */}
            <Button asChild size="lg" className="bg-white text-[#212121] hover:bg-neutral-100 text-base font-semibold px-6 py-3 rounded-xl mb-6 md:mb-8">
              <Link href="/auth/register">Commencer gratuitement</Link>
            </Button>
          </div>

          {/* Screenshot with glassmorphism */}
          <div className="relative px-6 lg:px-12">
            <div
              className="mx-auto max-w-5xl overflow-hidden"
              style={{
                padding: "6px 6px 0 6px",
                border: "1px solid rgba(238, 239, 241, 0.4)",
                borderRadius: "18px 18px 0 0",
                background: "rgba(238, 239, 241, 0.2)",
                borderBlockEnd: "unset",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
            >
              <img
                src="/images/kanban-cta-screenshot.png"
                alt="Interface Kanban Newbi"
                className="w-full h-auto rounded-t-[12px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
