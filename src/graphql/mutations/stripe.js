import { gql } from "@apollo/client";

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
  mutation GenerateStripeOnboardingLink(
    $accountId: String!
    $returnUrl: String!
  ) {
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

// Créer une session de paiement pour un transfert de fichiers, sur le
// compte du vendeur : provider « stripe » (carte, par défaut), « paypal » ou
// « sumup » (carte, compte SumUp du vendeur). sessionUrl : page de paiement
// du prestataire à ouvrir.
export const CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER = gql`
  mutation CreatePaymentSessionForFileTransfer(
    $transferId: ID!
    $accessKey: String
    $provider: String
  ) {
    createPaymentSessionForFileTransfer(
      transferId: $transferId
      accessKey: $accessKey
      provider: $provider
    ) {
      success
      message
      sessionId
      sessionUrl
    }
  }
`;

// Retour de la page de paiement (Stripe, PayPal ou SumUp) : l'API vérifie
// le paiement auprès du prestataire et rend le lien du transfert.
// status : paid | pending | unpaid
export const CONFIRM_TRANSFER_PAYMENT = gql`
  mutation ConfirmTransferPayment(
    $token: String!
    $provider: String
    $sessionId: String
    $orderId: String
  ) {
    confirmTransferPayment(
      token: $token
      provider: $provider
      sessionId: $sessionId
      orderId: $orderId
    ) {
      success
      message
      status
      shareLink
      accessKey
    }
  }
`;

// Ancien format de retour (sessions ouvertes avant la vérification au
// retour) : jeton à usage unique qui rend le lien du transfert
export const CONSUME_PAYMENT_RETURN_TOKEN = gql`
  mutation ConsumePaymentReturnToken($token: String!) {
    consumePaymentReturnToken(token: $token) {
      success
      message
      shareLink
      accessKey
      paymentStatus
    }
  }
`;

// Page publique : le destinataire annonce avoir fait le virement (« J'ai
// fait le virement », protégé par la clé d'accès du lien) et peut laisser
// son adresse pour recevoir le lien au déblocage. cancel: true retire
// l'annonce. Tant que le virement est annoncé, la carte et PayPal ne sont
// plus proposés (createPaymentSessionForFileTransfer refuse).
export const DECLARE_TRANSFER_BANK_PAYMENT = gql`
  mutation DeclareTransferBankPayment(
    $transferId: ID!
    $accessKey: String!
    $email: String
    $cancel: Boolean
  ) {
    declareTransferBankPayment(
      transferId: $transferId
      accessKey: $accessKey
      email: $email
      cancel: $cancel
    ) {
      success
      message
      declaredAt
      notifyEmailHint
    }
  }
`;

// Moyens d'encaissement de l'espace actif : compte Stripe du vendeur,
// compte PayPal, compte SumUp, IBAN de l'entreprise pour les virements
export const GET_PAYMENT_CONNECTIONS = gql`
  query PaymentConnections {
    paymentConnections {
      stripe {
        connected
        ready
        legacy
        oauthAvailable
        chargesEnabled
        displayName
        accountEmail
      }
      paypal {
        available
        connected
        email
      }
      sumup {
        # Connexion SumUp proposée par Newbi et ouverte à l'espace
        available
        connected
        # Accès retiré ou expiré côté SumUp : compte à reconnecter
        needsReconnect
        businessName
        email
        merchantCode
        # Devise du compte marchand : seule devise encaissable par SumUp
        currency
      }
      bankTransfer {
        available
        ibanLast4
        # Compte bancaire relié à Newbi : le virement reçu débloque le
        # transfert tout seul
        autoDetect
      }
    }
  }
`;

// Même question sans SumUp : relue quand l'API n'a pas encore SumUp (site
// mis en ligne avant elle), pour garder Stripe, PayPal et le virement
export const GET_PAYMENT_CONNECTIONS_LEGACY = gql`
  query PaymentConnectionsLegacy {
    paymentConnections {
      stripe {
        connected
        ready
        legacy
        oauthAvailable
        chargesEnabled
        displayName
        accountEmail
      }
      paypal {
        available
        connected
        email
      }
      bankTransfer {
        available
        ibanLast4
        autoDetect
      }
    }
  }
`;

// Connecter le compte PayPal Business de l'espace (adresse e-mail du compte)
export const CONNECT_PAYPAL = gql`
  mutation ConnectPaypal($email: String!) {
    connectPaypal(email: $email) {
      success
      message
      email
    }
  }
`;

export const DISCONNECT_PAYPAL = gql`
  mutation DisconnectPaypal {
    disconnectPaypal {
      success
      message
      email
    }
  }
`;

// Déconnecter le compte SumUp de l'espace (la connexion se fait par OAuth,
// voir requestSumupOAuthUrl)
export const DISCONNECT_SUMUP = gql`
  mutation DisconnectSumup {
    disconnectSumup {
      success
      message
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
      # « oauth » : compte Stripe du client (paiements directs) ;
      # « express » : ancien mode (paiements via le compte de Newbi)
      connectionType
      displayName
      accountEmail
      createdAt
      updatedAt
    }
  }
`;

// Générer un lien de connexion au tableau de bord Stripe
export const GENERATE_STRIPE_DASHBOARD_LINK = gql`
  mutation GenerateStripeDashboardLink($accountId: String!) {
    generateStripeDashboardLink(accountId: $accountId) {
      success
      message
      url
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
