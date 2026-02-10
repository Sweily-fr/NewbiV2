// Auth templates
import { reactivation } from "./auth/reactivation.js";
import { twoFactor } from "./auth/two-factor.js";
import { resetPassword } from "./auth/reset-password.js";
import { emailVerification } from "./auth/email-verification.js";

// Organization templates
import { organizationInvitation } from "./organization/invitation.js";
import { memberJoinedNotificationOwner } from "./organization/member-joined-owner.js";
import { memberJoinedConfirmation } from "./organization/member-joined-confirmation.js";
import { memberJoinedNotificationInviter } from "./organization/member-joined-inviter.js";

// Subscription templates
import { subscriptionChanged } from "./subscription/changed.js";
import { subscriptionCreated } from "./subscription/created.js";
import { subscriptionCancelled } from "./subscription/cancelled.js";
import { renewalReminder } from "./subscription/renewal-reminder.js";
import { trialStarted } from "./subscription/trial-started.js";
import { trialEnding } from "./subscription/trial-ending.js";

// Payment templates
import { paymentSucceeded } from "./payment/succeeded.js";
import { paymentFailed } from "./payment/failed.js";

// Invoice templates
import { invoicePaymentReceived } from "./invoice/payment-received.js";

// Seats templates
import { seatLimitWarning } from "./seats/limit-warning.js";
import { additionalSeatAdded } from "./seats/additional-added.js";

// Export all templates as a single object for backward compatibility
export const emailTemplates = {
  // Auth
  reactivation,
  twoFactor,
  resetPassword,
  emailVerification,

  // Organization
  organizationInvitation,
  memberJoinedNotificationOwner,
  memberJoinedConfirmation,
  memberJoinedNotificationInviter,

  // Subscription
  subscriptionChanged,
  subscriptionCreated,
  subscriptionCancelled,
  renewalReminder,
  trialStarted,
  trialEnding,

  // Payment
  paymentSucceeded,
  paymentFailed,

  // Invoice
  invoicePaymentReceived,

  // Seats
  seatLimitWarning,
  additionalSeatAdded,
};

export default emailTemplates;
