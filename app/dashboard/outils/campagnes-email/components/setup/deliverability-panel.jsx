"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  CircleCheck,
  CircleX,
  Info,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import {
  checkTarget,
  countChecks,
  formatScore,
  scoreTone,
  sortChecks,
} from "@/src/utils/email-campaigns";
import { CARD_CLASS, FOCUS_RING, editorUrl, openSettings } from "../shared";

const TONE_COLORS = {
  good: "#10b981",
  fair: "#f59e0b",
  poor: "#ef4444",
};

const LEVELS = {
  ERROR: {
    icon: CircleX,
    className: "text-red-600 dark:text-red-400",
    one: "point bloquant",
    many: "points bloquants",
  },
  WARNING: {
    icon: TriangleAlert,
    className: "text-amber-600 dark:text-amber-400",
    one: "avertissement",
    many: "avertissements",
  },
  INFO: {
    icon: Info,
    className: "text-sky-600 dark:text-sky-400",
    one: "conseil",
    many: "conseils",
  },
  OK: {
    icon: CircleCheck,
    className: "text-emerald-600 dark:text-emerald-400",
    one: "point validé",
    many: "points validés",
  },
};

// Simples constats (contacts écartés…) : sans lien ; ces conseils-là se
// corrigent
const FIXABLE_INFOS = ["preheader", "images_empty"];

export function ScoreRing({ score, size = 84, stroke = 7 }) {
  const tone = scoreTone(score);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(10, score)) / 10;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-[#EEEFF1] dark:stroke-white/10"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE_COLORS[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] leading-none font-medium tabular-nums">
          {formatScore(score)}
        </span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">sur 10</span>
      </div>
    </div>
  );
}

function CheckItem({ check, campaignId, canEdit }) {
  const level = LEVELS[check.level] || LEVELS.INFO;
  const Icon = level.icon;
  // Lien de correction pour un problème, et pour les conseils qui se
  // corrigent ; jamais pour un simple constat
  const fixable =
    check.level === "ERROR" ||
    check.level === "WARNING" ||
    (check.level === "INFO" && FIXABLE_INFOS.includes(check.id));
  const target = fixable ? checkTarget(check.id) : null;
  const goToSection = (section) => {
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    element?.querySelector("button")?.focus({ preventScroll: true });
  };
  const linkClass = cn(
    "mt-1 inline-flex rounded-sm text-xs font-medium text-[#5a50ff] hover:underline dark:text-[#8b7fff]",
    FOCUS_RING,
  );
  return (
    <li className="flex gap-2.5 py-2.5">
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", level.className)}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5">{check.title}</p>
        {check.detail && (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {check.detail}
          </p>
        )}
        {target?.section && canEdit && (
          <button
            type="button"
            className={linkClass}
            onClick={() => goToSection(target.section)}
          >
            Corriger
          </button>
        )}
        {target?.editor && canEdit && (
          <Link href={editorUrl(campaignId)} className={linkClass}>
            Ouvrir l&apos;éditeur
          </Link>
        )}
        {target?.settings && (
          <button
            type="button"
            className={linkClass}
            onClick={() => openSettings("generale")}
          >
            Ouvrir les paramètres de l&apos;entreprise
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Vérification avant envoi (façon mail-tester) : note sur 10 et contrôles
 * de l'API, du plus grave au moins grave ; les points validés sont repliés.
 */
export function DeliverabilityPanel({
  deliverability,
  loading,
  error,
  onRefresh,
  campaignId,
  canEdit,
  className,
}) {
  const [showOk, setShowOk] = useState(false);
  const checks = sortChecks(deliverability?.checks);
  const counts = countChecks(checks);
  const problems = checks.filter((check) => check.level !== "OK");
  const passed = checks.filter((check) => check.level === "OK");

  return (
    <section
      aria-labelledby="verification-title"
      className={cn(CARD_CLASS, "p-4 sm:p-5", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="verification-title"
          className="text-[15px] leading-6 font-medium"
        >
          Vérification avant envoi
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Relancer la vérification"
          title="Relancer la vérification"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
        </Button>
      </div>

      {!deliverability && loading ? (
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="size-[84px] rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      ) : error && !deliverability ? (
        <p className="mt-3 text-sm text-muted-foreground">
          La vérification n&apos;a pas pu être faite. Relancez-la dans un
          instant.
        </p>
      ) : deliverability ? (
        <>
          <div className="mt-4 flex items-center gap-4">
            <ScoreRing score={deliverability.score} />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  deliverability.canSend
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400",
                )}
              >
                {deliverability.canSend
                  ? deliverability.score >= 8
                    ? "Prête à partir"
                    : "Envoi possible, à améliorer"
                  : "Envoi bloqué"}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {deliverability.canSend
                  ? "Corriger les avertissements améliore vos chances d'arriver en boîte de réception."
                  : "Corrigez les points bloquants pour pouvoir envoyer."}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {["ERROR", "WARNING", "INFO"].map((level) =>
                  counts[level] ? (
                    <span
                      key={level}
                      className={cn(
                        "flex items-center gap-1",
                        LEVELS[level].className,
                      )}
                    >
                      <span className="font-medium tabular-nums">
                        {counts[level]}
                      </span>
                      <span className="text-muted-foreground">
                        {counts[level] > 1
                          ? LEVELS[level].many
                          : LEVELS[level].one}
                      </span>
                    </span>
                  ) : null,
                )}
              </div>
            </div>
          </div>

          {problems.length > 0 && (
            <ul className="mt-3 divide-y divide-[#EEEFF1] border-t border-[#EEEFF1] dark:divide-[#232323] dark:border-[#232323]">
              {problems.map((check) => (
                <CheckItem
                  key={check.id + check.title}
                  check={check}
                  campaignId={campaignId}
                  canEdit={canEdit}
                />
              ))}
            </ul>
          )}

          {passed.length > 0 && (
            <div className="mt-1 border-t border-[#EEEFF1] pt-2 dark:border-[#232323]">
              <button
                type="button"
                aria-expanded={showOk}
                onClick={() => setShowOk((value) => !value)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md py-1.5 text-sm text-muted-foreground hover:text-foreground",
                  FOCUS_RING,
                )}
              >
                <span className="flex items-center gap-2">
                  <CircleCheck
                    className="size-4 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                  {passed.length}{" "}
                  {passed.length > 1 ? LEVELS.OK.many : LEVELS.OK.one}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    showOk && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              {showOk && (
                <ul className="divide-y divide-[#EEEFF1] dark:divide-[#232323]">
                  {passed.map((check) => (
                    <CheckItem
                      key={check.id + check.title}
                      check={check}
                      campaignId={campaignId}
                      canEdit={canEdit}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
