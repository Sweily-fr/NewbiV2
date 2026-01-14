"use client";
import React from "react";

const logos = [
  { name: "Company 1", src: "/lp/company/1.png", height: "h-10" },
  { name: "Company 2", src: "/lp/company/2.png", height: "h-10" },
  { name: "Company 3", src: "/lp/company/3.png", height: "h-10" },
  { name: "Company 4", src: "/lp/company/4.png", height: "h-10" },
  { name: "Company 5", src: "/lp/company/5.png", height: "h-10" },
  { name: "Company 6", src: "/lp/company/6.png", height: "h-10" },
  { name: "Company 1", src: "/lp/company/1.png", height: "h-10" },
  { name: "Company 2", src: "/lp/company/2.png", height: "h-10" },
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
