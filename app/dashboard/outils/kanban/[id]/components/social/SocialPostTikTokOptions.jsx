"use client";

import { useEffect } from "react";
import { Info, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  getApiErrorMessage,
  useTikTokCreatorInfo,
} from "@/src/hooks/useSocialPublishing";
import {
  TIKTOK_BRANDED_CONTENT_POLICY_URL,
  TIKTOK_DRAFT_RECONNECT_MESSAGE,
  TIKTOK_MUSIC_CONFIRMATION_URL,
  TIKTOK_PUBLIC_PRIVACY,
} from "@/src/utils/social-post-rules";
import { SocialNetworkIcon } from "./SocialNetworkIcon";
import { SocialSegmentedControl } from "./SocialSegmentedControl";

const PUBLIC_LABEL = "Tout le monde";

/**
 * Mode d'envoi TikTok : publication directe, ou brouillon (boîte de
 * réception de l'appli TikTok du client, qui termine la publication).
 * Brouillon grisé quand un compte n'a pas l'autorisation : la reconnexion
 * la demande.
 */
function TikTokModePicker({ value, onChange, availability, onReconnect }) {
  return (
    <div className="space-y-1.5">
      <SocialSegmentedControl
        label="Envoi sur TikTok"
        value={value}
        onChange={onChange}
        className="w-full sm:w-auto"
        options={[
          { value: "direct", label: "Publier directement" },
          {
            value: "draft",
            label: "Envoyer en brouillon",
            disabled: !availability.available,
            title: availability.available
              ? undefined
              : TIKTOK_DRAFT_RECONNECT_MESSAGE,
          },
        ]}
      />
      {!availability.available && availability.needsReconnect && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{TIKTOK_DRAFT_RECONNECT_MESSAGE}</span>
          {onReconnect && (
            <button
              type="button"
              onClick={onReconnect}
              className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#5A50FF] hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              Reconnecter
            </button>
          )}
        </p>
      )}
    </div>
  );
}

/**
 * Options TikTok du post : mode d'envoi, puis (publication directe)
 * confidentialité, interactions et divulgation du contenu commercial, lues
 * dans les réglages du compte (creator_info). En brouillon, TikTok demande
 * tout dans l'appli : rien d'autre à choisir ici.
 *
 * `businessVideo` : vidéo publiée par un compte TikTok Business, toujours
 * publique (l'API Business n'a pas de confidentialité pour la vidéo).
 */
