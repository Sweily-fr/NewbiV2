import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

// Valeurs par défaut
const DEFAULTS = {
  sessionDuration: 30,     // jours
  inactivityTimeout: 12,   // heures
  maxSessions: 1,
};

// Valeurs autorisées
const ALLOWED = {
  sessionDuration: [7, 30, 90],
  inactivityTimeout: [1, 12, 24],
  maxSessions: [1, 2],
};

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const orgId = session.session?.activeOrganizationId;
    if (!orgId) {
      return NextResponse.json(DEFAULTS);
    }

    const org = await mongoDb
      .collection("organization")
      .findOne(
        { _id: new ObjectId(orgId) },
        { projection: { sessionSettings: 1 } }
      );

    return NextResponse.json({
      ...DEFAULTS,
      ...(org?.sessionSettings || {}),
    });
  } catch (error) {
    console.error("❌ [SESSION-SETTINGS] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const orgId = session.session?.activeOrganizationId;
    if (!orgId) {
      return NextResponse.json(
        { error: "Aucune organisation active" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const update = {};

    // Valider chaque champ
    for (const key of Object.keys(DEFAULTS)) {
      if (body[key] !== undefined) {
        const val = parseInt(body[key]);
        if (ALLOWED[key].includes(val)) {
          update[key] = val;
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Aucun paramètre valide" },
        { status: 400 }
      );
    }

    // $set uniquement les champs modifiés
    const setFields = {};
    for (const [k, v] of Object.entries(update)) {
      setFields[`sessionSettings.${k}`] = v;
    }

    await mongoDb
      .collection("organization")
      .updateOne({ _id: new ObjectId(orgId) }, { $set: setFields });

    // Lire les settings mis à jour
    const org = await mongoDb
      .collection("organization")
      .findOne(
        { _id: new ObjectId(orgId) },
        { projection: { sessionSettings: 1 } }
      );

    return NextResponse.json({
      ...DEFAULTS,
      ...(org?.sessionSettings || {}),
    });
  } catch (error) {
    console.error("❌ [SESSION-SETTINGS] PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
