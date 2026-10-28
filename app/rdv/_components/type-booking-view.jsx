"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  bookingErrorText,
  fetchAppointmentType,
  fetchBookingPage,
} from "../_lib/booking-api";
import { useGuestTimeZone } from "../_lib/use-guest-time-zone";
import { BookingCard, BookingShell, BookingUnavailable } from "./booking-shell";
import { AppointmentTypeInfo } from "./appointment-details";
import { SlotPicker } from "./slot-picker";
import { BookingForm } from "./booking-form";
import { BookingConfirmation } from "./booking-confirmation";
import { RdvPageSkeleton } from "./rdv-page-skeleton";

const SLOT_TAKEN_NOTICE =
  "Ce créneau vient d'être réservé, choisissez-en un autre.";

/**
 * /rdv/<adresse>/<type> : infos du type à gauche, créneau puis coordonnées
 * à droite, puis confirmation.
 */
export function TypeBookingView({ slug, typeSlug, embed = false }) {
  const [state, setState] = useState({ status: "loading" });
  const [typesCount, setTypesCount] = useState(0);
  const [guestTimeZone, setGuestTimeZone] = useGuestTimeZone();
  const [step, setStep] = useState("pick");
  const [slot, setSlot] = useState(null);
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchAppointmentType(slug, typeSlug, { signal: controller.signal })
      .then((data) => setState({ status: "ready", ...data }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ status: "error", error });
      });
    // Lien « Tous les rendez-vous » seulement s'il y en a plusieurs
    fetchBookingPage(slug, { signal: controller.signal })
      .then((data) => setTypesCount(data?.types?.length || 0))
      .catch(() => {});
    return () => controller.abort();
  }, [slug, typeSlug]);

  // Changement d'étape : on remonte en haut de la carte (téléphone)
  useEffect(() => {
    if (step === "pick" && !notice) return;
    const card = cardRef.current;
    if (card && card.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [step, notice]);

  if (state.status === "loading") {
    return <RdvPageSkeleton embed={embed} />;
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

  const { page, type } = state;
  const backHref = `/rdv/${encodeURIComponent(page.slug || slug)}${embed ? "?embed=1" : ""}`;

  return (
    <BookingShell embed={embed} accentColor={page.accentColor}>
      <div ref={cardRef} className="scroll-mt-4">
        <BookingCard>
          {step === "done" && confirmation ? (
            <div className="px-5 py-8 sm:px-10 sm:py-12">
              <BookingConfirmation
                result={confirmation.result}
                guestEmail={confirmation.email}
                guestTimeZone={guestTimeZone}
              />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              <aside className="border-b border-gray-100 p-5 sm:p-6 md:w-80 md:shrink-0 md:border-r md:border-b-0">
                {typesCount > 1 && (
                  <Link
                    href={backHref}
                    className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Tous les rendez-vous
                  </Link>
                )}
                <AppointmentTypeInfo page={page} type={type} />
              </aside>

              <section className="min-w-0 flex-1 p-5 sm:p-6">
                {step === "pick" ? (
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Choisissez un créneau
                    </h2>
                    {notice && (
                      <p
                        role="status"
                        className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"
                      >
                        {notice}
                      </p>
                    )}
                    <SlotPicker
                      slug={page.slug || slug}
                      typeSlug={type.slug}
                      pageTimeZone={page.timezone}
                      maxDaysAhead={type.maxDaysAhead}
                      guestTimeZone={guestTimeZone}
                      onGuestTimeZoneChange={setGuestTimeZone}
                      selectedStart={slot?.start}
                      reloadKey={reloadKey}
                      onSelect={(picked) => {
                        setSlot(picked);
                        setNotice("");
                        setStep("form");
                      }}
                    />
                  </div>
                ) : (
                  <BookingForm
                    slug={page.slug || slug}
                    type={type}
                    slot={slot}
                    guestTimeZone={guestTimeZone}
                    onBack={() => setStep("pick")}
                    onBooked={(result, values) => {
                      setConfirmation({ result, email: values.email.trim() });
                      setStep("done");
                    }}
                    onSlotTaken={() => {
                      setNotice(SLOT_TAKEN_NOTICE);
                      setSlot(null);
                      setReloadKey((key) => key + 1);
                      setStep("pick");
                    }}
                  />
                )}
              </section>
            </div>
          )}
        </BookingCard>
      </div>
    </BookingShell>
  );
}
