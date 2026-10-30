import { describe, it, expect } from "vitest";
import {
  formatSoundLabel,
  getAccountConnectorKey,
  getAccountConnectorMention,
  getConnectorLabel,
  getConnectorPlatform,
  getPostFormat,
  getPostSound,
  getPostStatusInfo,
  getSocialConnectErrorMessage,
  getSoundTargets,
  getStoryHints,
  getTargetFormatLabel,
  getTargetStatusInfo,
  getTextPlatforms,
  getTikTokDraftAvailability,
  isSoundAllowed,
  isStoryRatio,
  normalizeConnectors,
  shouldPollSocialPosts,
  validateSocialPost,
} from "@/src/utils/social-post-rules";

const NOW = new Date("2026-10-30T10:00:00.000Z");
const MB = 1000 * 1000;
const inMinutes = (min) => new Date(NOW.getTime() + min * 60000).toISOString();
const PHOTO = { width: 1080, height: 1920 };
const video = (durationMs, extra = {}) => ({
  kind: "video",
  status: "ready",
  width: 1080,
  height: 1920,
  durationMs,
  size: 20 * MB,
  ...extra,
});

// Comptes tels que renvoyés par socialPublishingStatus (capabilities)
const caps = (overrides = {}) => ({
  stories: false,
  sounds: false,
  drafts: false,
  draftsNeedReconnect: false,
  ...overrides,
});
const ACCOUNTS = {
  instagram: {
    platform: "instagram",
    connector: null,
    capabilities: caps({ stories: true }),
  },
  instagramFacebook: {
    platform: "instagram",
    connector: "facebook",
    capabilities: caps({ stories: true, sounds: true }),
  },
  instagramZernio: { platform: "instagram", capabilities: caps() },
  facebook: {
    platform: "facebook",
    connector: null,
    capabilities: caps({ stories: true }),
  },
  tiktok: {
    platform: "tiktok",
    connector: null,
    capabilities: caps({ drafts: true }),
  },
  tiktokOld: {
    platform: "tiktok",
    connector: null,
    capabilities: caps({ draftsNeedReconnect: true }),
  },
  tiktokBusiness: {
    platform: "tiktok",
    connector: "business",
    capabilities: caps({ sounds: true, drafts: true }),
  },
};

const base = {
  content: "Nouveautés de la semaine",
  media: [],
  scheduledFor: inMinutes(60),
  now: NOW,
};
const codes = (errors) => errors.map((e) => e.code);

