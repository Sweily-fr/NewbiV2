"use client";
import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import HeroAnimation from "./hero-animation";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="h-[98vh] flex flex-col justify-center bg-gradient-to-t from-[#fce8e6] via-[#f8f9fc] to-[#f0f4ff] rounded-[15px] md:rounded-[18px] lg:rounded-[18px] shadow-xs mx-2 mt-2">
          <HeroAnimation />
          <div className="flex justify-center mt-20 gap-4">
            <div className="bg-[#fff]/1 rounded-[10px] border p-0.5">
              <Button
                asChild
                size="lg"
                variant="default"
                className="px-5 text-sm cursor-pointer"
              >
                <span className="text-nowrap">Commencez gratuitement</span>
              </Button>
            </div>
            <div className="bg-[#fff]/1 rounded-[10px] border p-0.5">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="px-5 text-sm cursor-pointer"
              >
                <span className="text-nowrap">Tarifs</span>
              </Button>
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
