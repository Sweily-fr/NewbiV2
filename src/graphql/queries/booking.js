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
    kind
    startAt
    endAt
    details
    coverImageUrl
    imageUrl
    capacity
    seatsTaken
    seatsLeft
    maxPerOrder
    registrationClosesAt
    price {
      amount
      currency
    }
    registrationsCount
    ticketsCount
    checkedInCount
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

// --- Billetterie (types « Événement ») -------------------------------------

export const EVENT_TICKET_FIELDS = gql`
  fragment EventTicketFields on EventTicket {
    id
    number
    attendeeName
    checkedInAt
    checkedInBy
  }
`;

export const EVENT_REGISTRATION_FIELDS = gql`
  fragment EventRegistrationFields on EventRegistration {
    id
    appointmentTypeId
    eventName
    eventStartAt
    eventEndAt
    buyer {
      firstName
      lastName
      email
      phone
      timezone
    }
    quantity
    amount
    currency
    status
    paymentProvider
    paidAt
    expiresAt
    cancelledBy
    cancelledAt
    cancelReason
    refundedAt
    refundFailed
    clientId
    tickets {
      ...EventTicketFields
    }
    checkedInCount
    createdAt
  }
  ${EVENT_TICKET_FIELDS}
`;

// search : nom, e-mail ou numéro de billet ; status absent = toutes sauf
// EXPIRED ; tri : plus récentes d'abord
export const GET_EVENT_REGISTRATIONS = gql`
  query EventRegistrations(
    $workspaceId: ID
    $typeId: ID!
    $search: String
    $status: EventRegistrationStatus
    $limit: Int
    $offset: Int
  ) {
    eventRegistrations(
      workspaceId: $workspaceId
      typeId: $typeId
      search: $search
      status: $status
      limit: $limit
      offset: $offset
    ) {
      items {
        ...EventRegistrationFields
      }
      totalCount
    }
  }
  ${EVENT_REGISTRATION_FIELDS}
`;

// CSV (séparateur ;, UTF-8 avec BOM, une ligne par billet confirmé)
export const GET_EVENT_REGISTRATIONS_CSV = gql`
  query EventRegistrationsCsv($workspaceId: ID, $typeId: ID!) {
    eventRegistrationsCsv(workspaceId: $workspaceId, typeId: $typeId)
  }
`;

// Moyens de paiement en ligne prêts : sous-ensemble de stripe, paypal, sumup
export const GET_EVENT_PAYMENT_METHODS = gql`
  query EventPaymentMethods($workspaceId: ID) {
    eventPaymentMethods(workspaceId: $workspaceId)
  }
`;
