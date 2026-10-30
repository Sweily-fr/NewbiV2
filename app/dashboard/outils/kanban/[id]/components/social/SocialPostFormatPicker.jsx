"use client";

import { Info } from "lucide-react";
import {
  STORY_UNAVAILABLE_MESSAGE,
  getPlatformLabel,
  getPostFormat,
} from "@/src/utils/social-post-rules";
import { SocialNetworkIcon } from "./SocialNetworkIcon";
import { SocialSegmentedControl } from "./SocialSegmentedControl";

/**
 * Format du post par réseau : « Publication » ou « Story » (Instagram et
 * Facebook). Story grisée, avec l'explication, quand aucun compte choisi du
 * réseau ne la permet (comptes Zernio). `hints` : conseils d'une story
 * (texte non affiché, plusieurs stories, format vertical), jamais bloquants.
 *
 * @param {{ networks: Array<{ platform: string, storyAvailable: boolean }>, formats: object, onChange: (platform: string, format: string) => void, hints: string[], disabled?: boolean }} props
 */
export function SocialPostFormatPicker({
  networks,
  formats,
  onChange,
  hints,
  disabled = false,
}) {
  return (
    <div className="space-y-2.5">
      {networks.map(({ platform, storyAvailable }) => {
        const label = getPlatformLabel(platform);
        return (
          <div
            key={platform}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5"
          >
            <span className="flex items-center gap-2 text-sm">
              <SocialNetworkIcon platform={platform} title="" />
              {label}
            </span>
            <SocialSegmentedControl
              label={`Format ${label}`}
              value={getPostFormat(formats, platform)}
              onChange={(format) => onChange(platform, format)}
              disabled={disabled}
              options={[
                { value: "post", label: "Publication" },
                {
                  value: "story",
                  label: "Story",
                  disabled: !storyAvailable,
                  title: storyAvailable ? undefined : STORY_UNAVAILABLE_MESSAGE,
                },
              ]}
            />
            {!storyAvailable && (
              <p className="w-full text-xs text-muted-foreground">
                {STORY_UNAVAILABLE_MESSAGE}
              </p>
            )}
          </div>
        );
      })}
      {hints.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-muted/40 p-2.5">
          {hints.map((hint) => (
            <li
              key={hint}
              className="flex items-start gap-1.5 text-xs text-muted-foreground"
            >
              <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
              <span>{hint}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
