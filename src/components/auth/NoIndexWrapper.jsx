"use client";

import Head from "next/head";

/**
 * Wrapper pour les pages d'authentification
 * Ajoute automatiquement noindex pour éviter l'indexation par les moteurs de recherche
 */
export default function NoIndexWrapper({ children }) {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <meta name="googlebot" content="noindex,nofollow" />
      </Head>
      {children}
    </>
  );
}
