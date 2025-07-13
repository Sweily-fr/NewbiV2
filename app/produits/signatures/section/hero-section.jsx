"use client";
import React from "react";
import Link from "next/link";
import { ChevronRight, ArrowRightIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="h-[120vh] flex flex-col bg-[#FF4D4D]/10 rounded-[15px] md:rounded-[18px] lg:rounded-[18px] shadow-xs mx-2 mt-2 pt-50">
          <div className="flex-1 flex flex-col items-center justify-center relative w-full px-4 md:px-8">
            <div className="flex flex-col items-center justify-center z-10 gap-6 max-w-4xl text-center">
              <h1 className="max-w-4xl text-center mx-auto text-balance font-medium font-Poppins text-2@xl md:text-7xl xl:text-[2.7rem] font-['Poppins'] leading-tight">
                La <span className="text-[#FF4D4D]">Signature de mail</span> qui
                professionnalise vraiment vos{" "}
                <span className="text-[#FF4D4D]">échanges</span>
              </h1>
              <span className="text-[#2E2E2E] max-w-2xl text-center block">
                Créez une signature d’email élégante et personnalisée en
                quelques clics. Renforcez votre image de marque et inspirez
                confiance à chaque envoi avec newbi.
              </span>
              <div className="flex justify-center gap-4 mt-2">
                <div className="bg-[#fff]/1 rounded-[10px] border p-0.5">
                  <Button size="lg" variant="default" className="group">
                    <>
                      <a href="/auth/login" className="text-nowrap">
                        Essayer
                      </a>
                      <ArrowRightIcon
                        className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5"
                        size={16}
                        aria-hidden="true"
                      />
                    </>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="relative -mr-56 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
            <div
              aria-hidden
              className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
            />
            <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
              <img
                className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                src="https://tailark.com//_next/image?url=%2Fmail2.png&w=3840&q=75"
                alt="app screen"
                width="2700"
                height="1440"
              />
              <img
                className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                src="https://tailark.com/_next/image?url=%2Fmail2-light.png&w=3840&q=75"
                alt="app screen"
                width="2700"
                height="1440"
              />
            </div>
          </div>
        </section>
        <section className="bg-background pb-10 pt-10 md:pb-32">
          <div className="group relative m-auto max-w-5xl px-6">
            <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
              <Link
                href="/"
                className="block text-sm duration-150 hover:opacity-75"
              >
                <span>Ils nous font confiance</span>

                <ChevronRight className="ml-1 inline-block size-3" />
              </Link>
            </div>
            <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
              <div className="flex">
                <img
                  className="mx-auto h-5 w-fit filter grayscale opacity-30 hover:opacity-90 transition-opacity"
                  src="https://html.tailus.io/blocks/customers/nvidia.svg"
                  alt="Nvidia Logo"
                  height="20"
                  width="auto"
                />
              </div>

              <div className="flex">
                <img
                  className="mx-auto h-4 w-fit filter grayscale opacity-30 hover:opacity-90 transition-opacity"
                  src="https://html.tailus.io/blocks/customers/column.svg"
                  alt="Column Logo"
                  height="16"
                  width="auto"
                />
              </div>
              <div className="flex">
                <img
                  className="mx-auto h-4 w-fit filter grayscale opacity-30 hover:opacity-90 transition-opacity"
                  src="https://html.tailus.io/blocks/customers/github.svg"
                  alt="GitHub Logo"
                  height="16"
                  width="auto"
                />
              </div>
              <div className="flex">
                <img
                  className="mx-auto h-5 w-fit filter grayscale opacity-30 hover:opacity-90 transition-opacity"
                  src="https://html.tailus.io/blocks/customers/nike.svg"
                  alt="Nike Logo"
                  height="20"
                  width="auto"
                />
              </div>
              <div className="flex">
                <img
                  className="mx-auto h-5 w-fit filter grayscale opacity-30 hover:opacity-90 transition-opacity"
                  src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                  alt="Lemon Squeezy Logo"
                  height="20"
                  width="auto"
                />
              </div>
              <div className="flex">
                <img
                  className="mx-auto h-4 w-fit filter grayscale opacity-30 hover:opacity-90 transition-opacity"
                  src="https://html.tailus.io/blocks/customers/laravel.svg"
                  alt="Laravel Logo"
                  height="16"
                  width="auto"
                />
              </div>
              <div className="flex">
                <img
                  className="mx-auto h-7 w-fit filter grayscale opacity-30 hover:opacity-90 transition-opacity"
                  src="https://html.tailus.io/blocks/customers/lilly.svg"
                  alt="Lilly Logo"
                  height="28"
                  width="auto"
                />
              </div>

              <div className="flex">
                <img
                  className="mx-auto h-6 w-fit filter grayscale opacity-30 hover:opacity-90 transition-opacity"
                  src="https://html.tailus.io/blocks/customers/openai.svg"
                  alt="OpenAI Logo"
                  height="24"
                  width="auto"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
