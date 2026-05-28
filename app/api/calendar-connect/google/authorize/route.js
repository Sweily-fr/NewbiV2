import { NextResponse } from "next/server";
import { requireSession, withErrorHandler } from "@/src/lib/security";

async function handler(request) {
  const { cookieHeader } = await requireSession(request);

  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/+$/, "");

  const response = await fetch(
    `${backendUrl}/calendar-connect/google/authorize`,
    {
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json(data);
}

export const GET = withErrorHandler(handler);
