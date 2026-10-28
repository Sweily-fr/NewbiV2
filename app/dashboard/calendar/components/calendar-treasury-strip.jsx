"use client";

import { memo, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CircleAlert, Landmark } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { dayToDate } from "@/src/utils/recurrenceDays";
import { formatLinkedAmount } from "@/src/utils/calendar-linked-items";

const euros = (amount) => formatLinkedAmount(amount, "EUR", { compact: true });
const shortDay = (day) => format(dayToDate(day), "d MMM", { locale: fr });
const longDay = (day) => format(dayToDate(day), "EEEE d MMMM", { locale: fr });

// Dimensions logiques de la courbe (le SVG s'étire en largeur)
const HEIGHT = 40;
const PAD_Y = 4;

/**
 * Courbe du solde prévu en fin de journée, avec la ligne du zéro quand le
 * compte passe dans le rouge, le point bas marqué et une infobulle par
 * jour au survol.
 */
function TreasurySparkline({ days, lowestDay }) {
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const geometry = useMemo(() => {
    const values = days.map((d) => d.balance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const width = Math.max(days.length - 1, 1) * 10;
    const x = (i) => (days.length === 1 ? width / 2 : i * 10);
    const y = (v) => PAD_Y + (1 - (v - min) / span) * (HEIGHT - PAD_Y * 2);
    const points = days.map((d, i) => [x(i), y(d.balance)]);
    const line = points.map(([px, py]) => `${px},${py}`).join(" ");
    const zeroY = min < 0 ? y(0) : null;
    const area = `M0,${HEIGHT} L${points
      .map(([px, py]) => `${px},${py}`)
      .join(" L")} L${width},${HEIGHT} Z`;
    return { width, points, line, area, zeroY, x };
  }, [days]);

  const lowestIndex = days.findIndex((d) => d.day === lowestDay);
  const hovered = hoverIndex !== null ? days[hoverIndex] : null;

  const handleMove = (event) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || days.length === 0) return;
    const ratio = Math.min(
      Math.max((event.clientX - rect.left) / rect.width, 0),
      1,
    );
    setHoverIndex(Math.round(ratio * (days.length - 1)));
  };

  return (
    <div
      ref={containerRef}
      className="relative h-10 min-w-[140px] flex-1"
      onPointerMove={handleMove}
      onPointerLeave={() => setHoverIndex(null)}
    >
      <svg
        viewBox={`0 0 ${geometry.width} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="size-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="calendar-treasury-fill"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#5a50ff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#5a50ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={geometry.area} fill="url(#calendar-treasury-fill)" />
        {geometry.zeroY !== null && (
          <line
            x1="0"
            x2={geometry.width}
            y1={geometry.zeroY}
            y2={geometry.zeroY}
            className="stroke-red-500/60"
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <polyline
          points={geometry.line}
          fill="none"
          stroke="#5a50ff"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {hoverIndex !== null && (
          <line
            x1={geometry.points[hoverIndex][0]}
            x2={geometry.points[hoverIndex][0]}
            y1="0"
            y2={HEIGHT}
            className="stroke-muted-foreground/40"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {/* Points en HTML : un SVG étiré déformerait les cercles */}
      {lowestIndex >= 0 && (
        <span
          className={cn(
            "pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background",
            days[lowestIndex].balance < 0 ? "bg-red-500" : "bg-[#5a50ff]",
          )}
          style={{
            left: `${(geometry.points[lowestIndex][0] / geometry.width) * 100}%`,
            top: `${(geometry.points[lowestIndex][1] / HEIGHT) * 100}%`,
          }}
          aria-hidden="true"
        />
      )}
      {hovered && (
        <>
          <span
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5a50ff] ring-2 ring-background"
            style={{
              left: `${(geometry.points[hoverIndex][0] / geometry.width) * 100}%`,
              top: `${(geometry.points[hoverIndex][1] / HEIGHT) * 100}%`,
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-full z-20 mb-2 w-max max-w-56 -translate-x-1/2 rounded-md bg-[#202020] px-3 py-1.5 text-xs text-white shadow-md"
            style={{
              left: `${Math.min(Math.max((geometry.points[hoverIndex][0] / geometry.width) * 100, 12), 88)}%`,
            }}
          >
            <p className="font-medium first-letter:uppercase">
              {longDay(hovered.day)}
            </p>
            <p
              className={cn(
                "tabular-nums",
                hovered.balance < 0 && "text-red-300",
              )}
            >
              Solde prévu : {euros(hovered.balance)}
            </p>
            {(hovered.income > 0 || hovered.expense > 0) && (
              <p className="text-white/70 tabular-nums">
                {hovered.income > 0 && `+ ${euros(hovered.income)}`}
                {hovered.income > 0 && hovered.expense > 0 && " · "}
                {hovered.expense > 0 && `- ${euros(hovered.expense)}`}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// « Solde prévu ce soir », « fin de semaine », « fin octobre », « dans 30 jours »
function endOfPeriodLabel(period) {
  if (period.of === "du jour") return "Solde prévu ce soir";
  if (period.of === "de la semaine") return "Solde prévu fin de semaine";
  if (period.of.startsWith("des ")) {
    return `Solde prévu dans ${period.of.slice(4)}`;
  }
  return `Solde prévu fin ${period.of.replace(/^d(e |')/, "")}`;
}

function Figure({ label, value, sub, tone }) {
  return (
    <div className="shrink-0 leading-tight">
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "danger" && "text-red-600 dark:text-red-400",
        )}
      >
        {value}
        {sub && (
          <span className="text-muted-foreground ml-1 text-[11px] font-normal">
            {sub}
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * Bande « Trésorerie » sous la barre des sources : solde des comptes
 * aujourd'hui, courbe du solde prévu jour par jour (échéances non réglées
 * et prévisions), point bas et solde en fin de période. Les retards ne
 * sont pas projetés : leurs totaux sont rappelés à part.
 */
export const CalendarTreasuryStrip = memo(function CalendarTreasuryStrip({
  treasury,
  period,
}) {
  if (!treasury) return null;

  if (!treasury.hasBankAccounts) {
    return (
      <div className="text-muted-foreground mx-2 mb-2 flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs sm:mx-4">
        <Landmark className="size-4 shrink-0" aria-hidden="true" />
        <span>
          Connectez un compte bancaire pour voir votre solde prévu jour par
          jour.
        </span>
        <Link
          href="/dashboard/outils/transactions"
          className="text-foreground ml-auto shrink-0 font-medium underline-offset-4 hover:underline"
        >
          Connecter un compte
        </Link>
      </div>
    );
  }

  const days = treasury.days || [];
  const last = days[days.length - 1];
  const lowest = treasury.lowest;
  const goesNegative = !!lowest && lowest.balance < 0;
  const hasOverdue = treasury.overdueIncome > 0 || treasury.overdueExpense > 0;
  const summary = last
    ? `Solde prévu : ${euros(treasury.currentBalance)} aujourd'hui, ${euros(last.balance)} le ${longDay(last.day)}${lowest ? `, point bas ${euros(lowest.balance)} le ${longDay(lowest.day)}` : ""}.`
    : `Solde des comptes aujourd'hui : ${euros(treasury.currentBalance)}.`;

  return (
    <section
      aria-label={summary}
      className="bg-muted/20 mx-2 mb-2 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border px-3 py-2 sm:mx-4"
    >
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="flex size-7 items-center justify-center rounded-md bg-[#5a50ff]/10"
          aria-hidden="true"
        >
          <Landmark className="size-4 text-[#5a50ff]" />
        </span>
        <Figure
          label="Solde aujourd'hui"
          value={euros(treasury.currentBalance)}
          tone={treasury.currentBalance < 0 ? "danger" : undefined}
        />
      </div>

      {days.length > 1 && (
        <TreasurySparkline days={days} lowestDay={lowest?.day} />
      )}

      {lowest && days.length > 1 && (
        <Figure
          label={goesNegative ? "Passage dans le rouge" : "Point bas"}
          value={euros(lowest.balance)}
          sub={`le ${shortDay(lowest.day)}`}
          tone={goesNegative ? "danger" : undefined}
        />
      )}
      {last && (
        <Figure
          label={endOfPeriodLabel(period)}
          value={euros(last.balance)}
          tone={last.balance < 0 ? "danger" : undefined}
        />
      )}
      {hasOverdue && (
        <p className="text-muted-foreground flex shrink-0 items-center gap-1 text-[11px]">
          <CircleAlert className="size-3" aria-hidden="true" />
          Retards hors calcul :
          {treasury.overdueIncome > 0 && (
            <span className="tabular-nums">
              {" "}
              + {euros(treasury.overdueIncome)}
            </span>
          )}
          {treasury.overdueIncome > 0 && treasury.overdueExpense > 0 && " /"}
          {treasury.overdueExpense > 0 && (
            <span className="tabular-nums">
              {" "}
              - {euros(treasury.overdueExpense)}
            </span>
          )}
        </p>
      )}
    </section>
  );
});

/**
 * Pastille rouge à côté du numéro du jour quand le solde prévu passe sous
 * zéro ce jour-là (vue mois).
 */
export function TreasuryDayBadge({ day, balance }) {
  if (balance === undefined || balance >= 0) return null;
  return (
    <span
      className="mt-1.5 mr-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] leading-none font-medium text-red-600 tabular-nums dark:text-red-400"
      title={`Solde prévu le ${longDay(day)} : ${euros(balance)}`}
    >
      {euros(balance)}
    </span>
  );
}
