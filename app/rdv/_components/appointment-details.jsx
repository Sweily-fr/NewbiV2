import { Clock, Globe, MapPin, Phone, Video } from "lucide-react";
import {
  durationLabel,
  locationKindLabel,
  VIDEO_LOCATION_KINDS,
} from "@/src/utils/booking";
import { OrganizerAvatar } from "./booking-shell";

/** Icône du lieu : visio, appel ou adresse. */
export function LocationIcon({ kind, className }) {
  const Icon = VIDEO_LOCATION_KINDS.includes(kind)
    ? Video
    : kind === "PHONE"
      ? Phone
      : kind === "IN_PERSON"
        ? MapPin
        : Globe;
  return <Icon className={className} aria-hidden="true" />;
}

/**
 * Colonne d'informations du type de rendez-vous : organisateur, nom,
 * durée, lieu et description.
 */
export function AppointmentTypeInfo({ page, type }) {
  const locationText =
    type.locationLabel || locationKindLabel(type.locationKind);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <OrganizerAvatar
          src={page.avatarUrl}
          name={page.organizationName || page.title}
          accentColor={page.accentColor}
          size={44}
        />
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-500">
            {page.organizationName || page.title}
          </p>
          {page.organizationName && page.title !== page.organizationName && (
            <p className="truncate text-xs text-gray-400">{page.title}</p>
          )}
        </div>
      </div>

      <h1 className="text-2xl leading-tight font-semibold text-balance text-gray-900">
        {type.name}
      </h1>

      <ul className="space-y-2.5 text-sm text-gray-600">
        <li className="flex items-center gap-2.5">
          <Clock className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
          {durationLabel(type.durationMinutes)}
        </li>
        <li className="flex items-start gap-2.5">
          <LocationIcon
            kind={type.locationKind}
            className="mt-0.5 size-4 shrink-0 text-gray-400"
          />
          <span className="break-words">{locationText}</span>
        </li>
      </ul>

      {type.description && (
        <p className="text-sm leading-relaxed whitespace-pre-line text-gray-600">
          {type.description}
        </p>
      )}
    </div>
  );
}
