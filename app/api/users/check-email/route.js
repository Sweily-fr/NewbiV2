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

    // Check if user exists in the users collection
    const existingUser = await db.collection("user").findOne({
      email: email.toLowerCase(),
    });

    return NextResponse.json({
      exists: !!existingUser,
      email: email,
    });
  } catch (error) {
    console.error("Error checking user email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
