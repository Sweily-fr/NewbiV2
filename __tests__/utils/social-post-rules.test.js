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
  getXQuotaNote,
  isSameParisMonth,
  checkVideoFile,
  formatFileSize,
  formatVideoDuration,
  getVideoContentType,
  getVideoErrors,
  isVideoFile,
} from "@/src/utils/social-post-rules";

const NOW = new Date("2026-10-28T10:00:00.000Z");
const MB = 1024 * 1024;
const READY_VIDEO = {
  kind: "video",
  status: "ready",
  width: 1080,
  height: 1920,
  durationMs: 45_000,
  size: 40 * MB,
};
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

  it("image ou vidéo obligatoire pour Instagram et TikTok", () => {
    const errors = validateSocialPost({
      ...base,
      platforms: ["instagram", "tiktok"],
      tiktok: { privacyLevel: "PUBLIC_TO_EVERYONE", consentGiven: true },
    });
    expect(errors).toEqual([
      {
        field: "media",
        code: "image_required",
        message: "Instagram et TikTok exigent une image ou une vidéo.",
      },
    ]);
    expect(
      validateSocialPost({ ...base, platforms: ["instagram"] })[0].message,
    ).toBe("Instagram exige une image ou une vidéo.");
    // Une vidéo suffit
    expect(
      validateSocialPost({
        ...base,
        platforms: ["instagram"],
        media: [READY_VIDEO],
      }),
    ).toEqual([]);
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

  it("TikTok : visibilité obligatoire, accord donné par la déclaration du bouton", () => {
    const errors = validateSocialPost({
      ...base,
      platforms: ["tiktok"],
      media: [{ width: 1080, height: 1920 }],
      tiktok: {},
    });
    expect(errors.map((e) => e.code)).toEqual(["tiktok_privacy"]);
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

  it("TikTok : divulgation du contenu commercial complète, contenu de marque jamais privé", () => {
    const tiktokPost = (tiktok) =>
      validateSocialPost({
        ...base,
        platforms: ["tiktok"],
        media: [{ width: 1080, height: 1920 }],
        tiktok: { privacyLevel: "PUBLIC_TO_EVERYONE", ...tiktok },
      }).map((e) => e.code);
    expect(tiktokPost({ commercial: true })).toEqual(["tiktok_commercial"]);
    expect(tiktokPost({ commercial: true, brandOrganic: true })).toEqual([]);
    expect(
      tiktokPost({
        commercial: true,
        brandContent: true,
        privacyLevel: "SELF_ONLY",
      }),
    ).toEqual(["tiktok_branded_private"]);
    // Divulgation désactivée : les cases cochées avant ne comptent plus
    expect(
      tiktokPost({
        commercial: false,
        brandContent: true,
        privacyLevel: "SELF_ONLY",
      }),
    ).toEqual([]);
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
    expect(getSocialConnectErrorMessage("invalid_state", "tiktok")).toBe(
      "Le lien de connexion a expiré. Recommencez la connexion.",
    );
    expect(getSocialConnectErrorMessage("nouveau_code", "twitter")).toBe(
      "La connexion à X a échoué. Réessayez.",
    );
    expect(getSocialConnectErrorMessage("account_in_use", "instagram")).toBe(
      "Ce compte Instagram est déjà connecté à un autre espace Newbi. Déconnectez-le de cet espace d'abord.",
    );
    expect(getSocialConnectErrorMessage("cancelled", "linkedin")).toBe(
      "Connexion à LinkedIn annulée.",
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
      "/dashboard?openSettings=true&settingsTab=applications",
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

describe("limite mensuelle de posts X", () => {
  const now = new Date("2026-10-29T10:00:00Z");
  const quota = (remaining, monthlyQuota = 10) => ({
    plan: "freelance",
    monthlyQuota,
    used: monthlyQuota - remaining,
    remaining,
    resetsAt: "2026-10-31T23:00:00.000Z",
  });

  it("compare les mois à l'heure de Paris", () => {
    // 31 octobre 23:30 UTC = 1er novembre 00:30 à Paris
    expect(isSameParisMonth("2026-10-31T23:30:00Z", now)).toBe(false);
    expect(isSameParisMonth("2026-10-31T22:30:00Z", now)).toBe(true);
    expect(isSameParisMonth(null, now)).toBe(false);
  });

  it("rien sans compte X ajouté ni compteur", () => {
    expect(getXQuotaNote({ quota: quota(5), extra: 0, now })).toBeNull();
    expect(getXQuotaNote({ quota: null, extra: 1, now })).toBeNull();
  });

  it("posts restants ce mois-ci", () => {
    expect(getXQuotaNote({ quota: quota(3), extra: 1, now })).toEqual({
      tone: "muted",
      message: "X : 3 posts restants ce mois-ci sur 10 avec votre offre.",
    });
    expect(getXQuotaNote({ quota: quota(1), extra: 1, now }).message).toBe(
      "X : 1 post restant ce mois-ci sur 10 avec votre offre.",
    );
  });

  it("limite atteinte ou insuffisante : avertissement", () => {
    expect(getXQuotaNote({ quota: quota(0), extra: 1, now })).toEqual({
      tone: "warning",
      message:
        "Limite de posts X atteinte ce mois-ci (10 avec votre offre). Le compteur repart à zéro le 1er du mois prochain.",
    });
    expect(getXQuotaNote({ quota: quota(1), extra: 2, now }).tone).toBe(
      "warning",
    );
  });

  it("autre mois : limite rappelée sans compteur", () => {
    expect(
      getXQuotaNote({
        quota: quota(0),
        extra: 1,
        at: "2026-11-05T09:00:00Z",
        now,
      }),
    ).toEqual({
      tone: "muted",
      message: "X : 10 posts par mois avec votre offre.",
    });
  });
});

describe("vidéo", () => {
  const base = {
    platforms: ["facebook"],
    content: "Nouvelle vidéo",
    scheduledFor: inMinutes(60),
    now: NOW,
  };
  const codes = (input) =>
    validateSocialPost({ ...base, ...input }).map((e) => e.code);
  const messages = (input) =>
    validateSocialPost({ ...base, ...input }).map((e) => e.message);
  const file = (name, type, size = 10 * MB) => ({ name, type, size });

  it("durée lisible : secondes, minutes et secondes, minutes rondes", () => {
    expect(formatVideoDuration(45_000)).toBe("45 s");
    expect(formatVideoDuration(140_000)).toBe("2 min 20");
    expect(formatVideoDuration(185_000)).toBe("3 min 05");
    expect(formatVideoDuration(600_000)).toBe("10 min");
    // Arrondi vers le haut pour une durée trop longue, vers le bas sinon
    expect(formatVideoDuration(140_400)).toBe("2 min 21");
    expect(formatVideoDuration(2_900, { round: "down" })).toBe("2 s");
  });

  it("poids lisible", () => {
    expect(formatFileSize(300 * MB)).toBe("300 Mo");
    expect(formatFileSize(1024 * MB)).toBe("1 Go");
    expect(formatFileSize(1536 * MB)).toBe("1,5 Go");
    expect(formatFileSize(75 * 1024)).toBe("75 Ko");
  });

  it("formats acceptés : MP4, MOV, M4V, WebM (type ou extension)", () => {
    expect(getVideoContentType(file("a.mp4", "video/mp4"))).toBe("video/mp4");
    expect(getVideoContentType(file("a.mov", "video/quicktime"))).toBe(
      "video/quicktime",
    );
    expect(getVideoContentType(file("a.M4V", ""))).toBe("video/x-m4v");
    expect(getVideoContentType(file("a.webm", ""))).toBe("video/webm");
    expect(getVideoContentType(file("a.mkv", "video/x-matroska"))).toBe(null);
    expect(getVideoContentType(file("a.avi", "video/x-msvideo"))).toBe(null);
    expect(isVideoFile(file("a.mkv", "video/x-matroska"))).toBe(true);
    expect(isVideoFile(file("a.jpg", "image/jpeg"))).toBe(false);
  });

  it("contrôles avant l'envoi : format, 500 Mo, 3 secondes à 10 minutes", () => {
    expect(checkVideoFile(file("a.mp4", "video/mp4"))).toBe(null);
    expect(checkVideoFile(file("clip.avi", "video/x-msvideo"))).toBe(
      "« clip.avi » n'est pas une vidéo MP4, MOV, M4V ou WebM.",
    );
    expect(checkVideoFile(file("gros.mp4", "video/mp4", 501 * MB))).toBe(
      "« gros.mp4 » dépasse 500 Mo.",
    );
    expect(checkVideoFile(file("vide.mp4", "video/mp4", 0))).toBe(
      "« vide.mp4 » est vide.",
    );
    expect(
      checkVideoFile(file("a.mp4", "video/mp4"), { durationMs: 2_500 }),
    ).toBe("La vidéo doit durer au moins 3 secondes (elle dure 2 s).");
    expect(
      checkVideoFile(file("a.mp4", "video/mp4"), { durationMs: 750_000 }),
    ).toBe("La vidéo doit durer 10 minutes au maximum (elle dure 12 min 30).");
    // Durée illisible par le navigateur : le serveur tranchera
    expect(
      checkVideoFile(file("a.mov", "video/quicktime"), { durationMs: null }),
    ).toBe(null);
  });

  it("X : 2 min 20 au maximum", () => {
    expect(
      messages({
        platforms: ["twitter"],
        media: [{ ...READY_VIDEO, durationMs: 185_000 }],
      }),
    ).toEqual([
      "X accepte des vidéos de 2 min 20 au maximum (cette vidéo dure 3 min 05).",
    ]);
    expect(
      codes({
        platforms: ["twitter"],
        media: [{ ...READY_VIDEO, durationMs: 140_000 }],
      }),
    ).toEqual([]);
  });

  it("TikTok : durée maximale du compte (creator_info)", () => {
    const tiktok = {
      privacyLevel: "PUBLIC_TO_EVERYONE",
      maxVideoDurationSec: 60,
    };
    expect(
      messages({
        platforms: ["tiktok"],
        media: [{ ...READY_VIDEO, durationMs: 90_000 }],
        tiktok,
      }),
    ).toEqual([
      "TikTok accepte des vidéos de 1 min au maximum pour ce compte (cette vidéo dure 1 min 30).",
    ]);
    // Durée maximale inconnue : pas de contrôle
    expect(
      codes({
        platforms: ["tiktok"],
        media: [{ ...READY_VIDEO, durationMs: 90_000 }],
        tiktok: { privacyLevel: "PUBLIC_TO_EVERYONE" },
      }),
    ).toEqual([]);
  });

  it("poids après préparation : Instagram 300 Mo, LinkedIn 75 Ko minimum", () => {
    expect(
      messages({
        platforms: ["instagram", "facebook"],
        media: [{ ...READY_VIDEO, size: 310 * MB }],
      }),
    ).toEqual([
      "La vidéo est trop lourde pour Instagram (300 Mo maximum après préparation).",
    ]);
    expect(
      messages({
        platforms: ["linkedin"],
        media: [{ ...READY_VIDEO, size: 50 * 1024 }],
      }),
    ).toEqual(["La vidéo est trop légère pour LinkedIn (75 Ko minimum)."]);
    // Poids de l'original pendant l'envoi : pas encore contrôlé
    expect(
      getVideoErrors(
        { durationMs: 45_000, size: 400 * MB, status: "uploading" },
        ["instagram"],
      ),
    ).toEqual([]);
  });

  it("Instagram : pas de contrôle de format pour une vidéo", () => {
    expect(
      codes({
        platforms: ["instagram"],
        media: [{ ...READY_VIDEO, width: 3000, height: 1000 }],
      }),
    ).toEqual([]);
  });

  it("une seule vidéo, jamais avec des photos", () => {
    expect(
      codes({
        media: [READY_VIDEO, { width: 1000, height: 1000 }],
      }),
    ).toEqual(["media_mixed"]);
    expect(codes({ media: [READY_VIDEO, READY_VIDEO] })).toEqual([
      "too_many_videos",
    ]);
  });

  it("vidéo en préparation ou en échec : le post attend", () => {
    expect(
      validateSocialPost({
        ...base,
        media: [{ kind: "video", status: "processing", durationMs: 45_000 }],
      }),
    ).toEqual([
      {
        field: "media",
        code: "video_not_ready",
        message:
          "La vidéo est encore en préparation. Patientez quelques instants.",
      },
    ]);
    expect(
      messages({
        media: [
          {
            kind: "video",
            status: "failed",
            errorMessage: "Vidéo illisible ou endommagée.",
          },
        ],
      }),
    ).toEqual(["Vidéo illisible ou endommagée."]);
    // Une vidéo en cours d'envoi suffit à Instagram (pas de « exige une
    // image ou une vidéo » pendant l'envoi)
    expect(
      codes({
        platforms: ["instagram"],
        content: "",
        media: [{ kind: "video", status: "uploading" }],
      }),
    ).toEqual(["video_not_ready"]);
  });
});
