import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  requireOrgMembership,
  toObjectId,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * GET /api/organizations/[organizationId]/members
 *
 * Retrieve members and invitations for an organization.
 * Auth: session + org membership (any role can view members).
 * NOUVEAU-4 fix: was missing membership check — cross-tenant read was possible.
 */
async function handler(request, { params }) {
  const { user } = await requireSession(request);
  const { organizationId } = await params;

  // Membership check — closes cross-tenant gap (NOUVEAU-4)
  await requireOrgMembership(user.id, organizationId);

  const orgObjectId = toObjectId(organizationId);

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
