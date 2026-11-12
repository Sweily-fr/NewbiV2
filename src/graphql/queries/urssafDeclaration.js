import { gql } from "@apollo/client";

const URSSAF_PERIOD_FIELDS = gql`
  fragment UrssafPeriodFields on UrssafPeriod {
    key
    label
    start
    end
    dueDate
    isIndicative
    status
    revenue
    totalToPay
    declaredAt
  }
`;

const URSSAF_OVERVIEW_FIELDS = gql`
  ${URSSAF_PERIOD_FIELDS}
  fragment UrssafOverviewFields on UrssafOverview {
    situation
    legalForm
    frequencyLabel
    activity
    activityLabel
    hasAcre
    acreEndDate
    hasIncomeTaxWithholding
    rhythm
    defaultPeriodKey
    missing {
      code
      label
    }
    estimateMissing {
      code
      label
    }
    periods {
      ...UrssafPeriodFields
    }
  }
`;

const URSSAF_DECLARATION_FIELDS = gql`
  ${URSSAF_PERIOD_FIELDS}
  fragment UrssafDeclarationFields on UrssafDeclaration {
    period {
      ...UrssafPeriodFields
    }
    isNil
    documentCount
    cannotConfirmReason
    declaredByName
    totals {
      revenue
      socialContributions
      trainingContribution
      chamberTax
      incomeTax
      totalToPay
    }
    sections {
      key
      title
      lines {
        key
        label
        base
        rate
        amount
        isTotal
        note
      }
    }
    checks {
      code
      severity
      label
      count
      amount
      documents {
        id
        label
        amount
      }
    }
    adjustments {
      sales
      servicesBic
      servicesBnc
    }
    situation {
      activityLabel
      ratesLabel
      acreApplied
      incomeTaxWithholding
      estimateUnavailableReason
    }
  }
`;

// Les requêtes passent l'espace en argument, comme le reste du site
export const GET_URSSAF_OVERVIEW = gql`
  ${URSSAF_OVERVIEW_FIELDS}
  query UrssafOverview($workspaceId: ID) {
    urssafOverview(workspaceId: $workspaceId) {
      ...UrssafOverviewFields
    }
  }
`;

export const GET_URSSAF_DECLARATION = gql`
  ${URSSAF_DECLARATION_FIELDS}
  query UrssafDeclaration(
    $workspaceId: ID
    $periodKey: String!
    $adjustments: UrssafAdjustmentsInput
  ) {
    urssafDeclaration(
      workspaceId: $workspaceId
      periodKey: $periodKey
      adjustments: $adjustments
    ) {
      ...UrssafDeclarationFields
    }
  }
`;

export const CONFIRM_URSSAF_DECLARATION = gql`
  ${URSSAF_DECLARATION_FIELDS}
  mutation ConfirmUrssafDeclaration(
    $workspaceId: ID
    $periodKey: String!
    $adjustments: UrssafAdjustmentsInput
  ) {
    confirmUrssafDeclaration(
      workspaceId: $workspaceId
      periodKey: $periodKey
      adjustments: $adjustments
    ) {
      ...UrssafDeclarationFields
    }
  }
`;

export const CANCEL_URSSAF_DECLARATION = gql`
  ${URSSAF_OVERVIEW_FIELDS}
  mutation CancelUrssafDeclaration($workspaceId: ID, $periodKey: String!) {
    cancelUrssafDeclaration(workspaceId: $workspaceId, periodKey: $periodKey) {
      ...UrssafOverviewFields
    }
  }
`;
