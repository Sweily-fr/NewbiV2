"use client";

import { useState } from "react";
import {
  CalendarClock,
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
  countChecks,
  formatCount,
  sortChecks,
} from "@/src/utils/email-campaigns";
import {
  estimatedDaysLabel,
  estimatedEndLabel,
  prospectingCheckTarget,
} from "@/src/utils/prospecting";
import { CARD_CLASS, FOCUS_RING, openSettings } from "../shared";

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
    one: "information",
    many: "informations",
  },
  OK: {
    icon: CircleCheck,
    className: "text-emerald-600 dark:text-emerald-400",
    one: "point validé",
    many: "points validés",
  },
};

/** Ouvre l'étape de la page qui corrige le contrôle. */
function goToSection(section) {
  const element = document.getElementById(section);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
  element?.querySelector("button")?.focus({ preventScroll: true });
}

function CheckItem({ check, canEdit }) {
  const level = LEVELS[check.level] || LEVELS.INFO;
  const Icon = level.icon;
  const fixable = check.level === "ERROR" || check.level === "WARNING";
  const target = fixable ? prospectingCheckTarget(check) : null;
  const linkClass = cn(
    "mt-1 inline-flex cursor-pointer rounded-sm text-xs font-medium text-[#5a50ff] hover:underline dark:text-[#8b7fff]",
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
        {target?.section && (canEdit || target.section === "boite") && (
          <button
            type="button"
            className={linkClass}
            onClick={() => goToSection(target.section)}
          >
            Corriger
          </button>
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
 * Vérification avant lancement (API) : destinataires retenus, fin prévue
 * au rythme de la boîte, contrôles du plus grave au moins grave ; les
 * points validés sont repliés.
 */
export function VerificationPanel({
  verification,
  loading,
  error,
  onRefresh,
  canEdit,
  className,
}) {
  const [showOk, setShowOk] = useState(false);
  const checks = sortChecks(verification?.checks);
  const counts = countChecks(checks);
  const problems = checks.filter((check) => check.level !== "OK");
  const passed = checks.filter((check) => check.level === "OK");
  const sendable = verification?.audience?.sendable ?? null;
  const end = estimatedEndLabel(verification?.estimatedEndDate);
  const days = estimatedDaysLabel(verification?.estimatedDays);

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
          Vérification avant lancement
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

      {!verification && loading ? (
        <div className="mt-4 flex flex-col gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      ) : error && !verification ? (
        <p className="mt-3 text-sm text-muted-foreground">
          La vérification n&apos;a pas pu être faite. Relancez-la dans un
          instant.
        </p>
      ) : verification ? (
        <>
          <div
            className={cn(
              "mt-4 rounded-xl p-4",
              verification.canSend
                ? "bg-emerald-50 dark:bg-emerald-500/10"
                : "bg-red-50 dark:bg-red-500/10",
            )}
          >
            <p
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                verification.canSend
                  ? "text-emerald-800 dark:text-emerald-300"
                  : "text-red-800 dark:text-red-300",
              )}
            >
              {verification.canSend ? (
                <CircleCheck className="size-4" aria-hidden />
              ) : (
                <CircleX className="size-4" aria-hidden />
              )}
              {verification.canSend ? "Prête à partir" : "Lancement bloqué"}
            </p>
            {sendable !== null && (
              <p className="mt-2 text-sm">
                <span className="text-2xl font-medium tracking-tight tabular-nums">
                  {formatCount(sendable)}
                </span>{" "}
                <span className="text-muted-foreground">
                  destinataire{sendable > 1 ? "s" : ""}
                </span>
              </p>
            )}
            {(end || days) && (
              <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                <CalendarClock
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden
                />
                <span>{[end, days].filter(Boolean).join(" · ")}</span>
              </p>
            )}
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

          {problems.length > 0 && (
            <ul className="mt-3 divide-y divide-[#EEEFF1] dark:divide-[#232323]">
              {problems.map((check) => (
                <CheckItem
                  key={check.id + check.title}
                  check={check}
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
