"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          color: "#111827",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "480px" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Quelque chose s&apos;est mal passé. Veuillez réessayer.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
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
              onClick={() => (window.location.href = "/")}
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
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
