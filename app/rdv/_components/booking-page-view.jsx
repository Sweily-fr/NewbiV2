"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";
import { durationLabel, locationKindLabel } from "@/src/utils/booking";
import { bookingErrorText, fetchBookingPage } from "../_lib/booking-api";
import {
  BookingCard,
  BookingShell,
  BookingUnavailable,
  OrganizerAvatar,
} from "./booking-shell";
import { LocationIcon } from "./appointment-details";
import { RdvPageSkeleton } from "./rdv-page-skeleton";

const typeHref = (slug, typeSlug, embed) =>
  `/rdv/${encodeURIComponent(slug)}/${encodeURIComponent(typeSlug)}${embed ? "?embed=1" : ""}`;

/**
 * /rdv/<adresse> : en-tête de l'organisateur et liste des rendez-vous
 * proposés. Un seul type : on y va directement.
 */
export function BookingPageView({ slug, embed = false }) {
  const router = useRouter();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetchBookingPage(slug, { signal: controller.signal })
      .then((data) => {
        const types = data?.types || [];
        if (types.length === 1) {
          router.replace(typeHref(slug, types[0].slug, embed));
          return;
        }
        setState({ status: "ready", page: data.page, types });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ status: "error", error });
      });
    return () => controller.abort();
  }, [slug, embed, router]);

  if (state.status === "loading") {
    return <RdvPageSkeleton variant="list" embed={embed} />;
  }
  if (state.status === "error") {
    return (
      <BookingUnavailable
        embed={embed}
        text={
          state.error?.code === "NOT_FOUND"
            ? undefined
            : bookingErrorText(state.error)
        }
      />
    );
  }

  const { page, types } = state;
  const name = page.organizationName || page.title;

  return (
    <BookingShell embed={embed} accentColor={page.accentColor}>
      <BookingCard className="mx-auto max-w-2xl">
        <header className="flex flex-col items-center gap-3 border-b border-gray-100 px-6 py-8 text-center">
          <OrganizerAvatar
            src={page.avatarUrl}
            name={name}
            accentColor={page.accentColor}
          />
          <div className="space-y-1">
            {page.organizationName && page.organizationName !== page.title && (
              <p className="text-sm text-gray-500">{page.organizationName}</p>
            )}
            <h1 className="text-2xl font-semibold text-balance text-gray-900">
              {page.title}
            </h1>
          </div>
          {page.description && (
            <p className="max-w-lg text-sm leading-relaxed whitespace-pre-line text-gray-600">
              {page.description}
            </p>
          )}
        </header>

        <div className="p-4 sm:p-6">
          {types.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Aucun rendez-vous n&apos;est proposé pour le moment.
            </p>
          ) : (
            <ul className="space-y-3">
              {types.map((type) => (
                <li key={type.slug}>
                  <Link
                    href={typeHref(page.slug || slug, type.slug, embed)}
                    className="group flex items-center gap-4 rounded-2xl border border-gray-200 px-4 py-4 transition-colors hover:border-[var(--rdv-accent)] hover:bg-[color-mix(in_srgb,var(--rdv-accent)_4%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--rdv-accent)] focus-visible:outline-none sm:px-5"
                  >
                    <span
                      className="h-10 w-1 shrink-0 rounded-full bg-[var(--rdv-accent)]"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-gray-900">
                        {type.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" aria-hidden="true" />
                          {durationLabel(type.durationMinutes)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <LocationIcon
                            kind={type.locationKind}
                            className="size-3.5"
                          />
                          {locationKindLabel(type.locationKind)}
                        </span>
                      </span>
                      {type.description && (
                        <span className="mt-1.5 line-clamp-2 block text-sm text-gray-500">
                          {type.description}
                        </span>
                      )}
                    </span>
                    <ChevronRight
                      className="size-5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--rdv-accent-ink)]"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </BookingCard>
    </BookingShell>
  );
}
