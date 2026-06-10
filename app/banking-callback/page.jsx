import RedirectToApp from "./redirect-to-app";

export const metadata = {
  title: "Connexion bancaire — Newbi",
  robots: "noindex,nofollow",
};

export default function BankingCallbackPage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#FAFAFB",
        color: "#1A1A1A",
      }}
    >
      {/* Rebond automatique vers l'app mobile (ferme la session d'auth Bridge). */}
      <RedirectToApp />
      <img
        src="/newbi-icon.png"
        alt="Newbi"
        width={48}
        height={48}
        style={{ borderRadius: 12, marginBottom: 32 }}
      />
      <h1
        style={{
          fontSize: 22,
          fontWeight: 500,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Connexion bancaire terminée
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "#636466",
          textAlign: "center",
          maxWidth: 360,
          lineHeight: 1.5,
          marginBottom: 32,
        }}
      >
        Si l'app Newbi est installée, elle devrait s'ouvrir automatiquement.
        Sinon, vous pouvez la télécharger ci-dessous.
      </p>
      <a
        href="https://apps.apple.com/app/id6772126520"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 48,
          paddingLeft: 24,
          paddingRight: 24,
          borderRadius: 24,
          backgroundColor: "#5A50FF",
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        Télécharger Newbi
      </a>
    </main>
  );
}
