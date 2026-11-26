import { gql } from "@apollo/client";
import {
  APPOINTMENT_TYPE_FIELDS,
  BOOKING_FIELDS,
  BOOKING_PAGE_FIELDS,
  EVENT_REGISTRATION_FIELDS,
  EVENT_TICKET_FIELDS,
} from "@/src/graphql/queries/booking";

// Premier appel = création de la page (slug obligatoire) : l'API crée aussi
// un type par défaut « Rendez-vous de 30 min »
export const UPSERT_BOOKING_PAGE = gql`
  mutation UpsertBookingPage($workspaceId: ID, $input: BookingPageInput!) {
    upsertBookingPage(workspaceId: $workspaceId, input: $input) {
      ...BookingPageFields
    }
  }
  ${BOOKING_PAGE_FIELDS}
`;

export const CREATE_APPOINTMENT_TYPE = gql`
  mutation CreateAppointmentType(
    $workspaceId: ID
    $input: AppointmentTypeInput!
  ) {
    createAppointmentType(workspaceId: $workspaceId, input: $input) {
      ...AppointmentTypeFields
    }
  }
  ${APPOINTMENT_TYPE_FIELDS}
`;

export const UPDATE_APPOINTMENT_TYPE = gql`
  mutation UpdateAppointmentType(
    $id: ID!
    $workspaceId: ID
    $input: AppointmentTypeInput!
  ) {
    updateAppointmentType(id: $id, workspaceId: $workspaceId, input: $input) {
      ...AppointmentTypeFields
    }
  }
  ${APPOINTMENT_TYPE_FIELDS}
`;

// Autorisée même avec des réservations à venir (elles gardent leur
// instantané du type)
export const DELETE_APPOINTMENT_TYPE = gql`
  mutation DeleteAppointmentType($id: ID!, $workspaceId: ID) {
    deleteAppointmentType(id: $id, workspaceId: $workspaceId)
  }
`;

export const CANCEL_BOOKING = gql`
  mutation CancelBooking($id: ID!, $workspaceId: ID, $reason: String) {
    cancelBooking(id: $id, workspaceId: $workspaceId, reason: $reason) {
      ...BookingFields
    }
  }
  ${BOOKING_FIELDS}
`;

// --- Billetterie ------------------------------------------------------------

// kind : COVER (image de fond) ou IMAGE (image de l'événement). L'URL
// renvoyée va ensuite dans coverImageUrl / imageUrl du type. Échec :
// { success: false, message } sans exception
export const UPLOAD_APPOINTMENT_EVENT_IMAGE = gql`
  mutation UploadAppointmentEventImage(
    $workspaceId: ID
    $file: Upload!
    $kind: EventImageKind!
  ) {
    uploadAppointmentEventImage(
      workspaceId: $workspaceId
      file: $file
      kind: $kind
    ) {
      success
      url
      message
    }
  }
`;

// Places rendues, e-mail au participant ; pas de remboursement automatique
export const CANCEL_EVENT_REGISTRATION = gql`
  mutation CancelEventRegistration(
    $id: ID!
    $workspaceId: ID
    $reason: String
  ) {
    cancelEventRegistration(
      id: $id
      workspaceId: $workspaceId
      reason: $reason
    ) {
      ...EventRegistrationFields
    }
  }
  ${EVENT_REGISTRATION_FIELDS}
`;

// Reste dû sur place réglé (paid: true) ou non : inscription confirmée avec
// un reste dû seulement
export const MARK_EVENT_REGISTRATION_PAID_ON_SITE = gql`
  mutation MarkEventRegistrationPaidOnSite(
    $workspaceId: ID
    $id: ID!
    $paid: Boolean!
  ) {
    markEventRegistrationPaidOnSite(
      workspaceId: $workspaceId
      id: $id
      paid: $paid
    ) {
      ...EventRegistrationFields
    }
  }
  ${EVENT_REGISTRATION_FIELDS}
`;

// code : jeton du QR code, URL du billet ou numéro « EVT-XXXXXX »
export const CHECK_IN_TICKET = gql`
  mutation CheckInTicket($workspaceId: ID, $typeId: ID!, $code: String!) {
    checkInTicket(workspaceId: $workspaceId, typeId: $typeId, code: $code) {
      result
      otherEventName
      ticket {
        ...EventTicketFields
      }
      registration {
        ...EventRegistrationFields
      }
    }
  }
  ${EVENT_REGISTRATION_FIELDS}
`;

export const UNDO_TICKET_CHECK_IN = gql`
  mutation UndoTicketCheckIn($workspaceId: ID, $ticketId: ID!) {
    undoTicketCheckIn(workspaceId: $workspaceId, ticketId: $ticketId) {
      ...EventTicketFields
    }
  }
  ${EVENT_TICKET_FIELDS}
`;