describe("stories Instagram et Facebook", () => {
  it("format par réseau : publication par défaut, story pour Instagram et Facebook seulement", () => {
    expect(getPostFormat({}, "instagram")).toBe("post");
    expect(getPostFormat({ instagram: "story" }, "instagram")).toBe("story");
    expect(getPostFormat({ facebook: "story" }, "facebook")).toBe("story");
    expect(getPostFormat({ linkedin: "story" }, "linkedin")).toBe("post");
  });

  it("pas de limite de texte pour un réseau en story", () => {
    const long = "a".repeat(2500);
    const story = validateSocialPost({
      ...base,
      platforms: ["instagram"],
      content: long,
      media: [PHOTO],
      formats: { instagram: "story" },
    });
    expect(codes(story)).toEqual([]);
    const post = validateSocialPost({
      ...base,
      platforms: ["instagram"],
      content: long,
      media: [PHOTO],
    });
    expect(codes(post)).toEqual(["text_too_long"]);
    // Les autres réseaux du post gardent leur limite
    expect(
      getTextPlatforms(["instagram", "twitter"], {
        formats: { instagram: "story" },
      }),
    ).toEqual(["twitter"]);
  });

  it("une story exige une photo ou une vidéo, message par réseau", () => {
    const errors = validateSocialPost({
      ...base,
      platforms: ["instagram", "facebook"],
      formats: { instagram: "story", facebook: "story" },
    });
    expect(errors.filter((e) => e.field === "media")).toEqual([
      {
        field: "media",
        code: "story_media_required",
        message: "Une story Instagram exige une photo ou une vidéo.",
      },
      {
        field: "media",
        code: "story_media_required",
        message: "Une story Facebook exige une photo ou une vidéo.",
      },
    ]);
    // Texte vide accepté avec un média
    expect(
      validateSocialPost({
        ...base,
        content: "",
        platforms: ["instagram"],
        media: [PHOTO],
        formats: { instagram: "story" },
      }),
    ).toEqual([]);
  });

  it("pas de contrôle du format des photos en story", () => {
    const wide = { width: 3000, height: 1000 };
    expect(
      codes(
        validateSocialPost({
          ...base,
          platforms: ["instagram"],
          media: [wide],
          formats: { instagram: "story" },
        }),
      ),
    ).toEqual([]);
    expect(
      codes(
        validateSocialPost({
          ...base,
          platforms: ["instagram"],
          media: [wide],
        }),
      ),
    ).toEqual(["instagram_ratio"]);
  });

  it("vidéo en story : 60 s au maximum", () => {
    const errors = validateSocialPost({
      ...base,
      platforms: ["instagram", "facebook"],
      media: [video(72_000)],
      formats: { instagram: "story", facebook: "story" },
    });
    expect(errors.map((e) => e.message)).toEqual([
      "Instagram accepte des stories vidéo de 60 s au maximum (cette vidéo dure 1 min 12).",
      "Facebook accepte des stories vidéo de 60 s au maximum (cette vidéo dure 1 min 12).",
    ]);
    // En publication (Reel), 72 s passent
    expect(
      validateSocialPost({
        ...base,
        platforms: ["instagram"],
        media: [video(72_000)],
      }),
    ).toEqual([]);
  });

  it("vidéo en story Instagram : 100 Mo au maximum après préparation", () => {
    const errors = validateSocialPost({
      ...base,
      platforms: ["instagram"],
      media: [video(30_000, { size: 150 * MB })],
      formats: { instagram: "story" },
    });
    expect(errors.map((e) => e.message)).toEqual([
      "La vidéo est trop lourde pour une story Instagram (100 Mo maximum après préparation).",
    ]);
  });

  it("story refusée pour un compte qui ne la permet pas (Zernio)", () => {
    const errors = validateSocialPost({
      ...base,
      platforms: ["instagram"],
      accounts: [ACCOUNTS.instagram, ACCOUNTS.instagramZernio],
      media: [PHOTO],
      formats: { instagram: "story" },
    });
    expect(errors).toEqual([
      {
        field: "format",
        code: "story_unavailable",
        message:
          "Les stories ne sont disponibles que pour les comptes connectés directement.",
      },
    ]);
    expect(
      validateSocialPost({
        ...base,
        platforms: ["instagram"],
        accounts: [ACCOUNTS.instagram],
        media: [PHOTO],
        formats: { instagram: "story" },
      }),
    ).toEqual([]);
  });

  it("conseils : texte non affiché, plusieurs stories, format vertical", () => {
    expect(getStoryHints([PHOTO])).toEqual([
      "Le texte n'apparaît pas dans une story.",
    ]);
    expect(
      getStoryHints([PHOTO, PHOTO, { width: 1080, height: 1350 }]),
    ).toEqual([
      "Le texte n'apparaît pas dans une story.",
      "Plusieurs photos donnent plusieurs stories à la suite.",
      "Format vertical 9:16 conseillé.",
    ]);
    expect(isStoryRatio(1080, 1920)).toBe(true);
    expect(isStoryRatio(1080, 1080)).toBe(false);
    expect(isStoryRatio(null, null)).toBe(true);
  });
});

describe("son tendance", () => {
  it("Instagram : Reel seulement (une vidéo, format publication)", () => {
    expect(isSoundAllowed("instagram", { media: [video(30_000)] })).toBe(true);
    expect(
      isSoundAllowed("instagram", {
        media: [video(30_000)],
        formats: { instagram: "story" },
      }),
    ).toBe(false);
    expect(isSoundAllowed("instagram", { media: [PHOTO] })).toBe(false);
    expect(isSoundAllowed("instagram", { media: [] })).toBe(false);
  });

  it("TikTok : vidéo ou photos, publication directe seulement", () => {
    expect(isSoundAllowed("tiktok", { media: [PHOTO, PHOTO] })).toBe(true);
    expect(isSoundAllowed("tiktok", { media: [video(30_000)] })).toBe(true);
    expect(
      isSoundAllowed("tiktok", { media: [PHOTO], tiktokMode: "draft" }),
    ).toBe(false);
    expect(isSoundAllowed("facebook", { media: [video(30_000)] })).toBe(false);
  });

  it("réseaux où un son est possible, avec les comptes qui publieront sans", () => {
    const media = [video(30_000)];
    expect(
      getSoundTargets(
        [ACCOUNTS.instagram, ACCOUNTS.instagramFacebook, ACCOUNTS.tiktok],
        { media },
      ),
    ).toEqual([
      {
        platform: "instagram",
        account: ACCOUNTS.instagramFacebook,
        partial: true,
      },
    ]);
    expect(
      getSoundTargets([ACCOUNTS.tiktokBusiness], { media }).map((t) => [
        t.platform,
        t.partial,
      ]),
    ).toEqual([["tiktok", false]]);
    // Instagram Login seul : pas de son
    expect(getSoundTargets([ACCOUNTS.instagram], { media })).toEqual([]);
  });

  it("affichage du son choisi", () => {
    const post = {
      instagramSettings: {
        format: "post",
        sound: { id: "s1", title: "Midnight City", artist: "M83" },
      },
      tiktokSettings: { sound: { id: "s2", title: "Son original" } },
    };
    expect(formatSoundLabel(getPostSound(post, "instagram"))).toBe(
      "Midnight City · M83",
    );
    expect(formatSoundLabel(getPostSound(post, "tiktok"))).toBe("Son original");
    expect(getPostSound(post, "facebook")).toBeNull();
  });
});

