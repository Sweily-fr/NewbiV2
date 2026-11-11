"use client";

import { useId, useState } from "react";
import { cn } from "@/src/lib/utils";
import {
  getAccountConnectorMention,
  getPlatformLabel,
} from "@/src/utils/social-post-rules";

// Pictogrammes simplifiés aux couleurs des marques (vue 24 × 24) : une
// tuile arrondie de la couleur du réseau, le signe en blanc.
const TILE = { x: 0, y: 0, width: 24, height: 24, rx: 6 };

function InstagramGlyph({ gradientId }) {
  return (
    <>
      <defs>
        <radialGradient id={gradientId} cx="0.3" cy="1.05" r="1.25">
          <stop offset="0" stopColor="#FFD776" />
          <stop offset="0.25" stopColor="#F3A554" />
          <stop offset="0.5" stopColor="#E1306C" />
          <stop offset="0.8" stopColor="#C13584" />
          <stop offset="1" stopColor="#5B51D8" />
        </radialGradient>
      </defs>
      <rect {...TILE} fill={`url(#${gradientId})`} />
      <rect
        x="5.5"
        y="5.5"
        width="13"
        height="13"
        rx="4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="3.1"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
      />
      <circle cx="16.1" cy="7.9" r="1.05" fill="#fff" />
    </>
  );
}

function FacebookGlyph() {
  return (
    <>
      <rect {...TILE} fill="#1877F2" />
      <path
        d="M13.4 21v-6.6h2.2l.35-2.6H13.4v-1.65c0-.75.22-1.27 1.3-1.27H16V6.55a17 17 0 0 0-1.97-.1c-1.95 0-3.29 1.19-3.29 3.38v1.97H8.55v2.6h2.19V21z"
        fill="#fff"
      />
    </>
  );
}

function LinkedInGlyph() {
  return (
    <>
      <rect {...TILE} fill="#0A66C2" />
      <circle cx="7.6" cy="7.4" r="1.55" fill="#fff" />
      <rect x="6.25" y="10" width="2.7" height="8" rx="0.4" fill="#fff" />
      <path
        d="M10.9 10h2.6v1.15c.4-.72 1.36-1.35 2.72-1.35 2.6 0 3.08 1.66 3.08 3.82V18h-2.7v-3.9c0-.94-.02-2.15-1.32-2.15s-1.67 1.02-1.67 2.08V18h-2.7z"
        fill="#fff"
      />
    </>
  );
}

function XGlyph() {
  return (
    <>
      <rect {...TILE} className="fill-black dark:fill-[#2a2a2a]" />
      <path
        d="M6.2 6h3.7l2.65 3.75L15.75 6h1.85l-4.2 4.88L18 18h-3.7l-2.9-4.1L7.9 18H6.05l4.5-5.22z"
        fill="#fff"
      />
    </>
  );
}

function TikTokGlyph() {
  // Même tracé que public/social/tiktok.svg, réduit dans la tuile
  const note =
    "M305.5,82.5c-28-18.2-44.8-49.2-44.9-82.5h-70.8l-0.1,283.8c-1.3,32.8-28.9,58.4-61.7,57.2S69.6,312,70.8,279.2 c1.2-32,27.5-57.2,59.5-57.2c6,0,11.9,0.9,17.6,2.8v-72.3c-5.8-0.8-11.7-1.2-17.6-1.3C58.5,151.2,0,209.7,0,281.5 c0,72,58.3,130.3,130.3,130.3s130.3-58.3,130.3-130.3V137.6c28.7,20.6,63.2,31.7,98.5,31.7V98.5C340.1,98.5,321.5,93,305.5,82.5z";
  const transform = (dx, dy) =>
    `translate(${6.4 + dx} ${5.2 + dy}) scale(0.0333)`;
  return (
    <>
      <rect {...TILE} className="fill-black dark:fill-[#2a2a2a]" />
      <path d={note} fill="#25F4EE" transform={transform(-0.45, -0.35)} />
      <path d={note} fill="#FE2C55" transform={transform(0.45, 0.35)} />
      <path d={note} fill="#fff" transform={transform(0, 0)} />
    </>
  );
}

/**
 * Logo d'un réseau social (16 px par défaut), couleur de la marque.
 * @param {{ platform: string, size?: number, className?: string, title?: string }} props
 */
export function SocialNetworkIcon({ platform, size = 16, className, title }) {
  const gradientId = `ig-${useId().replace(/:/g, "")}`;
  const label = title ?? getPlatformLabel(platform);
  let glyph = null;
  switch (platform) {
    case "instagram":
      glyph = <InstagramGlyph gradientId={gradientId} />;
      break;
    case "facebook":
      glyph = <FacebookGlyph />;
      break;
    case "linkedin":
      glyph = <LinkedInGlyph />;
      break;
    case "twitter":
      glyph = <XGlyph />;
      break;
    case "tiktok":
      glyph = <TikTokGlyph />;
      break;
    default:
      glyph = <rect {...TILE} className="fill-muted-foreground/40" />;
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cn("flex-shrink-0", className)}
    >
      {label ? <title>{label}</title> : null}
      {glyph}
    </svg>
  );
}

/**
 * Logos superposés de plusieurs réseaux (badges de carte).
 */
export function SocialNetworkIconStack({ platforms, size = 14, className }) {
  const list = Array.from(new Set(platforms || []));
  if (list.length === 0) return null;
  return (
    <span className={cn("flex items-center -space-x-1", className)}>
      {list.map((platform) => (
        <span
          key={platform}
          className="rounded-[5px] ring-2 ring-background"
          style={{ lineHeight: 0 }}
        >
          <SocialNetworkIcon platform={platform} size={size} />
        </span>
      ))}
    </span>
  );
}

/** Nom affiché d'un compte : « @nom », sinon le nom complet */
export function getSocialAccountName(account) {
  if (!account) return "";
  if (account.username) return `@${account.username.replace(/^@/, "")}`;
  return account.displayName || getPlatformLabel(account.platform);
}

/**
 * Photo du compte avec le logo du réseau en pastille. Sans photo : le logo
 * du réseau seul, à la taille de l'avatar.
 */
export function SocialAccountAvatar({ account, size = 24, className }) {
  const [broken, setBroken] = useState(false);
  if (!account?.avatarUrl || broken) {
    return (
      <span
        className={cn("inline-flex flex-shrink-0", className)}
        style={{ width: size, height: size, lineHeight: 0 }}
      >
        <SocialNetworkIcon platform={account?.platform} size={size} title="" />
      </span>
    );
  }
  const badge = Math.max(10, Math.round(size * 0.42));
  return (
    <span
      className={cn("relative inline-flex flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <img
        src={account.avatarUrl}
        alt=""
        className="h-full w-full rounded-full bg-muted object-cover"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
      <span
        className="absolute -bottom-0.5 -right-0.5 rounded-[4px] ring-2 ring-background"
        style={{ lineHeight: 0 }}
      >
        <SocialNetworkIcon platform={account.platform} size={badge} title="" />
      </span>
    </span>
  );
}

/**
 * Mode de connexion d'un compte, à côté de son nom : « via Facebook »
 * (Instagram connecté via Facebook), « Business » (TikTok Business). Rien
 * pour la connexion habituelle du réseau.
 */
export function SocialAccountConnectorMention({ account, className }) {
  const mention = getAccountConnectorMention(account);
  if (!mention) return null;
  return (
    <span
      className={cn(
        "flex-shrink-0 rounded border px-1 text-[10px] font-medium leading-4 text-muted-foreground",
        className,
      )}
    >
      {mention}
    </span>
  );
}
