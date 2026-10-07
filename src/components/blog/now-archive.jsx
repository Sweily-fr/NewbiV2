"use client";

import React from "react";
import Link from "next/link";
import { CONTENEUR, TITRE_SECTION, dateCourte } from "./now-shared";

const PAR_PAGE = 24;

/* Liste d'archive reprise de Linear : des lignes de 56 px séparées par un
   filet, titre à gauche, auteur et date à droite, puis un bouton pilule
   « Charger plus ». */
export function BlogNowArchive({ posts, titre = "Archive" }) {
  const [visibles, setVisibles] = React.useState(PAR_PAGE);
  if (!posts.length) return null;

  const liste = posts.slice(0, visibles);
  const reste = posts.length - liste.length;

  return (
    <section className={`${CONTENEUR} pt-24 md:pt-32`}>
      <h2 className={TITRE_SECTION}>{titre}</h2>

      <ul className="mt-10 md:mt-12">
        {liste.map((post) => (
          <li key={post.slug} className="border-t border-gray-200">
            <Link
              href={post.url}
              className="group flex min-h-14 flex-col justify-center gap-0.5 py-3 sm:flex-row sm:items-center sm:gap-4 sm:py-0"
            >
              <span className="flex-1 text-sm text-gray-950 transition-colors group-hover:text-[#5A50FF]">
                {post.title}
              </span>
              <span className="shrink-0 text-sm text-gray-500 sm:text-right">
                {post.author}
                <span aria-hidden="true" className="mx-1.5">
                  ·
                </span>
                {dateCourte(post.dateIso)}
              </span>
            </Link>
          </li>
        ))}
        <li className="border-t border-gray-200" />
      </ul>

      {reste > 0 && (
        <button
          type="button"
          onClick={() => setVisibles((v) => v + PAR_PAGE)}
          className="mt-10 inline-flex h-9 items-center rounded-full bg-[#F4F4F6] px-4 text-[15px] text-gray-700 transition-colors hover:bg-[#ECECEE] hover:text-gray-950"
        >
          Charger plus
        </button>
      )}
    </section>
  );
}