describe("brouillons TikTok", () => {
  const tiktokPost = (overrides) =>
    validateSocialPost({
      ...base,
      platforms: ["tiktok"],
      media: [PHOTO],
      ...overrides,
    });

  it("en brouillon : ni confidentialité, ni divulgation, ni quota du compte", () => {
    expect(
      tiktokPost({
        accounts: [ACCOUNTS.tiktok],
        tiktok: { mode: "draft", canPostMore: false, commercial: true },
      }),
    ).toEqual([]);
    // En publication directe, la confidentialité reste obligatoire
    expect(codes(tiktokPost({ tiktok: { mode: "direct" } }))).toEqual([
      "tiktok_privacy",
    ]);
  });

  it("compte connecté avant les brouillons : reconnexion demandée", () => {
    expect(
      tiktokPost({ accounts: [ACCOUNTS.tiktokOld], tiktok: { mode: "draft" } }),
    ).toEqual([
      {
        field: "tiktok",
        code: "tiktok_draft_unavailable",
        message: "Reconnectez votre compte TikTok pour envoyer en brouillon.",
      },
    ]);
    expect(getTikTokDraftAvailability([ACCOUNTS.tiktokOld])).toEqual({
      available: false,
      needsReconnect: true,
      offered: true,
    });
    expect(
      getTikTokDraftAvailability([ACCOUNTS.tiktok, ACCOUNTS.tiktokBusiness]),
    ).toEqual({ available: true, needsReconnect: false, offered: true });
    // Compte sans aucune possibilité de brouillon : choix non proposé
    expect(
      getTikTokDraftAvailability([{ platform: "tiktok", capabilities: caps() }])
        .offered,
    ).toBe(false);
  });

  it("vidéo en brouillon : texte non transmis, durée du compte ignorée", () => {
    const errors = tiktokPost({
      accounts: [ACCOUNTS.tiktok],
      media: [video(400_000)],
      content: "a".repeat(2300),
      tiktok: { mode: "draft", maxVideoDurationSec: 180 },
    });
    expect(errors).toEqual([]);
    expect(
      getTextPlatforms(["tiktok"], { tiktokMode: "draft", video: true }),
    ).toEqual([]);
    // Photos en brouillon : le texte part en description (limite gardée)
    expect(
      getTextPlatforms(["tiktok"], { tiktokMode: "draft", video: false }),
    ).toEqual(["tiktok"]);
  });

  it("TikTok Business : une vidéo est toujours publique", () => {
    const business = (media, privacyLevel) =>
      tiktokPost({
        accounts: [ACCOUNTS.tiktokBusiness],
        media,
        tiktok: { mode: "direct", privacyLevel },
      });
    expect(business([video(30_000)], "SELF_ONLY")).toEqual([
      {
        field: "tiktok",
        code: "tiktok_business_public",
        message:
          "Avec un compte TikTok Business, une vidéo est toujours publique : choisissez « Tout le monde ».",
      },
    ]);
    expect(business([video(30_000)], "PUBLIC_TO_EVERYONE")).toEqual([]);
    // Photos : confidentialité libre
    expect(business([PHOTO], "SELF_ONLY")).toEqual([]);
  });
});

