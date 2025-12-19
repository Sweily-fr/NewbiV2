import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/organizations/[organizationId]/members
 * Récupère les membres d'une organisation spécifique directement depuis MongoDB
 */
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Next.js 15 : params doit être await avant d'accéder à ses propriétés
    const { organizationId } = await params;

    console.log(
      `📊 API - Récupération des membres pour org: ${organizationId}`
    );

    // Récupérer tous les membres de cette organisation
    const members = await mongoDb
      .collection("member")
      .aggregate([
        {
          $match: {
            organizationId: new ObjectId(organizationId),
            status: "active",
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: { $toString: "$_id" },
            role: 1,
            createdAt: 1,
            status: 1,
            email: "$user.email",
            name: "$user.name",
            avatar: "$user.avatar",
            type: { $literal: "member" },
          },
        },
      ])
      .toArray();

    // Récupérer les invitations pour cette organisation
    const invitations = await mongoDb
      .collection("invitation")
      .find({
        organizationId: new ObjectId(organizationId),
        status: { $ne: "canceled" },
      })
      .toArray();

    const formattedInvitations = invitations.map((inv) => ({
      id: inv._id.toString(),
      email: inv.email,
      role: inv.role,
      status: inv.status || "pending",
      createdAt: inv.createdAt,
      type: "invitation",
    }));

    const allData = [...members, ...formattedInvitations];

    console.log(
      `✅ API - ${members.length} membres + ${invitations.length} invitations pour org ${organizationId}`
    );

    return NextResponse.json({
      success: true,
      data: allData,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des membres:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
