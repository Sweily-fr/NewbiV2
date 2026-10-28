import { describe, it, expect } from "vitest";
import {
  buildComposerReturnTo,
  buildSettingsReturnTo,
  countPostLength,
  formatParisDateTime,
  formatParisTime,
  getDefaultScheduleParts,
  getMaxImages,
  getPlatformsRequiringImage,
  getPostStatusInfo,
  getSocialConnectErrorMessage,
  getTextLimit,
  isInstagramRatioValid,
  isLinkedInSizeValid,
  isoToParisParts,
  joinLabels,
  parisPartsToIso,
  shouldPollSocialPosts,
  validateSocialPost,
} from "@/src/utils/social-post-rules";

const NOW = new Date("2026-10-28T10:00:00.000Z");
const inMinutes = (min) => new Date(NOW.getTime() + min * 60000).toISOString();

const fields = (errors) => errors.map((e) => e.field);

describe("countPostLength", () => {
  it("compte les caractères, emoji compris pour un", () => {
    expect(countPostLength("Bonjour à tous", "instagram")).toBe(14);
    expect(countPostLength("Merci 🎉", "linkedin")).toBe(7);
    expect(countPostLength("", "facebook")).toBe(0);
  });

  it("X : un lien compte 23 caractères, quelle que soit sa longueur", () => {
    const url = "https://www.newbi.fr/blog/un-article-avec-un-tres-long-titre";
    expect(countPostLength(url, "twitter")).toBe(23);
    expect(countPostLength(`Lisez ${url} !`, "twitter")).toBe(6 + 23 + 2);
    expect(countPostLength("www.newbi.fr", "twitter")).toBe(23);
  });

  it("X : accents à 1, emoji et CJK à 2", () => {
    expect(countPostLength("éàç", "twitter")).toBe(3);
    expect(countPostLength("🎉", "twitter")).toBe(2);
    expect(countPostLength("👍🏽", "twitter")).toBe(2);
    expect(countPostLength("日本", "twitter")).toBe(4);
  });
});

describe("getTextLimit", () => {
  it("retient le réseau à qui il reste le moins de caractères", () => {
    const text = "a".repeat(245);
    expect(getTextLimit(text, ["instagram", "twitter"])).toEqual({
      platform: "twitter",
      label: "X",
      count: 245,
      max: 280,
      remaining: 35,
      over: false,
    });
  });

  it("signale le dépassement", () => {
    const limit = getTextLimit("a".repeat(300), ["twitter", "linkedin"]);
    expect(limit.over).toBe(true);
    expect(limit.label).toBe("X");
  });

  it("aucun réseau : pas de compteur", () => {
    expect(getTextLimit("abc", [])).toBeNull();
  });
});

describe("images", () => {
  it("maximum = le plus petit des réseaux choisis", () => {
    expect(getMaxImages(["instagram", "twitter"])).toEqual({
      max: 4,
      label: "X",
    });
    expect(getMaxImages(["tiktok"])).toEqual({ max: 35, label: "TikTok" });
    expect(getMaxImages([]).max).toBe(10);
  });

  it("Instagram et TikTok exigent une image", () => {
    expect(
      getPlatformsRequiringImage(["tiktok", "facebook", "instagram"]),
    ).toEqual(["instagram", "tiktok"]);
  });

  it("ratio Instagram entre 9:16 et 1,91:1", () => {
    expect(isInstagramRatioValid(1080, 1080)).toBe(true);
    expect(isInstagramRatioValid(1080, 1920)).toBe(true);
    expect(isInstagramRatioValid(1910, 1000)).toBe(true);
    expect(isInstagramRatioValid(1000, 2000)).toBe(false);
    expect(isInstagramRatioValid(3000, 1000)).toBe(false);
    expect(isInstagramRatioValid(null, 1000)).toBe(true);
  });

  it("taille minimale LinkedIn", () => {
    expect(isLinkedInSizeValid(1200, 627)).toBe(true);
    expect(isLinkedInSizeValid(500, 500)).toBe(false);
  });
});

