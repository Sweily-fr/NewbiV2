import { z } from "zod";

/**
 * Zod schema for POST /api/create-org-subscription body.
 * Principle 7: inputs validated by schema, not by trust.
 *
 * Validates organizationData with strict mode (rejects unknown fields).
 * invitedMembers: role cannot be "owner" (MOYEN-18).
 * type: whitelisted enum (MOYEN-20).
 */

const invitedMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer", "accountant"]), // "owner" excluded (MOYEN-18)
});

const organizationDataSchema = z
  .object({
    name: z.string().max(200).optional().default(""),
    type: z.enum(["onboarding", "new", "existing"]), // MOYEN-20: whitelisted
    planName: z
      .enum(["freelance", "pme", "entreprise"])
      .optional()
      .default("freelance"),
    isAnnual: z.boolean().optional().default(false),

    // Invited members — max 25 per request, no "owner" role
    invitedMembers: z.array(invitedMemberSchema).max(25).optional().default([]),

    // Logo URL
    logo: z.string().max(500).nullable().optional(),

    // Company data (all optional — provided by onboarding flow, not by other flows)
    companyName: z.string().max(200).optional().default(""),
    siret: z
      .string()
      .regex(/^\d{14}$/)
      .optional()
      .or(z.literal("")),
    siren: z
      .string()
      .regex(/^\d{9}$/)
      .optional()
      .or(z.literal("")),
    legalForm: z.string().max(100).optional().default(""),
    addressStreet: z.string().max(200).optional().default(""),
    addressCity: z.string().max(100).optional().default(""),
    addressZipCode: z.string().max(10).optional().default(""),
    addressCountry: z.string().max(50).optional().default("France"),
    employeeCount: z.string().max(20).optional().default(""),
    activitySector: z.string().max(100).optional().default(""),
    activityCategory: z.string().max(100).optional().default(""),

    // Source de la requête (mobile app → web signup flow)
    source: z.enum(["mobile"]).optional(),
  })
  .strict();

export const createOrgSubscriptionSchema = z
  .object({
    organizationData: organizationDataSchema,
  })
  .strict();
