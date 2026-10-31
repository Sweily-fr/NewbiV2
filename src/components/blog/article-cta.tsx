import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { CTA_CONTENT, isCtaIntent, type CtaIntent } from "@/src/lib/blog-cta";

/**
 * Appel à l'action d'un article, adapté à son sujet (voir src/lib/blog-cta.ts).
 * `compact` pour le premier, placé sous l'introduction : une ligne et un
 * bouton, pour ne pas couper la lecture ; la carte complète ensuite.
 */
export function ArticleCta({
  intent,
  defaultIntent,
  variant = "card",
}: {
  intent?: string;
  defaultIntent: CtaIntent;
  variant?: "card" | "compact";
}) {
  const content = CTA_CONTENT[isCtaIntent(intent) ? intent : defaultIntent];
  const { title, text, primary, secondary, note } = content;

  if (variant === "compact") {
    return (
      <div className="not-prose my-8 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <Button asChild size="sm" className="shrink-0">
          <Link href={primary.href}>
            {primary.label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="not-prose my-10 rounded-2xl border border-gray-200 bg-gradient-to-b from-[#5a50ff]/[0.04] to-white px-6 py-6">
      <p className="text-base font-medium text-gray-900">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild size="lg">
          <Link href={primary.href}>{primary.label}</Link>
        </Button>
        {secondary && (
          <Link
            href={secondary.href}
            className="text-sm text-[#5a50ff] hover:underline"
          >
            {secondary.label}
          </Link>
        )}
      </div>
      {note && <p className="mt-3 text-xs text-gray-500">{note}</p>}
    </div>
  );
}