describe("validateSocialPost", () => {
  const base = {
    platforms: ["facebook"],
    content: "Nouveau produit en boutique",
    media: [],
    scheduledFor: inMinutes(60),
    now: NOW,
  };

  it("post valide", () => {
    expect(validateSocialPost(base)).toEqual([]);
  });

  it("exige un compte", () => {
    expect(fields(validateSocialPost({ ...base, platforms: [] }))).toContain(
      "accounts",
    );
  });

  it("exige un texte ou une image", () => {
    const errors = validateSocialPost({ ...base, content: "   " });
    expect(errors[0]).toEqual({
      field: "content",
      code: "empty",
      message: "Écrivez un texte ou ajoutez une image.",
    });
    expect(
      validateSocialPost({
        ...base,
        content: "",
        media: [{ width: 1000, height: 1000 }],
      }),
    ).toEqual([]);
  });

  it("texte trop long pour X", () => {
    const errors = validateSocialPost({
      ...base,
      platforms: ["twitter"],
      content: "a".repeat(281),
    });
    expect(errors).toEqual([
      {
        field: "content",
        code: "text_too_long",
        message: "Le texte dépasse la limite de X (281 / 280).",
      },
    ]);
  });

  it("image obligatoire pour Instagram et TikTok", () => {
    const errors = validateSocialPost({
      ...base,
      platforms: ["instagram", "tiktok"],
      tiktok: { privacyLevel: "PUBLIC_TO_EVERYONE", consentGiven: true },
    });
    expect(errors).toEqual([
      {
        field: "media",
        code: "image_required",
        message: "Instagram et TikTok demandent au moins une image.",
      },
    ]);
  });

  it("trop d'images pour X", () => {
    const media = Array.from({ length: 5 }, () => ({
      width: 1000,
      height: 1000,
    }));
    const errors = validateSocialPost({
      ...base,
      platforms: ["twitter"],
      media,
    });
    expect(errors[0].message).toBe("X accepte 4 images au maximum.");
  });

  it("ratio Instagram refusé, avec le numéro de l'image", () => {
    const errors = validateSocialPost({
      ...base,
      platforms: ["instagram"],
      media: [
        { width: 1000, height: 1000 },
        { width: 3000, height: 1000 },
      ],
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("instagram_ratio");
    expect(errors[0].message).toBe(
      "Image 2 trop allongée pour Instagram : recadrez-la entre le format portrait 9:16 et le format paysage 1,91:1.",
    );
  });

  it("date : au moins 5 minutes dans le futur, au plus un an", () => {
    expect(
      validateSocialPost({ ...base, scheduledFor: inMinutes(4) })[0].message,
    ).toBe(
      "La date de publication doit être au moins 5 minutes dans le futur.",
    );
    expect(
      validateSocialPost({ ...base, scheduledFor: inMinutes(60 * 24 * 400) })[0]
        .message,
    ).toBe("La date de publication ne peut pas dépasser un an.");
    expect(validateSocialPost({ ...base, scheduledFor: null })[0].field).toBe(
      "when",
    );
  });

  it("publier maintenant : pas de contrôle de date", () => {
    expect(
      validateSocialPost({ ...base, scheduledFor: null, publishNow: true }),
    ).toEqual([]);
  });

  it("TikTok : visibilité et consentement obligatoires", () => {
    const errors = validateSocialPost({
      ...base,
      platforms: ["tiktok"],
      media: [{ width: 1080, height: 1920 }],
      tiktok: {},
    });
    expect(errors.map((e) => e.field)).toEqual(["tiktok", "tiktok"]);
    expect(
      validateSocialPost({
        ...base,
        platforms: ["tiktok"],
        media: [{ width: 1080, height: 1920 }],
        tiktok: {
          privacyLevel: "SELF_ONLY",
          consentGiven: true,
          canPostMore: false,
        },
      })[0].message,
    ).toContain("ne peut plus publier");
  });
});

describe("heure de Paris", () => {
  it("convertit une saisie en heure d'hiver et d'été", () => {
    expect(parisPartsToIso("2026-12-15", "09:00")).toBe(
      "2026-12-15T08:00:00.000Z",
    );
    expect(parisPartsToIso("2026-07-01", "09:00")).toBe(
      "2026-07-01T07:00:00.000Z",
    );
  });

  it("jours de changement d'heure", () => {
    // 25 octobre 2026 : 3 h → 2 h
    expect(parisPartsToIso("2026-10-25", "12:00")).toBe(
      "2026-10-25T11:00:00.000Z",
    );
    // 29 mars 2026 : 2 h → 3 h
    expect(parisPartsToIso("2026-03-29", "12:00")).toBe(
      "2026-03-29T10:00:00.000Z",
    );
  });

  it("aller-retour ISO ↔ date et heure de Paris", () => {
    expect(isoToParisParts("2026-10-29T08:30:00.000Z")).toEqual({
      date: "2026-10-29",
      time: "09:30",
    });
    expect(isoToParisParts(null)).toEqual({ date: "", time: "" });
  });

  it("défaut : demain 9:00 à Paris, même tard le soir en UTC", () => {
    expect(getDefaultScheduleParts(NOW)).toEqual({
      date: "2026-10-29",
      time: "09:00",
    });
    // 31 décembre 23:30 à Paris = 22:30 UTC
    expect(
      getDefaultScheduleParts(new Date("2026-12-31T22:30:00.000Z")),
    ).toEqual({ date: "2027-01-01", time: "09:00" });
  });

  it("formats d'affichage", () => {
    expect(formatParisTime("2026-10-29T13:30:00.000Z")).toBe("14:30");
    expect(formatParisDateTime("2026-10-29T13:30:00.000Z")).toBe(
      "jeudi 29 octobre à 14:30",
    );
    expect(formatParisTime(null)).toBe("");
  });
});

describe("statuts et rafraîchissement", () => {
  it("libellés de statut", () => {
    expect(getPostStatusInfo("scheduled", "2026-10-29T13:30:00.000Z")).toEqual({
      label: "Programmé · 14:30",
      tone: "scheduled",
    });
    expect(getPostStatusInfo("publishing").label).toBe("Publication…");
    expect(getPostStatusInfo("published").label).toBe("Publié");
    expect(getPostStatusInfo("failed").label).toBe("Échec");
    expect(getPostStatusInfo("partial").label).toBe("Partiel");
    expect(getPostStatusInfo("cancelled").label).toBe("Annulé");
  });

  it("rafraîchit seulement quand une publication approche ou est en cours", () => {
    expect(shouldPollSocialPosts([], NOW)).toBe(false);
    expect(
      shouldPollSocialPosts(
        [{ status: "scheduled", scheduledFor: inMinutes(60) }],
        NOW,
      ),
    ).toBe(false);
    expect(
      shouldPollSocialPosts(
        [{ status: "scheduled", scheduledFor: inMinutes(10) }],
        NOW,
      ),
    ).toBe(true);
    expect(shouldPollSocialPosts([{ status: "publishing" }], NOW)).toBe(true);
    expect(
      shouldPollSocialPosts(
        [
          {
            status: "published",
            targets: [{ platform: "facebook", status: "published" }],
          },
        ],
        NOW,
      ),
    ).toBe(false);
  });

  it("attend le lien TikTok pendant une heure", () => {
    const post = (publishedAt) => ({
      status: "published",
      targets: [{ platform: "tiktok", status: "published", publishedAt }],
    });
    expect(shouldPollSocialPosts([post(inMinutes(-5))], NOW)).toBe(true);
    expect(shouldPollSocialPosts([post(inMinutes(-90))], NOW)).toBe(false);
  });
});

describe("connexion des comptes", () => {
  it("messages de retour en échec", () => {
    expect(getSocialConnectErrorMessage("oauth_denied", "linkedin")).toBe(
      "Connexion à LinkedIn annulée.",
    );
    expect(getSocialConnectErrorMessage("payment_required", "twitter")).toBe(
      "Connexion momentanément indisponible, contactez le support Newbi.",
    );
    expect(getSocialConnectErrorMessage("nouveau_code", "twitter")).toBe(
      "La connexion à X a échoué. Réessayez.",
    );
  });

  it("chemins de retour acceptés par l'API (commencent par /dashboard/)", () => {
    expect(buildComposerReturnTo("/dashboard/outils/kanban/abc")).toBe(
      "/dashboard/outils/kanban/abc?socialPost=new",
    );
    expect(buildComposerReturnTo("//evil.com")).toBe(
      "/dashboard/outils/kanban?socialPost=new",
    );
    expect(buildSettingsReturnTo("/dashboard")).toBe(
      "/dashboard/?openSettings=true&settingsTab=applications",
    );
    expect(buildSettingsReturnTo("/dashboard/outils/factures")).toBe(
      "/dashboard/outils/factures?openSettings=true&settingsTab=applications",
    );
  });

  it("joinLabels", () => {
    expect(joinLabels(["Instagram"])).toBe("Instagram");
    expect(joinLabels(["Instagram", "X", "TikTok"])).toBe(
      "Instagram, X et TikTok",
    );
  });
});
