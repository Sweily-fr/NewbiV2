"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import {
  recordDisplayName,
  recordStatusMeta,
} from "@/src/utils/email-sending-domain";
import { FOCUS_RING, ToneBadge } from "../shared";

/** Bouton copier (icône seule) : coche verte un instant après la copie. */
export function CopyIconButton({ text, label, className }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible", {
        description: "Sélectionnez le texte et copiez-le à la main.",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copié" : label}
      title={label}
      className={cn(
        "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-black/[0.05] hover:text-foreground dark:hover:bg-white/[0.08]",
        FOCUS_RING,
        className,
      )}
    >
      {copied ? (
        <Check
          className="size-3.5 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}

/**
 * Coupures de ligne permises après « . », « - » et « _ » (noms et valeurs
 * DNS sans espace) ; le texte copié reste intact.
 */
function breakable(text) {
  const parts = [];
  String(text ?? "")
    .split(/([.\-_])/)
    .forEach((part, index) => {
      if (!part) return;
      parts.push(part);
      if (index % 2 === 1) parts.push(<wbr key={index} />);
    });
  return parts;
}

/** Texte à recopier chez l'hébergeur (police à chasse fixe) et son bouton. */
function CopyableValue({ text, label, clamp = false }) {
  return (
    <div className="flex min-w-0 items-start gap-1">
      <code
        className={cn(
          "min-w-0 flex-1 pt-1 font-mono text-xs leading-5 wrap-anywhere text-foreground",
          clamp && "line-clamp-3",
        )}
        title={clamp ? text : undefined}
      >
        {breakable(text)}
      </code>
      <CopyIconButton text={text} label={label} />
    </div>
  );
}

const HEAD_CELL =
  "px-3 py-2 text-left text-xs font-medium text-muted-foreground first:pl-4 last:pr-4";
const CELL = "px-3 py-2.5 align-top first:pl-4 last:pr-4";

/**
 * Lignes DNS à ajouter chez l'hébergeur : tableau Type / Nom / Valeur /
 * Priorité / État sur ordinateur, une carte par ligne sur mobile. Nom et
 * valeur se copient d'un clic ; `fullNames` affiche les noms complets
 * (certains hébergeurs les demandent).
 */
export function DnsRecords({ records, fullNames = false }) {
  const items = (records || []).map((record, index) => ({
    key: `${record.type}-${record.name}-${index}`,
    record,
    name: recordDisplayName(record, { full: fullNames }),
    meta: recordStatusMeta(record.status),
    failed: recordStatusMeta(record.status).tone === "danger",
  }));

  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-[#E6E7EA] px-4 py-6 text-center text-sm text-muted-foreground dark:border-[#2E2E32]">
        Les lignes à ajouter n&apos;ont pas pu être chargées. Cliquez sur
        Vérifier pour les afficher.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-[#EEEFF1] md:block dark:border-[#232323]">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[68px]" />
            <col className="w-[27%]" />
            <col />
            <col className="w-[72px]" />
            <col className="w-[116px]" />
          </colgroup>
          <thead className="bg-[#fafafa] dark:bg-white/[0.03]">
            <tr className="border-b border-[#EEEFF1] dark:border-[#232323]">
              <th scope="col" className={HEAD_CELL}>
                Type
              </th>
              <th scope="col" className={HEAD_CELL}>
                Nom
              </th>
              <th scope="col" className={HEAD_CELL}>
                Valeur
              </th>
              <th scope="col" className={HEAD_CELL}>
                Priorité
              </th>
              <th scope="col" className={HEAD_CELL}>
                État
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEEFF1] dark:divide-[#232323]">
            {items.map(({ key, record, name, meta, failed }) => (
              <tr
                key={key}
                className={cn(failed && "bg-red-50/70 dark:bg-red-500/[0.06]")}
              >
                <td className={cn(CELL, "pt-3.5 text-xs font-medium")}>
                  {record.type}
                </td>
                <td className={CELL}>
                  <CopyableValue text={name} label="Copier le nom" />
                </td>
                <td className={CELL}>
                  <CopyableValue
                    text={record.value}
                    label="Copier la valeur"
                    clamp
                  />
                </td>
                <td className={cn(CELL, "pt-3.5 text-xs tabular-nums")}>
                  {record.priority ?? ""}
                </td>
                <td className={cn(CELL, "pt-3")}>
                  <ToneBadge tone={meta.tone} dot>
                    {meta.label}
                  </ToneBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {items.map(({ key, record, name, meta, failed }) => (
          <li
            key={key}
            className={cn(
              "rounded-xl border p-3",
              failed
                ? "border-red-200 bg-red-50/60 dark:border-red-500/25 dark:bg-red-500/[0.06]"
                : "border-[#EEEFF1] dark:border-[#232323]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{record.type}</span>
              <ToneBadge tone={meta.tone} dot>
                {meta.label}
              </ToneBadge>
            </div>
            <dl className="mt-2 flex flex-col gap-1.5">
              <div>
                <dt className="text-[11px] font-medium text-muted-foreground">
                  Nom
                </dt>
                <dd>
                  <CopyableValue text={name} label="Copier le nom" />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-muted-foreground">
                  Valeur
                </dt>
                <dd>
                  <CopyableValue
                    text={record.value}
                    label="Copier la valeur"
                    clamp
                  />
                </dd>
              </div>
              {record.priority != null && (
                <div className="flex items-center gap-2">
                  <dt className="text-[11px] font-medium text-muted-foreground">
                    Priorité
                  </dt>
                  <dd className="text-xs tabular-nums">{record.priority}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
