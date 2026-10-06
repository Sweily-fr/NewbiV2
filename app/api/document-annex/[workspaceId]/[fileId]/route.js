import { NextResponse } from "next/server";

/**
 * Proxy same-origin des annexes PDF des documents (ex : CGV jointes à un
 * devis). Le cookie de session est transmis à l'API, qui vérifie
 * l'appartenance à l'organisation et lit le fichier dans le bucket R2 privé.
 * Sert l'aperçu de l'annexe dans les paramètres et les replis navigateur qui
 * ajoutent ses pages au PDF (téléchargement, envoi depuis l'éditeur).
 *
 * Même pattern que /api/document-preview/[type]/[id].
 */

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;
const FILE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;

export async function GET(request, { params }) {
  try {
    const { workspaceId, fileId } = await params;
    if (!OBJECT_ID_RE.test(workspaceId || "") || !FILE_ID_RE.test(fileId || "")) {
      return NextResponse.json({ error: "Annexe invalide" }, { status: 400 });
    }

    const cookie = request.headers.get("cookie");
    if (!cookie) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    const response = await fetch(
      `${backendUrl}/document-annexes/${workspaceId}/${fileId}`,
      { headers: { cookie }, signal: AbortSignal.timeout(30000) },
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return NextResponse.json(await response.json(), {
          status: response.status,
        });
      }
      return NextResponse.json(
        { error: `Erreur ${response.status}` },
        { status: response.status },
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", 'inline; filename="annexe.pdf"');
    if (response.headers.get("Content-Length")) {
      headers.set("Content-Length", response.headers.get("Content-Length"));
    }
    // Le fichier d'une clé ne change jamais (nouvel envoi = nouvelle clé)
    headers.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(response.body, { status: 200, headers });
  } catch (error) {
    console.error("Erreur proxy annexe de document:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
