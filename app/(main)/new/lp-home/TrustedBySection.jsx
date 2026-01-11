"use client";
import React from "react";

const logos = [
  { name: "Ninth", src: "/lp/factures/primer.png", height: "h-4" },
  { name: "Eighth", src: "/lp/factures/primer.png", height: "h-4" },
  { name: "Third", src: "/lp/factures/primer.png", height: "h-4" },
  { name: "Sixth", src: "/lp/factures/primer.png", height: "h-4" },
  { name: "First", src: "/lp/factures/primer.png", height: "h-4" },
  { name: "Fourth", src: "/lp/factures/primer.png", height: "h4" },
  { name: "Seventh", src: "/lp/factures/primer.png", height: "h-4" },
  { name: "Tenth", src: "/lp/factures/primer.png", height: "h-4" },
];

export default function TrustedBySection() {
  return (
    <section className="bg-[#FDFDFD]">
      <div className="border-gray-200 grid grid-cols-2 border-t border-b md:grid-cols-4">
        {logos.map((logo, index) => {
          const isLastRow = index >= 4;
          const isLastInRow = (index + 1) % 4 === 0;
          const isSecondInMobileRow = (index + 1) % 2 === 0;

          return (
            <div
              key={logo.name}
              className={`group relative overflow-hidden border-gray-200
                ${isSecondInMobileRow ? "border-r-0 md:border-r" : "border-r"}
                ${isLastRow ? "md:border-b-0" : "border-b"}
                ${isLastInRow ? "md:border-r-0" : "md:border-r"}
              `}
            >
              <div className="bg-indigo-500/5 absolute inset-x-0 bottom-0 h-full translate-y-full transition-all duration-200 group-hover:translate-y-0"></div>
              <div className="group flex min-h-32 items-center justify-center p-4 py-10 grayscale hover:grayscale-0 transition-all duration-300">
                <img
                  alt={logo.name}
                  className={`object-contain transition-all duration-500 dark:invert dark:filter ${logo.height} w-auto`}
                  src={logo.src}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
