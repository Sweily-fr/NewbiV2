import { NextResponse } from "next/server";

/**
 * Proxy same-origin des PDF archivés (factures, devis, avoirs, bons de
 * commande) et des fichiers originaux importés (documents importés,
 * justificatifs de factures d'achat).
 *
 * Les sidebars affichent l'aperçu "document faisant foi" dans une iframe. Une
 * iframe pointant directement sur api.newbi.fr part SANS cookie de session
 * (cookie host-only www.newbi.fr) : 401 côté API et ERR_BLOCKED_BY_RESPONSE
 * dans le navigateur (incident du 30/07/2026). Ce proxy sert le PDF depuis la
 * même origine : le cookie arrive naturellement ici, on le transmet à l'API
 * qui garde l'intégralité de l'authentification et du contrôle d'accès
 * (session + appartenance à l'organisation du document).
 *
 * Même pattern que /api/shared-documents/preview-file/[documentId].
 */

const UPSTREAM_PATHS = {
  invoice: (id) => `/invoices/${id}/document-pdf`,
  quote: (id) => `/documents/quote/${id}/document-pdf`,
  creditNote: (id) => `/documents/creditNote/${id}/document-pdf`,
  purchaseOrder: (id) => `/documents/purchaseOrder/${id}/document-pdf`,
  // Documents importés : le fichier original (R2) est streamé par l'API,
  // jamais chargé via son URL publique (bloquée par frame-src en prod).
  importedInvoice: (id) => `/documents/imported/importedInvoice/${id}/file`,
  importedQuote: (id) => `/documents/imported/importedQuote/${id}/file`,
  importedPurchaseOrder: (id) =>
    `/documents/imported/importedPurchaseOrder/${id}/file`,
  // Justificatifs des factures d'achat : plusieurs fichiers par document,
  // sélection via ?fileId=<id>.
  purchaseInvoice: (id) => `/documents/imported/purchaseInvoice/${id}/file`,
};

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

export async function GET(request, { params }) {
  try {
    const { type, id } = await params;

    const buildPath = UPSTREAM_PATHS[type];
    if (!buildPath || !OBJECT_ID_RE.test(id || "")) {
      return NextResponse.json(
        { error: "Type de document ou identifiant invalide" },
        { status: 400 },
      );
    }

    const fileId = request.nextUrl.searchParams.get("fileId");
    if (fileId && !OBJECT_ID_RE.test(fileId)) {
      return NextResponse.json(
        { error: "Identifiant de fichier invalide" },
        { status: 400 },
      );
    }

    const cookie = request.headers.get("cookie");
    if (!cookie) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    const upstreamUrl = `${backendUrl}${buildPath(id)}${
      fileId ? `?fileId=${fileId}` : ""
    }`;
    const response = await fetch(upstreamUrl, {
      headers: { cookie },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        return NextResponse.json(error, { status: response.status });
      }
      return NextResponse.json(
        { error: `Erreur ${response.status}: ${response.statusText}` },
        { status: response.status },
      );
    }

    // Streamer la réponse sans buffer en mémoire
    const headers = new Headers();
    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") || "application/pdf",
    );
    if (response.headers.get("Content-Disposition")) {
      headers.set(
        "Content-Disposition",
        response.headers.get("Content-Disposition"),
      );
    }
    if (response.headers.get("Content-Length")) {
      headers.set("Content-Length", response.headers.get("Content-Length"));
    }
    // Document nominatif servi sous session : jamais de cache partagé
    // (private). Le PDF archivé étant immuable, le navigateur peut en garder
    // une copie locale 1 h : réouvertures instantanées, y compris après un
    // rechargement de page.
    headers.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(response.body, { status: 200, headers });
  } catch (error) {
    console.error("Erreur proxy document preview:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
