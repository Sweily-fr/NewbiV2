import { gql } from "@apollo/client";

export const UPSERT_TREASURY_FORECAST = gql`
  mutation UpsertTreasuryForecast($input: UpsertTreasuryForecastInput!) {
    upsertTreasuryForecast(input: $input) {
      id
      workspaceId
      month
      category
      type
      forecastAmount
      notes
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_TREASURY_FORECAST = gql`
  mutation DeleteTreasuryForecast($id: ID!) {
    deleteTreasuryForecast(id: $id) {
      success
      message
    }
  }
`;

const MANUAL_CASHFLOW_ENTRY_FIELDS = gql`
  fragment ManualCashflowEntryFields on ManualCashflowEntry {
    id
    workspaceId
    name
    type
    category
    amount
    amountDelta
    amountDeltaType
    startDate
    endDate
    frequency
    notes
    createdAt
    updatedAt
  }
`;

export const UPSERT_MANUAL_CASHFLOW_ENTRY = gql`
  ${MANUAL_CASHFLOW_ENTRY_FIELDS}
  mutation UpsertManualCashflowEntry($input: UpsertManualCashflowEntryInput!) {
    upsertManualCashflowEntry(input: $input) {
      ...ManualCashflowEntryFields
    }
  }
`;

export const DELETE_MANUAL_CASHFLOW_ENTRY = gql`
  mutation DeleteManualCashflowEntry($id: ID!) {
    deleteManualCashflowEntry(id: $id) {
      success
      message
    }
  }
`;

export const UPSERT_FORECAST_SCENARIO = gql`
  mutation UpsertForecastScenario($input: UpsertForecastScenarioInput!) {
    upsertForecastScenario(input: $input) {
      id
      name
      incomeMultiplier
      expenseMultiplier
    }
  }
`;

export const DELETE_FORECAST_SCENARIO = gql`
  mutation DeleteForecastScenario($id: ID!) {
    deleteForecastScenario(id: $id) {
      success
      message
    }
  }
`;

export const MUTE_DETECTED_RECURRENCE = gql`
  mutation MuteDetectedRecurrence($id: ID!, $muted: Boolean!) {
    muteDetectedRecurrence(id: $id, muted: $muted) {
      id
      isActive
      isMuted
    }
  }
`;

export const DELETE_DETECTED_RECURRENCE = gql`
  mutation DeleteDetectedRecurrence($id: ID!) {
    deleteDetectedRecurrence(id: $id) {
      success
      message
    }
  }
`;

export const RUN_RECURRENCE_DETECTION = gql`
  mutation RunRecurrenceDetection($workspaceId: ID) {
    runRecurrenceDetection(workspaceId: $workspaceId)
  }
`;
