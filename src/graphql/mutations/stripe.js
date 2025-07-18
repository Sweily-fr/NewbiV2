import { gql } from '@apollo/client';

// Créer un compte Stripe Connect
export const CREATE_STRIPE_CONNECT_ACCOUNT = gql`
  mutation CreateStripeConnectAccount {
    createStripeConnectAccount {
      success
      message
      accountId
    }
  }
`;

// Générer un lien d'onboarding Stripe
export const GENERATE_STRIPE_ONBOARDING_LINK = gql`
  mutation GenerateStripeOnboardingLink($accountId: String!, $returnUrl: String!) {
    generateStripeOnboardingLink(accountId: $accountId, returnUrl: $returnUrl) {
      success
      message
      url
    }
  }
`;

// Vérifier le statut du compte Stripe Connect
export const CHECK_STRIPE_CONNECT_ACCOUNT_STATUS = gql`
  mutation CheckStripeConnectAccountStatus($accountId: String!) {
    checkStripeConnectAccountStatus(accountId: $accountId) {
      success
      message
      isOnboarded
      chargesEnabled
      payoutsEnabled
      accountStatus
    }
  }
`;

// Créer une session de paiement pour un transfert de fichiers
export const CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER = gql`
  mutation CreatePaymentSessionForFileTransfer($transferId: ID!) {
    createPaymentSessionForFileTransfer(transferId: $transferId) {
      success
      message
      sessionId
      sessionUrl
    }
  }
`;

// Récupérer le compte Stripe Connect de l'utilisateur (query)
export const MY_STRIPE_CONNECT_ACCOUNT = gql`
  query MyStripeConnectAccount {
    myStripeConnectAccount {
      id
      userId
      accountId
      isOnboarded
      chargesEnabled
      payoutsEnabled
      createdAt
      updatedAt
    }
  }
`;

// Déconnecter le compte Stripe Connect
export const DISCONNECT_STRIPE_ACCOUNT = gql`
  mutation DisconnectStripeAccount {
    disconnectStripe {
      success
      message
    }
  }
`;
