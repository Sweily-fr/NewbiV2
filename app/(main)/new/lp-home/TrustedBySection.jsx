"use client";
import React from "react";

const logos = [
  { name: "L'Héritage", src: "/lp/company/4.png", height: "h-12" },
  { name: "New3dge", src: "/lp/company/1.png", height: "h-5" },
  { name: "Mardy Studio", src: "/lp/company/5.png", height: "h-6" },
];

export default function TrustedBySection({ variant = "home" }) {
  return (
    <section className={`relative z-10 ${variant === "home" ? "bg-[#FDFDFD] -mt-10 md:-mt-16" : "bg-transparent"}`}>
      <div className="max-w-[800px] mx-auto">
        <div className="py-6">
          <p className="text-center text-lg text-black dark:text-white mb-8">
            Ils nous font <span className="font-medium">confiance</span>
          </p>
          <div className="flex items-center justify-center gap-6 sm:gap-12 md:gap-20 px-6 overflow-hidden">
            {logos.map((logo) => (
              <img
                key={logo.name}
                src={logo.src}
                alt={logo.name}
                className={`${logo.height} w-auto object-contain`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
