// Pages publiques de prise de rendez-vous (/rdv/<adresse>, /rdv/gerer/<jeton>) :
// sans compte, jamais indexées (aussi X-Robots-Tag dans next.config.js),
// absentes du sitemap. Intégrables en iframe avec ?embed=1.
export const metadata = {
  title: "Prise de rendez-vous",
  robots: { index: false, follow: false },
};

export default function RdvLayout({ children }) {
  return children;
}
