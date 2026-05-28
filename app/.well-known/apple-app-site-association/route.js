import { NextResponse } from "next/server";

const AASA = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "4F5LLQW333.fr.newbi.app",
        paths: ["/banking-callback", "/banking-callback/*"],
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
