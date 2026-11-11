import { gql } from "@apollo/client";

const VAT_PERIOD_FIELDS = gql`
  fragment VatPeriodFields on VatPeriod {
    key
    label
    form
    start
    end
    dueDate
    isIndicative
    status
    totalToPay
    creditToCarry
    declaredAt
  }
`;

const VAT_OVERVIEW_FIELDS = gql`
  ${VAT_PERIOD_FIELDS}
  fragment VatOverviewFields on VatOverview {
    situation
    legalForm
    regimeLabel
    frequencyLabel
    vatMode
    rhythm
    defaultPeriodKey
    missing {
      code
      label
    }
    periods {
      ...VatPeriodFields
    }
    franchise {
      year
      revenueHT
      servicesThreshold
      servicesUpperThreshold
      goodsThreshold
      goodsUpperThreshold
    }
  }
`;

const VAT_RETURN_FIELDS = gql`
  ${VAT_PERIOD_FIELDS}
  fragment VatReturnFields on VatReturn {
    period {
      ...VatPeriodFields
    }
    vatMode
    isNil
    carriedCredit
    documentCount
    cannotConfirmReason
    declaredByName
    totals {
      grossVat
      deductibleVat
      vatDue
      credit
      refundRequested
      creditToCarry
      assimilatedTaxes
      installmentsPaid
      totalToPay
    }
    sections {
      key
      title
      lines {
        code
        label
        base
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
        label
        amount
      }
    }
    adjustments {
      reverseChargeServicesBase
      intraCommunityAcquisitionsBase
      fixedAssetsVat
      otherDeductibleVat
      vatToRepay
      previousCredit
      refundRequested
      assimilatedTaxes
      installmentsPaid
    }
  }
`;

export const GET_VAT_OVERVIEW = gql`
  ${VAT_OVERVIEW_FIELDS}
  query VatOverview($workspaceId: ID) {
    vatOverview(workspaceId: $workspaceId) {
      ...VatOverviewFields
    }
  }
`;

export const GET_VAT_RETURN = gql`
  ${VAT_RETURN_FIELDS}
  query VatReturn(
    $workspaceId: ID
    $periodKey: String!
    $adjustments: VatReturnAdjustmentsInput
  ) {
    vatReturn(
      workspaceId: $workspaceId
      periodKey: $periodKey
      adjustments: $adjustments
    ) {
      ...VatReturnFields
    }
  }
`;

export const CONFIRM_VAT_DECLARATION = gql`
  ${VAT_RETURN_FIELDS}
  mutation ConfirmVatDeclaration(
    $workspaceId: ID
    $periodKey: String!
    $adjustments: VatReturnAdjustmentsInput
  ) {
    confirmVatDeclaration(
      workspaceId: $workspaceId
      periodKey: $periodKey
      adjustments: $adjustments
    ) {
      ...VatReturnFields
    }
  }
`;

export const CANCEL_VAT_DECLARATION = gql`
  ${VAT_OVERVIEW_FIELDS}
  mutation CancelVatDeclaration($workspaceId: ID, $periodKey: String!) {
    cancelVatDeclaration(workspaceId: $workspaceId, periodKey: $periodKey) {
      ...VatOverviewFields
    }
  }
`;
