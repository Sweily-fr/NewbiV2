import React from "react";
import Image from "next/image";

export function TeamBentoGrid() {
  // Mosaïque de la vie de l'équipe. Presque toutes les photos sont verticales :
  // elles vont dans les emplacements hauts, et les trois photos horizontales
  // dans les emplacements larges — un portrait recadré en paysage perd son
  // sujet. `position` recadre chaque image sur ce qui compte, le centre par
  // défaut coupant parfois la personne hors du cadre.
  const images = [
    {
      src: "/lp/about/about-5.jpeg",
      alt: "L'équipe Newbi réunie devant un écran de présentation",
      className: "col-span-2 row-span-2",
      height: "450px",
    },
    {
      src: "/lp/about/salon-entrepreneurs.jpg",
      alt: "Un membre de l'équipe Newbi au salon Go Entrepreneurs",
      className: "col-span-1 row-span-1",
      height: "220px",
      position: "50% 20%",
    },
    {
      src: "/lp/about/equipe-coworking.jpg",
      alt: "L'équipe Newbi au travail dans un espace de coworking",
      className: "col-span-1 row-span-2",
      height: "450px",
    },
    {
      src: "/lp/about/about-4.jpeg",
      alt: "Une collaboratrice au téléphone à son poste de travail",
      className: "col-span-1 row-span-1",
      height: "220px",
      position: "50% 38%",
    },
    {
      src: "/lp/about/concentration.jpg",
      alt: "Un membre de l'équipe concentré sur son écran",
      className: "col-span-1 row-span-1",
      height: "450px",
    },
    {
      src: "/lp/about/poste-de-travail.jpg",
      alt: "Un développeur de l'équipe Newbi à son poste",
      className: "col-span-1 row-span-1",
      height: "450px",
    },
    {
      src: "/lp/about/atelier-tableau.jpg",
      alt: "Séance de travail de l'équipe autour d'un tableau blanc",
      className: "col-span-2 row-span-1",
      height: "450px",
      position: "50% 42%",
    },
  ];

  return (
    <div className="w-full h-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 w-full auto-rows-auto">
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-2xl bg-[#F4F4F6] ${image.className}`}
            style={{
              height: image.height,
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
              style={
                image.position ? { objectPosition: image.position } : undefined
              }
              sizes="(max-width: 768px) 50vw, 25vw"
              priority={index < 3}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
