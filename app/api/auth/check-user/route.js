import { NextResponse } from "next/server";
import { ensureConnection } from "@/src/lib/mongodb";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Ensure MongoDB connection
    const db = await ensureConnection();

    // Check if user exists in the user collection and get email verification status
    const existingUser = await db.collection("user").findOne({
      email: email.toLowerCase(),
    });

    if (!existingUser) {
      return NextResponse.json({
        exists: false,
        emailVerified: false
      });
    }

    return NextResponse.json({
      exists: true,
      emailVerified: existingUser.emailVerified || false
    });

  } catch (error) {
    console.error("Erreur lors de la vérification de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
