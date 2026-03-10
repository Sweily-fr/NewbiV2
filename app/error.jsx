"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("[Error Boundary]", error);

    // Chunk stale apres un nouveau deploiement Vercel :
    // le navigateur tente de charger un fichier JS qui n'existe plus.
    // Auto-reload une seule fois pour charger la nouvelle version.
    const isChunkError =
      error?.message?.includes("Unexpected token") ||
      error?.message?.includes("ChunkLoadError") ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.name === "ChunkLoadError";

    if (isChunkError) {
      const reloadKey = "chunk_reload_" + window.location.pathname;
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      // Reload une seule fois par page (evite boucle infinie)
      if (!lastReload || now - parseInt(lastReload, 10) > 30000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
        return;
      }
    }
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          Une erreur est survenue
        </h2>
        <p
          style={{
            color: "#6b7280",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          La page n&apos;a pas pu être chargée. Veuillez réessayer.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => reset()}
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: "#5b4fff",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Réessayer
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