export function TikTokOptions({
  accountId,
  accountName,
  workspaceId,
  value,
  onChange,
  onInfo,
  isVideo,
  draftAvailability,
  onReconnect,
  businessVideo = false,
}) {
  const isDraft = value.mode === "draft";
  // En brouillon, les réglages du compte ne servent pas : pas de lecture
  const { info, loading, error, refetch } = useTikTokCreatorInfo(
    isDraft ? null : accountId,
    workspaceId,
  );

  useEffect(() => {
    onInfo(isDraft ? null : info);
  }, [info, isDraft, onInfo]);

  // Commentaires désactivés sur le compte : l'option reste coupée
  useEffect(() => {
    if (info?.commentDisabled && value.allowComment) {
      onChange({ allowComment: false });
    }
  }, [info?.commentDisabled, value.allowComment, onChange]);

  // Duos et collages coupés dans TikTok par le créateur : options coupées
  useEffect(() => {
    if (info?.duetDisabled && value.allowDuet) onChange({ allowDuet: false });
  }, [info?.duetDisabled, value.allowDuet, onChange]);
  useEffect(() => {
    if (info?.stitchDisabled && value.allowStitch) {
      onChange({ allowStitch: false });
    }
  }, [info?.stitchDisabled, value.allowStitch, onChange]);

  // Vidéo d'un compte TikTok Business : toujours publique
  useEffect(() => {
    if (
      businessVideo &&
      !isDraft &&
      value.privacyLevel !== TIKTOK_PUBLIC_PRIVACY
    ) {
      onChange({ privacyLevel: TIKTOK_PUBLIC_PRIVACY });
    }
  }, [businessVideo, isDraft, value.privacyLevel, onChange]);

  // Visibilité choisie qui n'est plus proposée par le compte : à rechoisir
  // (sauf la visibilité imposée d'une vidéo TikTok Business)
  useEffect(() => {
    if (
      !businessVideo &&
      info?.privacyLevels &&
      value.privacyLevel &&
      !info.privacyLevels.some((l) => l.value === value.privacyLevel)
    ) {
      onChange({ privacyLevel: "" });
    }
  }, [businessVideo, info?.privacyLevels, value.privacyLevel, onChange]);

  // Contenu de marque : jamais visible par soi seul (règle TikTok)
  const brandedPrivate =
    value.commercial &&
    value.brandContent &&
    value.privacyLevel === "SELF_ONLY";
  const creatorName = info?.nickname || info?.username || accountName;
  const privacyLevels = info?.privacyLevels || [];
  // La visibilité imposée reste affichée même si le compte ne la liste pas
  const shownLevels =
    businessVideo &&
    !privacyLevels.some((l) => l.value === TIKTOK_PUBLIC_PRIVACY)
      ? [
          { value: TIKTOK_PUBLIC_PRIVACY, label: PUBLIC_LABEL },
          ...privacyLevels,
        ]
      : privacyLevels;

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <SocialNetworkIcon platform="tiktok" title="" />
        <span className="text-sm font-medium">Options TikTok</span>
      </div>
      {creatorName && (
        <p className="text-xs text-muted-foreground">
          {isDraft
            ? "Envoi dans les brouillons du compte TikTok"
            : "Publication sur le compte TikTok"}{" "}
          <span className="font-medium text-foreground">{creatorName}</span>
          {info?.username && info.username !== creatorName && (
            <> (@{info.username})</>
          )}
        </p>
      )}

      {draftAvailability?.offered && (
        <TikTokModePicker
          value={isDraft ? "draft" : "direct"}
          onChange={(mode) => onChange({ mode })}
          availability={draftAvailability}
          onReconnect={onReconnect}
        />
      )}

      {isDraft ? (
        <ul className="space-y-1 rounded-lg bg-muted/40 p-2.5">
          <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Vous recevrez une notification dans l&apos;appli TikTok pour
              terminer la publication (son, texte, confidentialité).
            </span>
          </li>
          {isVideo && (
            <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
              <span>
                Le texte n&apos;est pas transmis pour une vidéo en brouillon :
                vous l&apos;écrirez dans TikTok.
              </span>
            </li>
          )}
        </ul>
      ) : loading && !info ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Chargement des réglages du compte TikTok…
        </p>
      ) : error && !info ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <span>
            {getApiErrorMessage(
              error,
              "Impossible de lire les réglages du compte TikTok.",
            )}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Réessayer
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Qui peut voir ce post
            </Label>
            <Select
              value={value.privacyLevel || undefined}
              onValueChange={(privacyLevel) => onChange({ privacyLevel })}
              disabled={businessVideo}
            >
              <SelectTrigger
                className="w-full sm:w-64"
                aria-label="Qui peut voir ce post"
              >
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {shownLevels.map((level) => (
                  <SelectItem
                    key={level.value}
                    value={level.value}
                    disabled={
                      level.value === "SELF_ONLY" &&
                      value.commercial &&
                      value.brandContent
                    }
                  >
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {businessVideo && (
              <p className="text-xs text-muted-foreground">
                Avec un compte TikTok Business, une vidéo est toujours publique.
              </p>
            )}
            {value.commercial && value.brandContent && (
              <p
                className={cn(
                  "text-xs",
                  brandedPrivate
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground",
                )}
              >
                Le contenu de marque ne peut pas être visible par vous seul.
              </p>
            )}
          </div>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              Autoriser les commentaires
              {info?.commentDisabled && (
                <span className="block text-xs text-muted-foreground">
                  Les commentaires sont désactivés sur ce compte TikTok.
                </span>
              )}
            </span>
            <Switch
              checked={!!value.allowComment}
              onCheckedChange={(allowComment) => onChange({ allowComment })}
              disabled={!!info?.commentDisabled}
            />
          </label>

          {isVideo && (
            <>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Autoriser les duos
                  {info?.duetDisabled && (
                    <span className="block text-xs text-muted-foreground">
                      Les duos sont désactivés sur ce compte TikTok.
                    </span>
                  )}
                </span>
                <Switch
                  checked={!!value.allowDuet}
                  onCheckedChange={(allowDuet) => onChange({ allowDuet })}
                  disabled={!!info?.duetDisabled}
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Autoriser les collages (Stitch)
                  {info?.stitchDisabled && (
                    <span className="block text-xs text-muted-foreground">
                      Les collages sont désactivés sur ce compte TikTok.
                    </span>
                  )}
                </span>
                <Switch
                  checked={!!value.allowStitch}
                  onCheckedChange={(allowStitch) => onChange({ allowStitch })}
                  disabled={!!info?.stitchDisabled}
                />
              </label>
            </>
          )}

          {/* Divulgation du contenu commercial (consignes TikTok) */}
          <div className="space-y-2">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                Divulguer le contenu commercial
                <span className="block text-xs text-muted-foreground">
                  Indiquez si ce post fait la promotion de votre marque,
                  d&apos;un tiers, ou des deux.
                </span>
              </span>
              <Switch
                checked={!!value.commercial}
                onCheckedChange={(commercial) => onChange({ commercial })}
              />
            </label>
            {value.commercial && (
              <div className="space-y-2 rounded-lg bg-muted/40 p-2.5">
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={!!value.brandOrganic}
                    onCheckedChange={(checked) =>
                      onChange({ brandOrganic: checked === true })
                    }
                    className="mt-0.5"
                  />
                  <span>
                    Votre marque
                    <span className="block text-xs text-muted-foreground">
                      Vous faites la promotion de vous-même ou de votre
                      entreprise.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={!!value.brandContent}
                    onCheckedChange={(checked) =>
                      onChange({ brandContent: checked === true })
                    }
                    className="mt-0.5"
                  />
                  <span>
                    Contenu de marque
                    <span className="block text-xs text-muted-foreground">
                      Vous faites la promotion d&apos;une autre marque ou
                      d&apos;un tiers.
                    </span>
                  </span>
                </label>
                {value.brandContent ? (
                  <p className="text-xs text-muted-foreground">
                    {`Votre ${isVideo ? "vidéo" : "photo"} sera étiquetée « Partenariat rémunéré ».`}
                  </p>
                ) : value.brandOrganic ? (
                  <p className="text-xs text-muted-foreground">
                    {`Votre ${isVideo ? "vidéo" : "photo"} sera étiquetée « Contenu promotionnel ».`}
                  </p>
                ) : (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Cochez au moins une option, ou désactivez la divulgation.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Déclaration exigée par TikTok au-dessus du bouton de publication : publier
 * vaut accord (confirmation d'utilisation de la musique, et politique du
 * contenu de marque si le post en est un). Pas en brouillon : TikTok la
 * demande dans l'appli.
 */
export function TikTokDeclaration({ branded }) {
  const link = (href, label) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#5A50FF] underline-offset-2 hover:underline"
    >
      {label}
    </a>
  );
  return (
    <p className="text-xs text-muted-foreground">
      En publiant, vous acceptez{" "}
      {branded && (
        <>
          la{" "}
          {link(
            TIKTOK_BRANDED_CONTENT_POLICY_URL,
            "politique relative au contenu de marque",
          )}{" "}
          et{" "}
        </>
      )}
      la{" "}
      {link(
        TIKTOK_MUSIC_CONFIRMATION_URL,
        "confirmation d'utilisation de la musique",
      )}{" "}
      de TikTok.
    </p>
  );
}
