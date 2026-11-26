"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoleRouteGuard } from "@/src/components/rbac/RBACRouteGuard";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useAppointmentTypes, useMyBookingPage } from "@/src/hooks/useBooking";
import { isEventType } from "@/src/utils/booking-events";
import { TicketScannerDialog } from "../../components/ticket-scanner-dialog";
import { ScannerPageSkeleton } from "../../components/scanner-page-skeleton";

const BACK_HREF = "/dashboard/outils/rendez-vous?onglet=types";

function Notice({ title, text }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-black px-8 text-center text-white">
      <p className="text-lg font-medium">{title}</p>
      <p className="max-w-sm text-sm text-white/70">{text}</p>
      <Link
        href={BACK_HREF}
        className="mt-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black"
      >
        Retour aux événements
      </Link>
    </div>
  );
}

/**
 * Contrôle des billets en plein écran, à ouvrir sur un téléphone à
 * l'entrée de l'événement (seule page du tableau de bord permise sur
 * téléphone, voir src/middleware.js).
 */
function ControleContent({ typeId }) {
  const router = useRouter();
  const { canDo, isReady } = useMyPermissions();
  const { isReadOnly } = useSubscriptionAccess();
  const { page, loaded } = useMyBookingPage();
  const { types, loading } = useAppointmentTypes({ skip: !page });

  if (!loaded || (page && loading) || !isReady) return <ScannerPageSkeleton />;

  const type = types.find((item) => item.id === typeId);
  if (!page || !type || !isEventType(type)) {
    return (
      <Notice
        title="Événement introuvable"
        text="Cet événement n'existe plus ou n'appartient pas à votre page de réservation dans cet espace."
      />
    );
  }
  if (!canDo("appointments", "edit") || isReadOnly) {
    return (
      <Notice
        title="Contrôle non autorisé"
        text="Votre rôle ne permet pas de contrôler les billets. Demandez à un administrateur de l'espace."
      />
    );
  }

  return (
    <TicketScannerDialog
      type={type}
      timeZone={page.timezone}
      onClose={() => router.push(BACK_HREF)}
    />
  );
}

export default function ControleBilletsPage({ params }) {
  const { typeId } = use(params);
  return (
    <RoleRouteGuard
      roles={["owner", "admin", "member"]}
      fallbackUrl="/dashboard"
      toastMessage="Vous n'avez pas accès au contrôle des billets."
      loadingComponent={<ScannerPageSkeleton />}
    >
      <ControleContent typeId={typeId} />
    </RoleRouteGuard>
  );
}
