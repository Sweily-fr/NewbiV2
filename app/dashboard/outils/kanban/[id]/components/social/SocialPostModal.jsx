"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  X,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import {
  getApiErrorMessage,
  useConnectSocialAccount,
  useTikTokCreatorInfo,
} from "@/src/hooks/useSocialPublishing";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  SOCIAL_PLATFORMS,
  SOCIAL_TIMEZONE,
  TIKTOK_BRANDED_CONTENT_POLICY_URL,
  TIKTOK_MUSIC_CONFIRMATION_URL,
  buildComposerReturnTo,
  formatParisDateTime,
  formatParisShortDateTime,
  getDefaultScheduleParts,
  getMaxImages,
  getParisToday,
  getPlatformLabel,
  getTextLimit,
  isInstagramRatioValid,
  isoToParisParts,
  joinLabels,
  parisPartsToIso,
  uniquePlatforms,
  validateSocialPost,
} from "@/src/utils/social-post-rules";
import {
  SocialAccountAvatar,
  SocialNetworkIcon,
  getSocialAccountName,
} from "./SocialNetworkIcon";
import { useSocialPublishing } from "./SocialPostsProvider";

const DRAFT_KEY_PREFIX = "newbi:social-post-draft:";
// Erreurs affichées dès la saisie (ce que l'utilisateur vient de faire) ;
// les choix manquants attendent un premier essai d'envoi, pour ne pas
// accueillir l'utilisateur en rouge
const LIVE_ERROR_CODES = new Set([
  "text_too_long",
  "too_many_images",
  "image_required",
  "instagram_ratio",
  "linkedin_size",
  "when_too_soon",
  "when_too_far",
  "tiktok_quota",
]);
const isShown = (error, attempted) =>
  attempted || LIVE_ERROR_CODES.has(error.code);

let localKeySeq = 0;
const newLocalKey = () => `media-${Date.now()}-${(localKeySeq += 1)}`;

