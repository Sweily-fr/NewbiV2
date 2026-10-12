import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import { getModuleActions } from "@/src/lib/organization-roles";
import {
  apiError,
  requireSession,
  toObjectId,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * Identité seule d'un membre, pour un rôle sans « Voir les membres » : de
 * quoi afficher et assigner un collègue (assignation d'un client sur
 * l'app mobile) et désigner le super admin qui peut donner un accès (page
 * d'accès refusé). Ni les rôles des autres, ni les dates, ni les
 * invitations en attente.
 */
function memberIdentity(member) {
  const isOwner = String(member.role || "")
    .toLowerCase()
    .split(",")
    .map((r) => r.trim())
    .includes("owner");
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    avatar: member.avatar,
    image: member.image,
    type: "member",
    ...(isOwner ? { role: "owner" } : {}),
  };
}

/**
 * GET /api/organizations/[organizationId]/members
 *
 * Membres et invitations d'un espace.
 * Auth : session + membre de l'espace (NOUVEAU-4 : pas de lecture d'un autre
 * espace). La liste complète (rôles, statuts, invitations) suit le droit
 * « Voir les membres » (page Membres) ; sans lui, l'identité des membres
 * seulement (cf. memberIdentity).
 */
async function handler(request, { params }) {
  const { user } = await requireSession(request);
  const { organizationId } = await params;

  const orgObjectId = toObjectId(organizationId);

  const { role, actions } = await getModuleActions(mongoDb, {
    userId: user.id,
    organizationId: orgObjectId,
    moduleKey: "team",
  });
  if (!role) {
    throw apiError(403, "Non autorisé");
  }
  const canViewTeam = actions.includes("view");

  // Fetch members with user lookup
  const members = await mongoDb
    .collection("member")
    .aggregate([
      {
        $match: {
          organizationId: orgObjectId,
        },
      },
      {
        $addFields: {
          userIdAsObjectId: {
            $cond: {
              if: { $eq: [{ $type: "$userId" }, "string"] },
              then: { $toObjectId: "$userId" },
              else: "$userId",
            },
          },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userIdAsObjectId",
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
          avatar: { $ifNull: ["$user.avatar", "$user.image"] },
          image: "$user.image",
          type: { $literal: "member" },
        },
      },
    ])
    .toArray();

  if (!canViewTeam) {
    return NextResponse.json({
      success: true,
      data: members.map(memberIdentity),
    });
  }

  // Fetch invitations
  const invitations = await mongoDb
    .collection("invitation")
    .find({
      organizationId: orgObjectId,
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

  return NextResponse.json({
    success: true,
    data: [...members, ...formattedInvitations],
  });
}

export const GET = withErrorHandler(handler);
