import { gql } from "@apollo/client";

// Prise de rendez-vous (Communication) : page de réservation de
// l'utilisateur dans l'espace actif, ses types de rendez-vous et ses
// réservations. Chaque utilisateur ne voit que les siens (filtre de l'API).

export const BOOKING_PAGE_FIELDS = gql`
  fragment BookingPageFields on BookingPage {
    id
    slug
    title
    description
    accentColor
    avatarUrl
    timezone
    isActive
    availability {
      dayOfWeek
      intervals {
        start
        end
      }
    }
    dateOverrides {
      date
      intervals {
        start
        end
      }
    }
    writeConnectionId
    busyConnectionIds
    publicUrl
    createdAt
    updatedAt
  }
`;

export const APPOINTMENT_TYPE_FIELDS = gql`
  fragment AppointmentTypeFields on AppointmentType {
    id
    slug
    name
    description
    durationMinutes
    slotIntervalMinutes
    location {
      kind
      value
    }
    bufferBeforeMinutes
    bufferAfterMinutes
    minNoticeMinutes
    maxDaysAhead
    maxPerDay
    color
    position
    isActive
    requirePhone
    publicUrl
    upcomingCount
  }
`;

export const BOOKING_FIELDS = gql`
  fragment BookingFields on Booking {
    id
    appointmentTypeId
    typeName
    durationMinutes
    location {
      kind
      value
    }
    startAt
    endAt
    status
    guest {
      firstName
      lastName
      email
      phone
      message
      timezone
    }
    meetingUrl
    meetingWarning
    cancelledBy
    cancelReason
    cancelledAt
    clientId
    eventId
    createdAt
  }
`;

export const GET_MY_BOOKING_PAGE = gql`
  query MyBookingPage($workspaceId: ID) {
    myBookingPage(workspaceId: $workspaceId) {
      ...BookingPageFields
    }
  }
  ${BOOKING_PAGE_FIELDS}
`;

export const GET_APPOINTMENT_TYPES = gql`
  query AppointmentTypes($workspaceId: ID) {
    appointmentTypes(workspaceId: $workspaceId) {
      ...AppointmentTypeFields
    }
  }
  ${APPOINTMENT_TYPE_FIELDS}
`;

// scope : "upcoming" (défaut, tri croissant), "past" (tri décroissant), "all"
export const GET_BOOKINGS = gql`
  query Bookings(
    $workspaceId: ID
    $scope: String
    $status: BookingStatus
    $limit: Int
    $offset: Int
  ) {
    bookings(
      workspaceId: $workspaceId
      scope: $scope
      status: $status
      limit: $limit
      offset: $offset
    ) {
      items {
        ...BookingFields
      }
      totalCount
    }
  }
  ${BOOKING_FIELDS}
`;

export const GET_BOOKING = gql`
  query Booking($id: ID!, $workspaceId: ID) {
    booking(id: $id, workspaceId: $workspaceId) {
      ...BookingFields
    }
  }
  ${BOOKING_FIELDS}
`;

export const BOOKING_SLUG_AVAILABLE = gql`
  query BookingSlugAvailable($slug: String!, $workspaceId: ID) {
    bookingSlugAvailable(slug: $slug, workspaceId: $workspaceId)
  }
`;