function readDraft(boardId) {
  try {
    const raw = window.sessionStorage.getItem(`${DRAFT_KEY_PREFIX}${boardId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDraft(boardId, draft) {
  try {
    window.sessionStorage.setItem(
      `${DRAFT_KEY_PREFIX}${boardId}`,
      JSON.stringify(draft),
    );
  } catch {
    // Stockage indisponible (navigation privée) : le brouillon est perdu
  }
}

function clearDraft(boardId) {
  try {
    window.sessionStorage.removeItem(`${DRAFT_KEY_PREFIX}${boardId}`);
  } catch {
    // Rien à faire
  }
}

function firstColumnId(columns) {
  const sorted = [...(columns || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  return sorted[0]?.id || "";
}

function sortAccounts(accounts) {
  return [...(accounts || [])].sort(
    (a, b) =>
      SOCIAL_PLATFORMS.indexOf(a.platform) -
        SOCIAL_PLATFORMS.indexOf(b.platform) ||
      getSocialAccountName(a).localeCompare(getSocialAccountName(b)),
  );
}

// Consignes TikTok : confidentialité sans valeur par défaut, interactions
// et divulgation du contenu commercial désactivées au départ
const EMPTY_TIKTOK = {
  privacyLevel: "",
  allowComment: false,
  commercial: false,
  brandOrganic: false,
  brandContent: false,
};

function FieldError({ messages }) {
  if (!messages?.length) return null;
  return (
    <div className="space-y-1">
      {messages.map((message) => (
        <p
          key={message}
          className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 flex-shrink-0" />
          <span>{message}</span>
        </p>
      ))}
    </div>
  );
}

function SectionTitle({ children, htmlFor }) {
  return (
    <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
    </Label>
  );
}

// ── Comptes ──────────────────────────────────────────────────────────────

function ConnectNetworkButtons({ platforms, onConnect, connectingPlatform }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {platforms.map((platform) => (
        <Button
          key={platform}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onConnect(platform)}
          disabled={!!connectingPlatform}
        >
          {connectingPlatform === platform ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SocialNetworkIcon platform={platform} title="" />
          )}
          {getPlatformLabel(platform)}
        </Button>
      ))}
    </div>
  );
}

function AccountsPicker({
  accounts,
  availablePlatforms,
  selectedIds,
  onToggle,
  canManageAccounts,
  onConnect,
  connectingPlatform,
  allowAdd,
}) {
  // Réseaux connectables, dans l'ordre habituel
  const connectable = SOCIAL_PLATFORMS.filter((platform) =>
    availablePlatforms.includes(platform),
  );
  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#5A50FF]/10 text-[#5A50FF]">
          <Send className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">
          Connectez votre premier réseau social
        </p>
        {canManageAccounts && connectable.length === 0 ? (
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Aucun réseau n&apos;est disponible pour le moment.
          </p>
        ) : canManageAccounts ? (
          <>
            <p className="mx-auto mt-1 mb-4 max-w-sm text-xs text-muted-foreground">
              Votre post partira tout seul à l&apos;heure choisie. La connexion
              se fait en quelques clics, sans créer de compte.
            </p>
            <ConnectNetworkButtons
              platforms={connectable}
              onConnect={onConnect}
              connectingPlatform={connectingPlatform}
            />
          </>
        ) : (
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Demandez à un administrateur de connecter un réseau dans Paramètres
            &gt; Intégrations.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {accounts.map((account) => {
        const needsReconnect = account.status !== "active";
        const selected = selectedIds.includes(account.id);
        const name = getSocialAccountName(account);
        if (needsReconnect) {
          return (
            <div
              key={account.id}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-dashed py-1 pl-1 pr-1.5 text-sm text-muted-foreground"
              title="La connexion à ce compte a expiré"
            >
              <SocialAccountAvatar
                account={account}
                size={24}
                className="opacity-50"
              />
              <span className="max-w-[140px] truncate">{name}</span>
              {canManageAccounts && connectable.includes(account.platform) ? (
                <button
                  type="button"
                  onClick={() => onConnect(account.platform)}
                  disabled={!!connectingPlatform}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {connectingPlatform === account.platform ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Reconnecter
                </button>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  À reconnecter
                </span>
              )}
            </div>
          );
        }
        return (
          <button
            key={account.id}
            type="button"
            onClick={() => onToggle(account.id)}
            aria-pressed={selected}
            className={cn(
              "inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors",
              selected
                ? "border-[#5A50FF] bg-[#5A50FF]/[0.07] text-foreground"
                : "border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <SocialAccountAvatar account={account} size={24} />
            <span className="max-w-[160px] truncate">{name}</span>
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border",
                selected
                  ? "border-[#5A50FF] bg-[#5A50FF] text-white"
                  : "border-muted-foreground/30",
              )}
            >
              {selected && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
          </button>
        );
      })}

      {canManageAccounts && allowAdd && connectable.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed px-3 py-1 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un compte
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {connectable.map((platform) => (
              <DropdownMenuItem
                key={platform}
                onSelect={() => onConnect(platform)}
                disabled={!!connectingPlatform}
                className="cursor-pointer gap-2"
              >
                <SocialNetworkIcon platform={platform} title="" />
                {getPlatformLabel(platform)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ── Images ───────────────────────────────────────────────────────────────

function MediaTile({
  item,
  index,
  count,
  invalidRatio,
  onRemove,
  onMove,
  disabled,
}) {
  const src = item.url || item.previewUrl;
  return (
    <div
      className={cn(
        "group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-muted",
        invalidRatio && "ring-2 ring-red-500",
      )}
    >
      {src ? (
        <img
          src={src}
          alt={`Image ${index + 1}`}
          className="h-full w-full object-cover"
        />
      ) : null}
      {item.uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-medium leading-4 text-white">
        {index + 1}
      </span>
      {!disabled && (
        <button
          type="button"
          onClick={() => onRemove(item.key)}
          className="absolute right-1 top-1 cursor-pointer rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
          aria-label={`Retirer l'image ${index + 1}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
      {!disabled && count > 1 && !item.uploading && (
        <div className="absolute inset-x-1 bottom-1 flex justify-between sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="cursor-pointer rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80 disabled:invisible"
            aria-label="Déplacer avant"
          >
            <ArrowLeft className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === count - 1}
            className="cursor-pointer rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80 disabled:invisible"
            aria-label="Déplacer après"
          >
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Aperçu ───────────────────────────────────────────────────────────────

function PostPreview({ accounts, content, media, whenLabel }) {
  const first = accounts[0] || null;
  const platforms = uniquePlatforms(accounts.map((a) => a.platform));
  const images = media.filter((m) => m.url || m.previewUrl);
  const shown = images.slice(0, 4);
  const extra = images.length - shown.length;

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
      <div className="flex items-center gap-2.5 p-3">
        {first ? (
          <SocialAccountAvatar account={first} size={36} />
        ) : (
          <span className="h-9 w-9 rounded-full bg-muted" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {first
              ? first.displayName || getSocialAccountName(first)
              : "Votre compte"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{whenLabel}</p>
        </div>
      </div>
      {content.trim() ? (
        <p className="whitespace-pre-wrap break-words px-3 pb-3 text-sm leading-relaxed">
          {content}
        </p>
      ) : (
        <p className="px-3 pb-3 text-sm text-muted-foreground/60">
          Le texte de votre post apparaîtra ici.
        </p>
      )}
      {shown.length > 0 && (
        <div
          className={cn(
            "grid gap-0.5 bg-muted",
            shown.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {shown.map((item, i) => (
            <div
              key={item.key}
              className={cn(
                "relative bg-muted",
                shown.length === 1 ? "aspect-[4/3]" : "aspect-square",
                shown.length === 3 && i === 0 && "row-span-2 aspect-auto",
              )}
            >
              <img
                src={item.url || item.previewUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              {extra > 0 && i === shown.length - 1 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                  +{extra}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {platforms.length > 0 && (
        <div className="flex items-center gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground">
          {platforms.map((p) => (
            <SocialNetworkIcon key={p} platform={p} size={14} />
          ))}
          <span className="ml-1 truncate">
            {joinLabels(platforms.map(getPlatformLabel))}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Options TikTok ───────────────────────────────────────────────────────

function TikTokOptions({
  accountId,
  accountName,
  workspaceId,
  value,
  onChange,
  onInfo,
}) {
  const { info, loading, error, refetch } = useTikTokCreatorInfo(
    accountId,
    workspaceId,
  );

  useEffect(() => {
    onInfo(info);
  }, [info, onInfo]);

  // Commentaires désactivés sur le compte : l'option reste coupée
  useEffect(() => {
    if (info?.commentDisabled && value.allowComment) {
      onChange({ allowComment: false });
    }
  }, [info?.commentDisabled, value.allowComment, onChange]);

  // Visibilité choisie qui n'est plus proposée par le compte : à rechoisir
  useEffect(() => {
    if (
      info?.privacyLevels &&
      value.privacyLevel &&
      !info.privacyLevels.some((l) => l.value === value.privacyLevel)
    ) {
      onChange({ privacyLevel: "" });
    }
  }, [info?.privacyLevels, value.privacyLevel, onChange]);

  // Contenu de marque : jamais visible par soi seul (règle TikTok)
  const brandedPrivate =
    value.commercial &&
    value.brandContent &&
    value.privacyLevel === "SELF_ONLY";
  const creatorName = info?.nickname || info?.username || accountName;

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <SocialNetworkIcon platform="tiktok" title="" />
        <span className="text-sm font-medium">Options TikTok</span>
      </div>
      {creatorName && (
        <p className="text-xs text-muted-foreground">
          Publication sur le compte TikTok{" "}
          <span className="font-medium text-foreground">{creatorName}</span>
          {info?.username && info.username !== creatorName && (
            <> (@{info.username})</>
          )}
        </p>
      )}

      {loading && !info ? (
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
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {(info?.privacyLevels || []).map((level) => (
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
                    Votre photo sera étiquetée « Partenariat rémunéré ».
                  </p>
                ) : value.brandOrganic ? (
                  <p className="text-xs text-muted-foreground">
                    Votre photo sera étiquetée « Contenu promotionnel ».
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
 * contenu de marque si le post en est un).
 */
function TikTokDeclaration({ branded }) {
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

// ── Fenêtre ──────────────────────────────────────────────────────────────

/**
 * Programmer un post (création) ou le modifier (`post` fourni, statut
 * « scheduled »). Les images partent dès qu'elles sont choisies ; la carte
 * du tableau est créée par l'API avec le post.
 */
export function SocialPostModal({ open, onClose, post, restoreDraft }) {
  const social = useSocialPublishing();
  const { status, boardId, workspaceId, columns, mutations } = social || {};
  const isEdit = !!post;

  const accounts = useMemo(
    () => sortAccounts(status?.accounts),
    [status?.accounts],
  );
  const { connect, connectingPlatform } = useConnectSocialAccount(workspaceId);

  const [selectedIds, setSelectedIds] = useState([]);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState([]);
  const [whenMode, setWhenMode] = useState("schedule");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [columnId, setColumnId] = useState("");
  const [tiktok, setTiktok] = useState(EMPTY_TIKTOK);
  const [tiktokInfo, setTiktokInfo] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef(new Set());

  // Initialisation à chaque ouverture
  useEffect(() => {
    if (!open) return;
    setAttempted(false);
    setSubmitting(false);
    setTiktokInfo(null);
    if (post) {
      const parts = isoToParisParts(post.scheduledFor);
      setSelectedIds(
        (post.targets || []).map((t) => t.accountId).filter(Boolean),
      );
      setContent(post.content || "");
      setMedia(
        (post.media || []).map((m) => ({
          key: m.id,
          id: m.id,
          url: m.url,
          width: m.width,
          height: m.height,
        })),
      );
      setWhenMode("schedule");
      setDate(parts.date);
      setTime(parts.time);
      setColumnId("");
      setTiktok(
        post.tiktokSettings
          ? {
              privacyLevel: post.tiktokSettings.privacyLevel || "",
              allowComment: !!post.tiktokSettings.allowComment,
              commercial:
                !!post.tiktokSettings.brandOrganic ||
                !!post.tiktokSettings.brandContent,
              brandOrganic: !!post.tiktokSettings.brandOrganic,
              brandContent: !!post.tiktokSettings.brandContent,
            }
          : EMPTY_TIKTOK,
      );
      return;
    }
    const defaults = getDefaultScheduleParts();
    const draft = restoreDraft ? readDraft(boardId) : null;
    const activeIds = new Set(
      accounts.filter((a) => a.status === "active").map((a) => a.id),
    );
    if (draft) {
      setSelectedIds(
        (draft.accountIds || []).filter((id) => activeIds.has(id)),
      );
      setContent(draft.content || "");
      setMedia(
        (draft.media || [])
          .filter((m) => m?.id && m?.url)
          .map((m) => ({ ...m, key: m.id })),
      );
      setWhenMode(draft.whenMode === "now" ? "now" : "schedule");
      setDate(draft.date || defaults.date);
      setTime(draft.time || defaults.time);
      setColumnId(draft.columnId || firstColumnId(columns));
      setTiktok({ ...EMPTY_TIKTOK, ...(draft.tiktok || {}) });
    } else {
      // Un seul compte connecté : choisi d'office
      setSelectedIds(activeIds.size === 1 ? [...activeIds] : []);
      setContent("");
      setMedia([]);
      setWhenMode("schedule");
      setDate(defaults.date);
      setTime(defaults.time);
      setColumnId(firstColumnId(columns));
      setTiktok(EMPTY_TIKTOK);
    }
    // Comptes et colonnes lus à l'ouverture seulement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id, restoreDraft, boardId]);

  // Aperçus locaux libérés à la fermeture
  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const selectedAccounts = useMemo(
    () => accounts.filter((a) => selectedIds.includes(a.id)),
    [accounts, selectedIds],
  );
  const platforms = useMemo(
    () => uniquePlatforms(selectedAccounts.map((a) => a.platform)),
    [selectedAccounts],
  );
  const tiktokAccount = selectedAccounts.find((a) => a.platform === "tiktok");
  const hasTikTok = !!tiktokAccount;

  const scheduledFor =
    whenMode === "schedule" ? parisPartsToIso(date, time) : null;
  const uploadedMedia = media.filter((m) => m.id && !m.uploading);
  const uploading = media.some((m) => m.uploading);

  const errors = useMemo(
    () =>
      validateSocialPost({
        platforms,
        accountCount: selectedAccounts.length,
        content,
        media: uploadedMedia,
        publishNow: whenMode === "now",
        scheduledFor,
        tiktok: {
          ...tiktok,
          canPostMore: tiktokInfo ? tiktokInfo.canPostMore : undefined,
        },
      }),
    // uploadedMedia dérive de media
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      platforms,
      selectedAccounts.length,
      content,
      media,
      whenMode,
      scheduledFor,
      tiktok,
      tiktokInfo,
    ],
  );
  const errorsFor = (field) =>
    errors
      .filter((e) => e.field === field && isShown(e, attempted))
      .map((e) => e.message);
  // Le dépassement de texte s'affiche déjà en rouge dans le compteur
  const textLimit = getTextLimit(content, platforms);
  const contentErrors = errors
    .filter(
      (e) =>
        e.field === "content" &&
        e.code !== "text_too_long" &&
        isShown(e, attempted),
    )
    .map((e) => e.message);

  const maxImages = getMaxImages(platforms);
  const instagramChosen = platforms.includes("instagram");

  const toggleAccount = useCallback((accountId) => {
    setSelectedIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId],
    );
  }, []);

  const patchTiktok = useCallback(
    (patch) => setTiktok((prev) => ({ ...prev, ...patch })),
    [],
  );

  // Brouillon gardé pendant l'aller-retour de connexion d'un réseau
  const saveDraft = useCallback(() => {
    if (isEdit) return;
    writeDraft(boardId, {
      accountIds: selectedIds,
      content,
      media: uploadedMedia.map(({ id, url, width, height }) => ({
        id,
        url,
        width,
        height,
      })),
      whenMode,
      date,
      time,
      columnId,
      tiktok,
    });
  }, [
    isEdit,
    boardId,
    selectedIds,
    content,
    uploadedMedia,
    whenMode,
    date,
    time,
    columnId,
    tiktok,
  ]);

  const handleConnect = useCallback(
    (platform) => {
      const pathname = window.location.pathname;
      const returnTo = isEdit
        ? `${pathname}?task=${encodeURIComponent(post.taskId)}`
        : buildComposerReturnTo(pathname);
      connect(platform, returnTo, { beforeRedirect: saveDraft });
    },
    [connect, isEdit, post?.taskId, saveDraft],
  );

  // ── Téléversement ──
  const addFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []);
      if (files.length === 0) return;
      const remaining = maxImages.max - media.length;
      if (remaining <= 0) {
        toast.info(
          maxImages.label
            ? `${maxImages.label} accepte ${maxImages.max} images au maximum.`
            : `${maxImages.max} images au maximum.`,
        );
        return;
      }
      const accepted = [];
      for (const file of files) {
        const type = (file.type || "").toLowerCase();
        const isHeic = /\.(heic|heif)$/i.test(file.name || "");
        if (!ACCEPTED_IMAGE_TYPES.includes(type) && !isHeic) {
          toast.error(
            `« ${file.name} » n'est pas une image JPEG, PNG ou WebP.`,
          );
          continue;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          toast.error(`« ${file.name} » dépasse 20 Mo.`);
          continue;
        }
        accepted.push(file);
      }
      if (accepted.length > remaining) {
        toast.info(
          `Seules les ${remaining} premières images ont été ajoutées (${maxImages.max} au maximum).`,
        );
      }
      const batch = accepted.slice(0, remaining).map((file) => {
        let previewUrl = null;
        try {
          previewUrl = URL.createObjectURL(file);
          previewUrlsRef.current.add(previewUrl);
        } catch {
          previewUrl = null;
        }
        return { key: newLocalKey(), file, previewUrl, uploading: true };
      });
      if (batch.length === 0) return;
      setMedia((prev) => [...prev, ...batch]);

      await Promise.all(
        batch.map(async (item) => {
          try {
            const uploaded = await mutations.upload(item.file);
            if (!uploaded?.id) throw new Error("Réponse vide");
            setMedia((prev) =>
              prev.map((m) =>
                m.key === item.key
                  ? {
                      key: item.key,
                      id: uploaded.id,
                      url: uploaded.url,
                      width: uploaded.width,
                      height: uploaded.height,
                      previewUrl: item.previewUrl,
                      uploading: false,
                    }
                  : m,
              ),
            );
          } catch (error) {
            setMedia((prev) => prev.filter((m) => m.key !== item.key));
            toast.error(
              getApiErrorMessage(
                error,
                `Impossible d'envoyer « ${item.file.name} ». Réessayez.`,
              ),
            );
          }
        }),
      );
    },
    [maxImages.label, maxImages.max, media.length, mutations],
  );

  const removeMedia = useCallback((key) => {
    setMedia((prev) => prev.filter((m) => m.key !== key));
  }, []);

  const moveMedia = useCallback((index, delta) => {
    setMedia((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  // ── Envoi ──
  const handleSubmit = async () => {
    setAttempted(true);
    if (errors.length > 0 || uploading || submitting) return;
    setSubmitting(true);
    const mediaIds = uploadedMedia.map((m) => m.id);
    const tiktokSettings = hasTikTok
      ? {
          privacyLevel: tiktok.privacyLevel,
          allowComment: !!tiktok.allowComment && !tiktokInfo?.commentDisabled,
          brandOrganic: !!tiktok.commercial && !!tiktok.brandOrganic,
          brandContent: !!tiktok.commercial && !!tiktok.brandContent,
          // Accord donné en publiant (déclaration au-dessus du bouton)
          consentGiven: true,
        }
      : undefined;
    // Consigne TikTok : prévenir que la publication n'est pas immédiate
    const tiktokDelay = hasTikTok
      ? " La publication sur TikTok peut prendre quelques minutes."
      : "";
    try {
      if (isEdit) {
        await mutations.update(post.id, {
          accountIds: selectedIds,
          content,
          mediaIds,
          scheduledFor,
          ...(tiktokSettings ? { tiktokSettings } : {}),
        });
        toast.success("Post modifié", {
          description: `Publication le ${formatParisDateTime(scheduledFor)}.${tiktokDelay}`,
        });
      } else {
        const payload = await mutations.schedule({
          columnId: columnId || undefined,
          accountIds: selectedIds,
          content,
          mediaIds,
          ...(whenMode === "now" ? { publishNow: true } : { scheduledFor }),
          timezone: SOCIAL_TIMEZONE,
          ...(tiktokSettings ? { tiktokSettings } : {}),
        });
        clearDraft(boardId);
        const result = payload?.post;
        if (whenMode !== "now") {
          toast.success("Post programmé", {
            description: `Publication le ${formatParisDateTime(result?.scheduledFor || scheduledFor)}.${tiktokDelay}`,
          });
        } else if (result?.status === "published") {
          toast.success("Post publié");
        } else if (
          result?.status === "partial" ||
          result?.status === "failed"
        ) {
          const failed = (result.targets || []).filter(
            (t) => t.status === "failed",
          );
          const message =
            result.status === "partial"
              ? "Post publié en partie"
              : "La publication a échoué";
          toast.error(message, {
            description:
              failed
                .map((t) => t.errorMessage)
                .filter(Boolean)
                .join(" ") || "Ouvrez la carte pour réessayer.",
          });
        } else {
          toast.success("Publication en cours", {
            description: `Le statut s'affiche sur la carte du post.${tiktokDelay}`,
          });
        }
      }
      onClose();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEdit
            ? "Impossible de modifier le post. Réessayez."
            : "Impossible de programmer le post. Réessayez.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const whenLabel =
    whenMode === "now"
      ? "Publication immédiate"
      : scheduledFor
        ? `Programmé ${formatParisShortDateTime(scheduledFor)}`
        : "Date à choisir";

  const today = getParisToday();
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return isoToParisParts(d).date;
  }, []);

  // Rappel discret en bas : ce qu'il reste à faire avant l'envoi
  const firstError = errors[0];
  const primaryLabel = isEdit
    ? "Enregistrer les modifications"
    : whenMode === "now"
      ? "Publier maintenant"
      : "Programmer le post";

  const sortedColumns = useMemo(
    () => [...(columns || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [columns],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !submitting && onClose()}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-[920px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-5 py-4 pr-12 text-left">
          <DialogTitle className="text-base">
            {isEdit ? "Modifier le post" : "Programmer un post"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit
              ? "Les changements s'appliquent au post programmé et à sa carte."
              : "Écrivez votre post, choisissez quand il part : il sera publié automatiquement."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6 p-5">
              {/* 1. Comptes */}
              <section className="space-y-2.5">
                <SectionTitle>Publier sur</SectionTitle>
                <AccountsPicker
                  accounts={accounts}
                  availablePlatforms={status?.platforms || SOCIAL_PLATFORMS}
                  selectedIds={selectedIds}
                  onToggle={toggleAccount}
                  canManageAccounts={status?.canManageAccounts}
                  onConnect={handleConnect}
                  connectingPlatform={connectingPlatform}
                  allowAdd={!isEdit}
                />
                <FieldError messages={errorsFor("accounts")} />
              </section>

              {/* 2. Texte */}
              <section className="space-y-2">
                <div className="flex items-end justify-between gap-3">
                  <SectionTitle htmlFor="social-post-content">
                    Texte
                  </SectionTitle>
                  {textLimit && (
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        textLimit.over
                          ? "font-medium text-red-600 dark:text-red-400"
                          : textLimit.remaining < 20
                            ? "text-amber-600"
                            : "text-muted-foreground",
                      )}
                    >
                      {textLimit.count} / {textLimit.max} ({textLimit.label})
                    </span>
                  )}
                </div>
                <Textarea
                  id="social-post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Qu'avez-vous envie de partager ?"
                  className={cn(
                    "min-h-[140px] resize-y text-sm",
                    textLimit?.over &&
                      "border-red-500 focus-visible:ring-red-500/40",
                  )}
                />
                <FieldError messages={contentErrors} />
              </section>

              {/* 3. Images */}
              <section className="space-y-2">
                <div className="flex items-end justify-between gap-3">
                  <SectionTitle>Images</SectionTitle>
                  <span className="text-xs text-muted-foreground">
                    {media.length} / {maxImages.max}
                  </span>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    addFiles(e.dataTransfer?.files);
                  }}
                  className={cn(
                    "rounded-xl border border-dashed p-3 transition-colors",
                    dragOver && "border-[#5A50FF] bg-[#5A50FF]/5",
                  )}
                >
                  <div className="flex flex-wrap gap-2">
                    {media.map((item, index) => (
                      <MediaTile
                        key={item.key}
                        item={item}
                        index={index}
                        count={media.length}
                        invalidRatio={
                          instagramChosen &&
                          !isInstagramRatioValid(item.width, item.height)
                        }
                        onRemove={removeMedia}
                        onMove={moveMedia}
                        disabled={submitting}
                      />
                    ))}
                    {media.length < maxImages.max && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border bg-muted/40 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
                          media.length === 0
                            ? "h-20 w-full flex-row gap-2 text-sm"
                            : "h-20 w-20",
                        )}
                      >
                        <ImagePlus className="h-5 w-5" />
                        {media.length === 0
                          ? "Ajouter des images (ou glissez-les ici)"
                          : "Ajouter"}
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={[...ACCEPTED_IMAGE_TYPES, ".heic", ".heif"].join(
                      ",",
                    )}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
                <FieldError messages={errorsFor("media")} />
              </section>

              {/* 4. Options TikTok */}
              {hasTikTok && (
                <section className="space-y-2">
                  <TikTokOptions
                    accountId={tiktokAccount.id}
                    accountName={getSocialAccountName(tiktokAccount)}
                    workspaceId={workspaceId}
                    value={tiktok}
                    onChange={patchTiktok}
                    onInfo={setTiktokInfo}
                  />
                  <FieldError messages={errorsFor("tiktok")} />
                </section>
              )}

              {/* 5. Quand */}
              <section className="space-y-2.5">
                <SectionTitle>Quand</SectionTitle>
                {!isEdit && (
                  <div
                    role="radiogroup"
                    aria-label="Moment de publication"
                    className="grid grid-cols-2 gap-2"
                  >
                    {[
                      {
                        id: "schedule",
                        label: "Programmer",
                        shortLabel: "Programmer",
                        icon: CalendarClock,
                      },
                      {
                        id: "now",
                        label: "Publier maintenant",
                        shortLabel: "Maintenant",
                        icon: Zap,
                      },
                    ].map((option) => {
                      const Icon = option.icon;
                      const active = whenMode === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setWhenMode(option.id)}
                          className={cn(
                            "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                            active
                              ? "border-[#5A50FF] bg-[#5A50FF]/[0.07] font-medium text-foreground"
                              : "text-muted-foreground hover:bg-muted/60",
                          )}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="sm:hidden">{option.shortLabel}</span>
                          <span className="hidden sm:inline">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {whenMode === "schedule" ? (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="date"
                        aria-label="Date de publication"
                        value={date}
                        min={today}
                        max={maxDate}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-[170px]"
                      />
                      <Input
                        type="time"
                        aria-label="Heure de publication"
                        value={time}
                        step={300}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-[120px]"
                      />
                      <span className="text-xs text-muted-foreground">
                        Heure de Paris
                      </span>
                    </div>
                    <FieldError messages={errorsFor("when")} />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Le post part dès que vous validez.
                  </p>
                )}
              </section>

              {/* 6. Colonne */}
              {!isEdit && sortedColumns.length > 0 && (
                <section className="space-y-2">
                  <SectionTitle>Placer la carte dans</SectionTitle>
                  <Select value={columnId} onValueChange={setColumnId}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Choisir une colonne" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedColumns.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: column.color || "#94a3b8",
                              }}
                            />
                            {column.title}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </section>
              )}
            </div>

            {/* 7. Aperçu */}
            <aside className="border-t bg-muted/30 md:border-l md:border-t-0">
              <div className="space-y-2 p-5 md:sticky md:top-0">
                <p className="text-sm font-medium">Aperçu</p>
                <PostPreview
                  accounts={selectedAccounts}
                  content={content}
                  media={media}
                  whenLabel={whenLabel}
                />
                <p className="text-xs text-muted-foreground">
                  L&apos;affichage final dépend de chaque réseau.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {hasTikTok && (
          <div className="border-t px-5 pt-3">
            <TikTokDeclaration
              branded={!!tiktok.commercial && !!tiktok.brandContent}
            />
          </div>
        )}
        <div
          className={cn(
            "flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between",
            !hasTikTok && "border-t",
          )}
        >
          <p className="min-h-[1rem] text-xs text-muted-foreground sm:max-w-[55%]">
            {uploading
              ? "Envoi des images en cours…"
              : firstError
                ? firstError.message
                : ""}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={
                submitting ||
                uploading ||
                accounts.length === 0 ||
                (attempted && errors.length > 0)
              }
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : whenMode === "now" && !isEdit ? (
                <Zap className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {primaryLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
