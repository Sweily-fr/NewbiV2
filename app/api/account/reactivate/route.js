import { auth } from "@/src/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email et token requis" },
        { status: 400 }
      );
    }

    // Décoder le token
    let userId, timestamp;
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      [userId, timestamp] = decoded.split(":");
      console.log("Token décodé:", { decoded, userId, timestamp });
    } catch (error) {
      console.log("Erreur décodage token:", error);
      return NextResponse.json({ error: "Token invalide" }, { status: 400 });
    }

    // Vérifier que le token n'est pas expiré (24 heures)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

    if (tokenAge > maxAge) {
      return NextResponse.json({ error: "Token expiré" }, { status: 400 });
    }

    // Trouver l'utilisateur via MongoDB directement
    const { mongoDb } = await import("@/src/lib/mongodb");
    const usersCollection = mongoDb.collection("user");
    
    console.log("Recherche utilisateur avec:", { userId, email });
    
    // D'abord chercher l'utilisateur par email seulement
    const userByEmail = await usersCollection.findOne({ email: email });
    console.log("Utilisateur trouvé par email:", userByEmail);
    
    // Puis chercher avec les critères complets
    const user = await usersCollection.findOne({
      _id: new (await import("mongodb")).ObjectId(userId),
      email: email,
      isActive: false // Vérifier que le compte est bien désactivé
    });
    
    console.log("Utilisateur trouvé avec critères complets:", user);

    if (!user) {
      console.log("Aucun utilisateur trouvé avec les critères:", { id: userId, email, isActive: false });
      return NextResponse.json(
        { error: "Utilisateur non trouvé ou compte déjà actif" },
        { status: 404 }
      );
    }

    // Réactiver le compte via MongoDB
    await usersCollection.updateOne(
      { _id: new (await import("mongodb")).ObjectId(userId) },
      { 
        $set: {
          isActive: true,
          updatedAt: new Date(),
        }
      }
    );

    console.log(`Compte réactivé pour l'utilisateur: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Compte réactivé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la réactivation du compte:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
