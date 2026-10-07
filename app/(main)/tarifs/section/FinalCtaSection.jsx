import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

/* Appel à l'action final repris de linear.app/pricing, transposé en clair.
   Mesures relevées sur leur page : bloc centré en colonne avec 40 px entre le
   titre et les boutons et 224 px d'air au-dessus et au-dessous, titre de
   72 px sur un interlignage de 72 px en graisse 510 avec un crénage de
   −0,022 em, et 12 px entre les deux boutons. Les boutons eux-mêmes ne sont
   pas ceux de Linear : ce sont ceux de la page, au même gabarit que la grille
   tarifaire et que la navbar (violet Newbi pour l'action principale, contour
   pour la seconde). */

export default function FinalCtaSection() {
  return (
    /* L'air du haut est celui de Linear (224 px au plus large). Celui du bas est
       calculé pour que l'espace visible avant et après le bloc soit identique :
       on retire du total l'espacement que la FAQ apporte déjà (40 / 80 / 88 px)
       et celui que la section comparative pose au-dessus. */
    <section className="px-5 pt-24 pb-[120px] md:pt-40 md:pb-[176px] lg:pt-56 lg:pb-[232px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10">
        <h2 className="text-balance text-center text-[2.5rem] font-medium leading-none tracking-[-0.022em] text-gray-950 md:text-[3.5rem] lg:text-[4.5rem]">
          Commencez aujourd&apos;hui.
          <br />
          30 jours offerts.
        </h2>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button asChild size="md" variant="primary" className="px-5">
            <Link href="/auth/signup">
              <span>Commencer gratuitement</span>
            </Link>
          </Button>
          <Button asChild size="md" variant="outline" className="px-5">
            <Link href="/contact">
              <span>Parler à un conseiller</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
