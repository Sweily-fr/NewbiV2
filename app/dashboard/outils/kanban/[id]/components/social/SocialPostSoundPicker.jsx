"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Info,
  Loader2,
  Music,
  Pause,
  Play,
  Search,
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
import { Slider } from "@/src/components/ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { cn } from "@/src/lib/utils";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import {
  getApiErrorMessage,
  useSocialTrendingSounds,
} from "@/src/hooks/useSocialPublishing";
import {
  DEFAULT_SOUND_VOLUME,
  DEFAULT_VIDEO_SOUND_VOLUME,
  SOUND_PARTIAL_MESSAGES,
  formatVideoDuration,
  getPlatformLabel,
} from "@/src/utils/social-post-rules";
import { SocialNetworkIcon } from "./SocialNetworkIcon";
import { SocialSegmentedControl } from "./SocialSegmentedControl";

// Délai de la recherche (Instagram) : une requête par pause de frappe
const SEARCH_DELAY_MS = 300;
const INSTAGRAM_PREVIEW_NOTE =
  "Instagram n'affiche pas d'aperçu du Reel avec le son : il est ajouté à la publication.";

/** Pochette d'un son ; sans image (ou image cassée) : une note de musique */
function SoundCover({ url, size = 40 }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (!url || broken) {
    return (
      <span
        className="flex flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
        style={style}
        aria-hidden="true"
      >
        <Music className="h-4 w-4" />
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="flex-shrink-0 rounded-md bg-muted object-cover"
      style={style}
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
}

/**
 * Écoute des extraits : un seul à la fois, arrêté au démontage (fermeture
 * de la liste). Un extrait illisible (adresse expirée, format refusé) fait
 * disparaître son bouton, sans message d'erreur.
 */
function useSoundPreview() {
  const audioRef = useRef(null);
  const currentRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const [failedIds, setFailedIds] = useState(() => new Set());

  const markFailed = useCallback((id) => {
    if (!id) return;
    setFailedIds((prev) => new Set(prev).add(id));
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    currentRef.current = null;
    setPlayingId(null);
    if (!audio) return;
    try {
      audio.pause();
      audio.removeAttribute("src");
      audio.load?.();
    } catch {
      // Lecteur indisponible : rien à arrêter
    }
  }, []);

  const toggle = useCallback(
    (sound) => {
      const audio = audioRef.current;
      if (!audio || !sound?.previewUrl) return;
      if (currentRef.current === sound.id) {
        stop();
        return;
      }
      currentRef.current = sound.id;
      setPlayingId(sound.id);
      const fail = () => {
        markFailed(sound.id);
        if (currentRef.current === sound.id) {
          currentRef.current = null;
          setPlayingId(null);
        }
      };
      try {
        audio.src = sound.previewUrl;
        const result = audio.play();
        // Lecture interrompue par un autre extrait : pas une erreur
        result?.catch?.((error) => {
          if (error?.name !== "AbortError") fail();
        });
      } catch {
        fail();
      }
    },
    [markFailed, stop],
  );

  useEffect(() => stop, [stop]);

  const audioProps = {
    ref: audioRef,
    preload: "none",
    className: "hidden",
    onEnded: () => {
      currentRef.current = null;
      setPlayingId(null);
    },
    onError: () => {
      const id = currentRef.current;
      if (!id) return;
      markFailed(id);
      currentRef.current = null;
      setPlayingId(null);
    },
  };

  return { playingId, failedIds, toggle, stop, audioProps };
}

/**
 * Contenu de la liste (monté à l'ouverture seulement) : tendances au
 * chargement, recherche et type de son pour Instagram.
 */
function SoundPickerBody({
  platform,
  accountId,
  workspaceId,
  selectedId,
  onSelect,
}) {
  const instagram = platform === "instagram";
  const [searchInput, setSearchInput] = useState("");
  const [kind, setKind] = useState("music");
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DELAY_MS);
  const { sounds, loaded, loading, error, refetch } = useSocialTrendingSounds({
    accountId,
    workspaceId,
    search: instagram ? search : undefined,
    kind: instagram ? kind : undefined,
  });
  const preview = useSoundPreview();

  const choose = (sound) => {
    preview.stop();
    onSelect(sound);
  };

  let body;
  if (loading && !loaded) {
    body = (
      <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des sons…
      </p>
    );
  } else if (error && !loaded) {
    body = (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            {getApiErrorMessage(
              error,
              `Impossible de charger les sons ${getPlatformLabel(platform)}.`,
            )}
          </span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          Réessayer
        </Button>
      </div>
    );
  } else if (sounds.length === 0) {
    body = (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {search
          ? `Aucun son trouvé pour « ${search} ».`
          : "Aucun son tendance pour le moment."}
      </p>
    );
  } else {
    body = (
      <ul className="space-y-0.5" aria-label="Sons proposés">
        {sounds.map((sound) => {
          const playing = preview.playingId === sound.id;
          const canPlay =
            !!sound.previewUrl && !preview.failedIds.has(sound.id);
          const selected = sound.id === selectedId;
          const duration =
            sound.durationMs > 0
              ? formatVideoDuration(sound.durationMs, { round: "down" })
              : "";
          return (
            <li
              key={sound.id}
              className={cn(
                "flex items-center gap-1.5 rounded-lg pr-1.5",
                selected ? "bg-[#5A50FF]/[0.07]" : "hover:bg-muted/60",
              )}
            >
              <button
                type="button"
                onClick={() => choose(sound)}
                aria-label={`Choisir « ${sound.title} »${sound.artist ? ` de ${sound.artist}` : ""}`}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left"
              >
                {sound.rank > 0 && (
                  <span className="w-5 flex-shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {sound.rank}
                  </span>
                )}
                <SoundCover url={sound.coverUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {sound.title}
                  </span>
                  {sound.artist && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {sound.artist}
                    </span>
                  )}
                </span>
                {duration && (
                  <span className="flex-shrink-0 text-xs tabular-nums text-muted-foreground">
                    {duration}
                  </span>
                )}
                {selected && (
                  <Check className="h-4 w-4 flex-shrink-0 text-[#5A50FF]" />
                )}
              </button>
              {canPlay && (
                <button
                  type="button"
                  onClick={() => preview.toggle(sound)}
                  aria-label={
                    playing
                      ? "Arrêter l'extrait"
                      : `Écouter un extrait de « ${sound.title} »`
                  }
                  aria-pressed={playing}
                  className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border text-foreground hover:bg-muted"
                >
                  {playing ? (
                    <Pause className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Play className="ml-px h-3.5 w-3.5 fill-current" />
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="space-y-3">
      {instagram && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher un titre ou un artiste"
              aria-label="Rechercher un son"
              className="pl-8"
            />
          </div>
          <SocialSegmentedControl
            label="Type de son"
            value={kind}
            onChange={setKind}
            options={[
              { value: "music", label: "Musique" },
              { value: "original_sound", label: "Sons originaux" },
            ]}
          />
        </div>
      )}
      <p className="text-xs font-medium text-muted-foreground">
        {search && instagram ? "Résultats" : "Tendances"}
      </p>
      <div className="max-h-[50vh] min-h-[160px] overflow-y-auto">{body}</div>
      <audio {...preview.audioProps} />
    </div>
  );
}

/** Liste des sons d'un réseau, dans une fenêtre au-dessus de la fenêtre du post */
function SoundPickerDialog({
  open,
  onOpenChange,
  platform,
  accountId,
  workspaceId,
  selectedId,
  onSelect,
}) {
  const label = getPlatformLabel(platform);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base">
            Choisir un son {label}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {platform === "instagram"
              ? "Sons tendance du moment, ou recherchez un titre."
              : "Sons tendance de la bibliothèque musicale de TikTok."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <SoundPickerBody
            platform={platform}
            accountId={accountId}
            workspaceId={workspaceId}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function VolumeSlider({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{value} %</span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={100}
        step={1}
        onValueChange={([next]) => onChange(next)}
        thumbLabel={label}
        disabled={disabled}
      />
    </div>
  );
}

/** Son choisi pour un réseau, ou bouton pour en choisir un */
function SoundPanel({
  target,
  sound,
  onChange,
  hasVideo,
  workspaceId,
  disabled,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { platform, account, partial } = target;

  const handleSelect = (picked) => {
    onChange(platform, {
      id: picked.id,
      title: picked.title,
      artist: picked.artist || null,
      coverUrl: picked.coverUrl || null,
      // Volumes gardés quand on change de son
      volume: sound?.volume ?? DEFAULT_SOUND_VOLUME,
      videoVolume: sound?.videoVolume ?? DEFAULT_VIDEO_SOUND_VOLUME,
    });
    setPickerOpen(false);
  };
  const patch = (changes) => onChange(platform, { ...sound, ...changes });

  return (
    <div className="space-y-3">
      {sound ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-2">
          <SoundCover url={sound.coverUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{sound.title}</p>
            {sound.artist && (
              <p className="truncate text-xs text-muted-foreground">
                {sound.artist}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPickerOpen(true)}
              disabled={disabled}
            >
              Changer
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(platform, null)}
              disabled={disabled}
            >
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPickerOpen(true)}
          disabled={disabled}
        >
          <Music className="h-4 w-4" />
          Choisir un son
        </Button>
      )}

      {sound && (
        <div className="grid gap-3 sm:grid-cols-2">
          <VolumeSlider
            label="Volume de la musique"
            value={sound.volume}
            onChange={(volume) => patch({ volume })}
            disabled={disabled}
          />
          {hasVideo && (
            <VolumeSlider
              label="Son de la vidéo"
              value={sound.videoVolume}
              onChange={(videoVolume) => patch({ videoVolume })}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {(partial || (sound && platform === "instagram")) && (
        <ul className="space-y-1">
          {partial && (
            <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
              <span>{SOUND_PARTIAL_MESSAGES[platform]}</span>
            </li>
          )}
          {sound && platform === "instagram" && (
            <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
              <span>{INSTAGRAM_PREVIEW_NOTE}</span>
            </li>
          )}
        </ul>
      )}

      <SoundPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        platform={platform}
        accountId={account.id}
        workspaceId={workspaceId}
        selectedId={sound?.id}
        onSelect={handleSelect}
      />
    </div>
  );
}

/**
 * Section « Son » de la fenêtre du post : un onglet par réseau où un son
 * tendance est possible (Instagram via Facebook pour un Reel, TikTok
 * Business). Le son s'applique à tous les comptes compatibles du réseau.
 *
 * @param {{ targets: Array<{ platform: string, account: object, partial: boolean }>, sounds: object, onChange: (platform: string, sound: object|null) => void, hasVideo: boolean, workspaceId: string, disabled?: boolean }} props
 */
export function SocialPostSoundSection({
  targets,
  sounds,
  onChange,
  hasVideo,
  workspaceId,
  disabled = false,
}) {
  const [tab, setTab] = useState(targets[0]?.platform);
  if (targets.length === 0) return null;
  const panel = (target) => (
    <SoundPanel
      target={target}
      sound={sounds[target.platform] || null}
      onChange={onChange}
      hasVideo={hasVideo}
      workspaceId={workspaceId}
      disabled={disabled}
    />
  );

  if (targets.length === 1) {
    const [target] = targets;
    return (
      <div className="space-y-3 rounded-xl border p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SocialNetworkIcon platform={target.platform} title="" />
          Son tendance {getPlatformLabel(target.platform)}
        </div>
        {panel(target)}
      </div>
    );
  }

  // Onglet choisi qui n'a plus lieu d'être (réseau retiré) : le premier
  const value = targets.some((t) => t.platform === tab)
    ? tab
    : targets[0].platform;
  return (
    <Tabs
      value={value}
      onValueChange={setTab}
      className="gap-3 rounded-xl border p-3"
    >
      <TabsList aria-label="Son par réseau">
        {targets.map(({ platform }) => (
          <TabsTrigger key={platform} value={platform} className="px-3">
            <SocialNetworkIcon platform={platform} size={14} title="" />
            {getPlatformLabel(platform)}
            {sounds[platform] && (
              <>
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#5A50FF]"
                  aria-hidden="true"
                />
                <span className="sr-only">(son choisi)</span>
              </>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {targets.map((target) => (
        <TabsContent key={target.platform} value={target.platform}>
          {panel(target)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
