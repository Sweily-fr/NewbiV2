import { gql } from "@apollo/client";
import {
  APPOINTMENT_TYPE_FIELDS,
  BOOKING_FIELDS,
  BOOKING_PAGE_FIELDS,
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
