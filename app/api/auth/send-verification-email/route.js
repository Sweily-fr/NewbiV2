import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

export async function POST(request) {
  try {
    
    const { email, callbackURL } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Utiliser Better Auth pour envoyer l'email de vérification
    const result = await auth.api.sendVerificationEmail({
      body: {
        email: email.toLowerCase(),
        callbackURL: callbackURL || `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`
      }
    });

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to send verification email", details: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully"
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
