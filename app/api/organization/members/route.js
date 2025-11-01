import { NextResponse } from "next/server";
import { getMongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const { organizationId } = await req.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Récupérer la base de données MongoDB
    const db = await getMongoDb();

    console.log("🔍 Searching for organizationId:", organizationId);

    // Convertir l'organizationId en ObjectId MongoDB
    const orgObjectId = new ObjectId(organizationId);

    // Récupérer les membres de l'organisation
    const members = await db
      .collection("member")
      .find({ organizationId: orgObjectId })
      .limit(4)
      .toArray();

    console.log("📊 Found members:", members.length);
    console.log("📋 Members data:", JSON.stringify(members, null, 2));

    // Récupérer les informations des utilisateurs
    const userIds = members.map((m) => m.userId).filter(Boolean);
    console.log("👤 User IDs to fetch:", userIds);
    
    // Convertir les userIds en ObjectId
    const userObjectIds = userIds.map(id => new ObjectId(id));
    
    const users = await db
      .collection("user")
      .find({ _id: { $in: userObjectIds } })
      .toArray();

    console.log("👥 Found users:", users.length);

    // Créer un map des utilisateurs pour un accès rapide (utiliser _id.toString() comme clé)
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Formater les données
    const formattedMembers = members.map((member) => {
      const user = userMap.get(member.userId.toString());
      return {
        id: member.userId.toString(),
        name: user?.name,
        email: user?.email,
        avatar: user?.image,
        role: member.role,
      };
    });

    console.log("✅ Formatted members:", formattedMembers);

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error("Error fetching organization members:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization members", details: error.message },
      { status: 500 }
    );
  }
}
