"use client";
import React from "react";

export default function TrustedBySection() {
  const companies = [
    { name: "Open AI", logo: "https://assets.aceternity.com/logos/openai.png" },
    {
      name: "Hello Patient",
      logo: "https://assets.aceternity.com/logos/hello-patient.png",
    },
    {
      name: "Granola",
      logo: "https://assets.aceternity.com/logos/granola.png",
    },
    {
      name: "Character AI",
      logo: "https://assets.aceternity.com/logos/characterai.png",
    },
    { name: "Oracle", logo: "https://assets.aceternity.com/logos/oracle.png" },
    {
      name: "Portola",
      logo: "https://assets.aceternity.com/logos/portola.png",
    },
  ];

  return (
    <section className="pt-22 bg-[#FDFDFD]">
      <h2 className="text-neutral-600 font-medium dark:text-neutral-400 text-lg text-center max-w-xl mx-auto">
        Adopté par des dirigeants et entrepreneurs modernes.{" "}
        <br className="hidden md:block" />
        <span className="text-neutral-400">
          Du lancement à la croissance sans complexité.
        </span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 max-w-3xl mx-auto mt-10">
        {companies.map((company, index) => (
          <div
            key={index}
            style={{
              opacity: 1,
              filter: "blur(0px)",
              transform: "none",
            }}
          >
            <img
              alt={company.name}
              loading="lazy"
              width="100"
              height="100"
              decoding="async"
              className="size-20 object-contain mx-auto dark:filter dark:invert"
              src={company.logo}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
