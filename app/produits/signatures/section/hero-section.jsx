"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="lg:min-h-screen flex items-start lg:items-center bg-white pt-44 sm:pt-48 lg:pt-24 mb-6 lg:mb-20 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
                <h1 className="text-balance font-medium text-4xl sm:text-5xl md:text-5xl lg:text-[3.5rem] leading-tight tracking-tight">
                  Créez des signatures email professionnelles
                </h1>

                <h2 className="text-base sm:text-lg font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0">
                  Renforcez votre image de marque avec des{" "}
                  <strong className="font-medium text-gray-900">
                    signatures email élégantes et personnalisées
                  </strong>{" "}
                  pour toute votre équipe.
                </h2>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 lg:pt-4 justify-center lg:justify-start">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white font-normal text-base rounded-lg px-6 w-full sm:w-auto"
                    >
                      Essayer 30 jours offerts
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-400 text-xs pt-3 text-center lg:text-left">
                  Plusieurs entreprises nous font déjà confiance · Compatible Gmail, Outlook, Apple Mail
                </p>
              </div>

              <div className="relative flex items-center justify-center lg:items-end lg:justify-end pt-8 lg:pt-24 lg:overflow-visible">
                <div className="relative w-full lg:w-[700px] xl:w-[800px] lg:-mr-48 xl:-mr-64 scale-[1.7] sm:scale-[1.5] lg:scale-100 origin-top translate-x-[45%] sm:translate-x-[25%] lg:translate-x-0">
                  <img src="/lp/signatures/signatures-hero.png" alt="Signatures email Newbi" className="w-full h-auto" />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-48 lg:h-22 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(255,255,255,0.8) 75%, transparent 100%)",
                    }}
                  />

                  {/* Signature card flottante */}
                  <div className="absolute bottom-8 -left-16 z-50 bg-white rounded-2xl shadow-lg border border-neutral-100 p-5 w-[280px] hidden lg:block">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <img
                          src="/lp/signatures/avatar-signature.jpg"
                          alt="Alexandre Dupont"
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        <div className="flex gap-1">
                          {["M5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
                            "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
                            "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                          ].map((d, i) => (
                            <div key={i} className="w-5 h-5 rounded-md bg-[#f0eeff] flex items-center justify-center">
                              <svg width="9" height="9" viewBox="0 0 24 24"><path d={d} fill="#5A50FF" /></svg>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-neutral-900">Alexandre Dupont</p>
                        <p className="text-[10px] font-semibold text-[#5A50FF]">Co-fondateur &amp; CEO</p>
                        <p className="text-[9px] text-neutral-400 mt-0.5">Newbi · Facturation intelligente</p>
                        <div className="w-6 h-[1.5px] bg-[#5A50FF] rounded my-2" />
                        <div className="flex flex-col gap-1">
                          <p className="text-[9px] text-neutral-500">alex@newbi.fr</p>
                          <p className="text-[9px] text-neutral-500">+33 6 12 34 56 78</p>
                          <p className="text-[9px] text-neutral-500">www.newbi.fr</p>
                        </div>
                        <div className="mt-2">
                          <div className="inline-flex items-center gap-1 bg-[#5A50FF] text-white text-[8px] font-semibold px-3 py-1.5 rounded-lg">
                            Prendre rendez-vous
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
