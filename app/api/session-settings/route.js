import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { getAccountActions } from "@/src/lib/organization-roles";
import { ObjectId } from "mongodb";
import { enforceSessionLimit } from "@/src/lib/enforce-session-limit";

// Valeurs par défaut
const DEFAULTS = {
  sessionDuration: 30, // jours
  inactivityTimeout: 12, // heures
  maxSessions: 3, // téléphone, ordinateur, 2e navigateur
};

// Valeurs autorisées
const ALLOWED = {
  sessionDuration: [7, 30, 90],
  inactivityTimeout: [0.25, 1, 12, 24],
  maxSessions: [1, 2, 3],
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
        { projection: { sessionSettings: 1 } },
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
        { status: 400 },
      );
    }

    // Réglages de sécurité de l'espace : « Modifier » les informations de
    // l'entreprise (un rôle qui n'a que « Voir » est refusé)
    const { role, actions } = await getAccountActions(mongoDb, {
      userId: session.user.id,
      organizationId: orgId,
      moduleKey: "orgSettings",
    });
    if (!role || !actions.includes("edit")) {
      return NextResponse.json(
        { error: "Votre rôle ne permet pas de modifier ces réglages." },
        { status: 403 },
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    const update = {};

    // Valider chaque champ : un nombre de la liste autorisée (ou son
    // écriture exacte en texte), sinon la demande est refusée en entier
    for (const key of Object.keys(DEFAULTS)) {
      if (body[key] === undefined) continue;
      const raw = body[key];
      const val =
        typeof raw === "number"
          ? raw
          : typeof raw === "string" && /^\d+(\.\d+)?$/.test(raw.trim())
            ? Number(raw.trim())
            : NaN;
      if (!ALLOWED[key].includes(val)) {
        return NextResponse.json(
          { error: "Valeur non autorisée pour ce réglage" },
          { status: 400 },
        );
      }
      update[key] = val;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Aucun paramètre valide" },
        { status: 400 },
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

    // Si maxSessions a été modifié, appliquer immédiatement la nouvelle limite
    // pour l'utilisateur en cours (révocation des sessions excédentaires).
    let revokedCount = 0;
    if (update.maxSessions !== undefined) {
      try {
        const userObjectId = new ObjectId(session.user.id);
        const result = await enforceSessionLimit({
          userObjectId,
          currentSessionToken: session.session?.token || null,
          maxSessions: update.maxSessions,
          trigger: "settings_update_max_sessions",
        });
        revokedCount = result.revokedCount;
      } catch (err) {
        console.error("❌ [SESSION-SETTINGS] enforceSessionLimit error:", err);
      }
    }

    // Lire les settings mis à jour
    const org = await mongoDb
      .collection("organization")
      .findOne(
        { _id: new ObjectId(orgId) },
        { projection: { sessionSettings: 1 } },
      );

    return NextResponse.json({
      ...DEFAULTS,
      ...(org?.sessionSettings || {}),
      revokedCount,
    });
  } catch (error) {
    console.error("❌ [SESSION-SETTINGS] PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
