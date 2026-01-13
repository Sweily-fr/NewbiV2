"use client";
import React from "react";
import Image from "next/image";

export function TeamBentoGrid() {
  const images = [
    {
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
      alt: "Team member 1",
      className: "col-span-2 row-span-2",
    },
    {
      src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
      alt: "Team member 2",
      className: "col-span-1 row-span-1",
    },
    {
      src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80",
      alt: "Team member 3",
      className: "col-span-1 row-span-2",
    },
    {
      src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
      alt: "Team member 4",
      className: "col-span-2 row-span-1",
    },
  ];

  return (
    <div className="w-full h-auto">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-2xl bg-gray-100 ${image.className}`}
            style={{
              minHeight: index === 0 ? "400px" : "200px",
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
