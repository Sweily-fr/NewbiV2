"use client";

import { useMemo, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
} from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ArrowUp, ArrowDown } from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

// Generate smooth SVG path from data points
const generateSmoothPath = (points, width, height) => {
  if (!points || points.length < 2) return `M 0 ${height}`;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const xStep = width / (points.length - 1);
  const pathData = points.map((point, i) => {
    const x = i * xStep;
    const y = height - ((point - min) / range) * (height * 0.8) - height * 0.1;
    return [x, y];
  });
  let path = `M ${pathData[0][0]} ${pathData[0][1]}`;
  for (let i = 0; i < pathData.length - 1; i++) {
    const [x1, y1] = pathData[i];
    const [x2, y2] = pathData[i + 1];
    const midX = (x1 + x2) / 2;
    path += ` C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;
  }
  return path;
};

function SparkLine({ data, isPositive, id }) {
  const lineRef = useRef(null);
  const areaRef = useRef(null);
  const svgWidth = 120;
  const svgHeight = 40;

  const linePath = useMemo(
    () => generateSmoothPath(data, svgWidth, svgHeight),
    [data]
  );
  const areaPath = useMemo(
    () =>
      linePath.startsWith("M")
        ? `${linePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`
        : "",
    [linePath]
  );

  const strokeColor = isPositive ? "#22c55e" : "#ef4444";
  const gradientId = `sparkGrad-${id}`;

  useEffect(() => {
    const path = lineRef.current;
    const area = areaRef.current;
    if (path && area) {
      const length = path.getTotalLength();
      path.style.transition = "none";
      path.style.strokeDasharray = `${length} ${length}`;
      path.style.strokeDashoffset = String(length);
      area.style.transition = "none";
      area.style.opacity = "0";
      path.getBoundingClientRect();
      path.style.transition = "stroke-dashoffset 0.8s ease-in-out";
      path.style.strokeDashoffset = "0";
      area.style.transition = "opacity 0.8s ease-in-out 0.2s";
      area.style.opacity = "1";
    }
  }, [linePath]);

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path ref={areaRef} d={areaPath} fill={`url(#${gradientId})`} />
      <path
        ref={lineRef}
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const kpiConfig = [
  {
    key: "currentBalance",
    title: "Solde actuel",
    getSparkData: (months) => months?.map((m) => m.closingBalance) || [],
    getChange: (kpi, months) => {
      if (!months || months.length < 2) return null;
      const first = months[0]?.closingBalance || 0;
      const last = months[months.length - 1]?.closingBalance || 0;
      if (first === 0) return null;
      return ((last - first) / Math.abs(first)) * 100;
    },
  },
  {
    key: "projectedBalance3Months",
    title: "Prévision à 3 mois",
    getSparkData: (months) => {
      if (!months) return [];
      return months.slice(-6).map((m) => m.closingBalance);
    },
    getChange: (kpi) => {
      if (!kpi?.currentBalance || kpi.currentBalance === 0) return null;
      return (
        ((kpi.projectedBalance3Months - kpi.currentBalance) /
          Math.abs(kpi.currentBalance)) *
        100
      );
    },
  },
  {
    key: "pendingReceivables",
    title: "Encaissements à venir",
    getSparkData: (months) => months?.map((m) => m.actualIncome || m.forecastIncome || 0) || [],
    getChange: () => null,
  },
  {
    key: "pendingPayables",
    title: "Décaissements à venir",
    getSparkData: (months) => months?.map((m) => m.actualExpense || m.forecastExpense || 0) || [],
    getChange: () => null,
  },
];

export function ForecastKpiCards({ kpi, months, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-xs">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-7 w-28" />
                </div>
                <Skeleton className="h-10 w-24 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiConfig.map(({ key, title, getSparkData, getChange }) => {
        const value = kpi?.[key] || 0;
        const sparkData = getSparkData(months);
        const change = getChange(kpi, months);
        const isPositive = key === "pendingPayables" ? false : (change === null ? value >= 0 : change >= 0);

        return (
          <Card key={key} className="shadow-xs">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <span>{title}</span>
                    {change !== null && (
                      <span
                        className={`flex items-center font-semibold ${
                          change >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {Math.abs(change).toFixed(0)}%
                        {change >= 0 ? (
                          <ArrowUp size={12} className="ml-0.5" />
                        ) : (
                          <ArrowDown size={12} className="ml-0.5" />
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-semibold text-foreground mt-1">
                    {formatCurrency(value)}
                  </p>
                </div>
                {sparkData.length >= 2 && (
                  <div className="w-24 h-10">
                    <SparkLine data={sparkData} isPositive={isPositive} id={key} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
