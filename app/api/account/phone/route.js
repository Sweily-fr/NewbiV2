import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { toObjectId, withErrorHandler } from "@/src/lib/security";
import { normalizeAccountPhone } from "@/src/lib/account-phone";

// Numéro de téléphone du profil. Le plugin « phone-number » de Better Auth
// refuse de le modifier par update-user (il attend une vérification par
// SMS, que Newbi n'envoie pas) : enregistré ici, non vérifié, comme une
// information de contact.

async function handler(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const phoneNumber = normalizeAccountPhone(body?.phoneNumber);
  if (!phoneNumber) {
    return NextResponse.json(
      { error: "Numéro de téléphone invalide" },
      { status: 400 },
    );
  }

  const { mongoDb } = await import("@/src/lib/mongodb");
  await mongoDb.collection("user").updateOne(
    { _id: toObjectId(session.user.id) },
    {
      $set: { phoneNumber, phoneNumberVerified: false, updatedAt: new Date() },
    },
  );

  return NextResponse.json({ success: true, phoneNumber });
}

export const PATCH = withErrorHandler(handler);
