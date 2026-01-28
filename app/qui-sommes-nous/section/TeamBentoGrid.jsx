"use client";
import React from "react";
import Image from "next/image";

export function TeamBentoGrid() {
  const images = [
    {
      src: "/lp/about/about-5.jpeg",
      alt: "L'équipe Newbi en réunion",
      className: "col-span-2 row-span-2",
      height: "450px",
    },
    {
      src: "/lp/about/about-8.jpeg",
      alt: "Espace de travail Newbi",
      className: "col-span-1 row-span-1",
      height: "220px",
    },
    {
      src: "/lp/about/about-6.jpeg",
      alt: "Collaboration d'équipe",
      className: "col-span-1 row-span-2",
      height: "450px",
    },
    {
      src: "/lp/about/about-4.jpeg",
      alt: "Moment convivial",
      className: "col-span-1 row-span-1",
      height: "220px",
    },
    {
      src: "/lp/about/about-1.jpeg",
      alt: "L'équipe au travail",
      className: "col-span-1 row-span-1",
      height: "450px",
    },
    {
      src: "/lp/about/about-9.jpeg",
      alt: "Brainstorming créatif",
      className: "col-span-1 row-span-1",
      height: "450px",
    },
    {
      src: "/lp/about/about-10.jpeg",
      alt: "Nos locaux",
      className: "col-span-2 row-span-1",
      height: "450px",
    },
  ];

  return (
    <div className="w-full h-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 w-full auto-rows-auto">
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-lg bg-gray-100 ${image.className}`}
            style={{
              height: image.height,
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 25vw"
              priority={index < 3}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
