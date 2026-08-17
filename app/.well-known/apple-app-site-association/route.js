import { NextResponse } from "next/server";

const AASA = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "4F5LLQW333.fr.newbi.app",
        paths: [
          "/banking-callback",
          "/banking-callback/*",
          // Lien d'invitation membre : le mail pointe vers
          // /accept-invitation/{id}?org=&email=&role=. Si l'app est installée,
          // iOS ouvre l'écran natif accept-invitation/[invitationId] ; sinon
          // fallback web. Doit rester aligné avec auth-utils.js (génération du lien)
          // et app-newbi/app/accept-invitation/[invitationId].jsx.
          "/accept-invitation",
          "/accept-invitation/*",
        ],
      },
    ],
  },
};

export async function GET() {
  return NextResponse.json(AASA, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
