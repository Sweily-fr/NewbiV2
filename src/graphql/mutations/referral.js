import { gql } from "@apollo/client";

export const GENERATE_REFERRAL_CODE = gql`
  mutation GenerateReferralCode {
    generateReferralCode {
      success
      message
      referralCode
      referralLink
    }
  }
`;

export const GENERATE_REFERRAL_LINK = gql`
  mutation GenerateReferralLink {
    generateReferralLink {
      success
      message
      referralCode
      referralLink
    }
  }
`;

export const CHECK_STRIPE_CONNECT_FOR_REFERRAL = gql`
  mutation CheckStripeConnectForReferral {
    checkStripeConnectForReferral {
      success
      message
      isConnected
      canReceivePayments
      onboardingUrl
    }
  }
`;

export const PROCESS_REFERRAL_PAYMENT = gql`
  mutation ProcessReferralPayment($referralId: ID!, $amount: Float!) {
    processReferralPayment(referralId: $referralId, amount: $amount) {
      success
      message
      transferId
    }
  }
`;
