import { NextResponse } from "next/server";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { requireBackofficeAdmin } from "@/src/lib/security/require-backoffice-admin";

/**
 * Proxy authentifié vers les routes back-office de newbi-api
 * (/api/backoffice/*). Évite le CORS et ajoute une double barrière :
 * l'allowlist est vérifiée ici (session Better Auth) ET côté newbi-api.
 */

// Seuls ces chemins sont proxifiés (deny by default)
const ALLOWED_PATHS = [
  /^users$/,
  /^users\/[a-f0-9]{24}\/preview$/,
  /^users\/[a-f0-9]{24}$/,
  /^backups$/,
  /^backups\/[a-f0-9]{24}\/restore$/,
  /^backups\/[a-f0-9]{24}$/,
];

async function proxy(request, { params }) {
  const { cookieHeader } = await requireBackofficeAdmin(request);

  const { path } = await params;
  const joined = (path || []).join("/");
  if (!ALLOWED_PATHS.some((re) => re.test(joined))) {
    throw apiError(404, "Introuvable");
  }

  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw apiError(500, "NEXT_PUBLIC_API_URL non configurée");
  }

  const url = new URL(`api/backoffice/${joined}`, base);
  url.search = new URL(request.url).search;

  const init = {
    method: request.method,
    headers: {
      cookie: cookieHeader,
      "content-type": "application/json",
    },
    cache: "no-store",
  };
  if (request.method === "DELETE" || request.method === "POST") {
    init.body = await request.text();
  }

  const upstream = await fetch(url, init);
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}

export const GET = withErrorHandler(proxy);
export const POST = withErrorHandler(proxy);
export const DELETE = withErrorHandler(proxy);