describe("affichage des cibles", () => {
  it("brouillon TikTok livré", () => {
    const draft = {
      platform: "tiktok",
      status: "published",
      deliveredAs: "draft",
    };
    expect(getTargetStatusInfo("published", draft)).toEqual({
      label: "Envoyé en brouillon TikTok",
      tone: "success",
    });
    expect(getTargetStatusInfo("published").label).toBe("Publié");
    expect(getPostStatusInfo("published", null, [draft]).label).toBe(
      "Envoyé en brouillon TikTok",
    );
    expect(
      getPostStatusInfo("published", null, [
        draft,
        { platform: "facebook", status: "published" },
      ]).label,
    ).toBe("Publié");
  });

  it("story : « Story », puis le nombre de stories publiées", () => {
    const post = {
      instagramSettings: { format: "story" },
      facebookSettings: { format: "post" },
    };
    expect(
      getTargetFormatLabel(post, { platform: "instagram", storyCount: 0 }),
    ).toBe("Story");
    expect(
      getTargetFormatLabel(post, { platform: "instagram", storyCount: 3 }),
    ).toBe("3 stories");
    expect(
      getTargetFormatLabel(post, { platform: "facebook", storyCount: 0 }),
    ).toBeNull();
    expect(getTargetFormatLabel({}, { platform: "instagram" })).toBeNull();
  });

  it("un brouillon TikTok n'a jamais de lien : pas de rafraîchissement", () => {
    const post = {
      status: "published",
      targets: [
        {
          platform: "tiktok",
          status: "published",
          deliveredAs: "draft",
          publishedAt: inMinutes(-5),
        },
      ],
    };
    expect(shouldPollSocialPosts([post], NOW)).toBe(false);
  });
});

describe("connexion par connecteur", () => {
  it("connecteurs de l'API, dans l'ordre des réseaux, aide du cahier des charges", () => {
    const connectors = normalizeConnectors(
      [
        { key: "tiktok", platform: "tiktok", label: "TikTok" },
        {
          key: "tiktok_business",
          platform: "tiktok",
          label: "TikTok Business",
          description: "Permet d'ajouter un son tendance",
        },
        { key: "instagram", platform: "instagram", label: "Instagram" },
        {
          key: "instagram_facebook",
          platform: "instagram",
          label: "Instagram via Facebook",
          description: "Permet d'ajouter un son tendance aux Reels",
        },
        { key: "inconnu", platform: "myspace", label: "?" },
      ],
      ["instagram", "tiktok"],
    );
    expect(connectors.map((c) => c.key)).toEqual([
      "instagram",
      "instagram_facebook",
      "tiktok",
      "tiktok_business",
    ]);
    expect(connectors[1].description).toBe(
      "Permet d'ajouter un son tendance aux Reels. Le compte doit être relié à une Page Facebook.",
    );
    expect(connectors[3].description).toBe("Permet d'ajouter un son tendance.");
    expect(connectors[0].description).toBeNull();
  });

  it("API sans connecteurs : un par réseau connectable", () => {
    expect(normalizeConnectors(undefined, ["tiktok", "twitter"])).toEqual([
      { key: "twitter", platform: "twitter", label: "X", description: null },
      { key: "tiktok", platform: "tiktok", label: "TikTok", description: null },
    ]);
  });

  it("mode de connexion d'un compte : clé de reconnexion et mention", () => {
    expect(getAccountConnectorKey(ACCOUNTS.instagramFacebook)).toBe(
      "instagram_facebook",
    );
    expect(getAccountConnectorKey(ACCOUNTS.tiktokBusiness)).toBe(
      "tiktok_business",
    );
    expect(getAccountConnectorKey(ACCOUNTS.instagram)).toBe("instagram");
    expect(getAccountConnectorMention(ACCOUNTS.instagramFacebook)).toBe(
      "via Facebook",
    );
    expect(getAccountConnectorMention(ACCOUNTS.tiktokBusiness)).toBe(
      "Business",
    );
    expect(getAccountConnectorMention(ACCOUNTS.instagram)).toBeNull();
  });

  it("libellés et messages de retour de connexion", () => {
    expect(getConnectorLabel("instagram_facebook")).toBe(
      "Instagram via Facebook",
    );
    expect(getConnectorLabel("twitter")).toBe("X");
    expect(getConnectorPlatform("tiktok_business")).toBe("tiktok");
    expect(
      getSocialConnectErrorMessage("no_instagram_account", "instagram"),
    ).toBe(
      "Aucun compte Instagram professionnel n'est relié à vos Pages Facebook.",
    );
    expect(
      getSocialConnectErrorMessage("oauth_denied", "tiktok_business"),
    ).toBe("Connexion à TikTok annulée.");
  });
});
