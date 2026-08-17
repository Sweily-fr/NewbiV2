import { MobileAppLanding } from "./mobile-app-landing";

export const metadata = {
  title: "Disponible sur ordinateur — Newbi",
  robots: { index: false, follow: false },
};

export default function MobileNonDisponible() {
  return <MobileAppLanding />;
}
