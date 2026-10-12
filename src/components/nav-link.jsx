"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { usePrefetchOnIntent } from "@/src/hooks/usePrefetchOnIntent";

/**
 * next/link qui précharge la page complète dès l'intention de clic (survol,
 * focus, appui). Le préchargement automatique de Next 15 s'arrête au
 * loading.jsx des routes dynamiques : la page et ses chunks JS ne partaient
 * qu'au clic. Même API que next/link ; les href externes ou en objet gardent le
 * comportement standard.
 */
const NavLink = forwardRef(function NavLink(
  { href, onMouseEnter, onMouseLeave, onFocus, onPointerDown, ...props },
  ref,
) {
  const { intentProps } = usePrefetchOnIntent();
  const intent = intentProps(typeof href === "string" ? href : null);

  return (
    <Link
      ref={ref}
      href={href}
      {...props}
      onMouseEnter={(event) => {
        intent.onMouseEnter();
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        intent.onMouseLeave();
        onMouseLeave?.(event);
      }}
      onFocus={(event) => {
        intent.onFocus();
        onFocus?.(event);
      }}
      onPointerDown={(event) => {
        intent.onPointerDown();
        onPointerDown?.(event);
      }}
    />
  );
});

export default NavLink;
