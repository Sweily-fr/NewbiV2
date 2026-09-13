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
    scenarioId
    hiddenInScenario
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

// Sans scenarioId : masque en Base (tous les scénarios héritent). Avec :
// surcharge propre au scénario, Base intacte.
export const MUTE_DETECTED_RECURRENCE = gql`
  mutation MuteDetectedRecurrence($id: ID!, $muted: Boolean!, $scenarioId: ID) {
    muteDetectedRecurrence(id: $id, muted: $muted, scenarioId: $scenarioId) {
      id
      isActive
      isMuted
      scenarioOverride
    }
  }
`;

// Masque (ou réaffiche) une saisie manuelle de Base dans un scénario
// uniquement.
export const HIDE_MANUAL_CASHFLOW_ENTRY_IN_SCENARIO = gql`
  ${MANUAL_CASHFLOW_ENTRY_FIELDS}
  mutation HideManualCashflowEntryInScenario(
    $id: ID!
    $scenarioId: ID!
    $hidden: Boolean!
  ) {
    hideManualCashflowEntryInScenario(
      id: $id
      scenarioId: $scenarioId
      hidden: $hidden
    ) {
      ...ManualCashflowEntryFields
    }
  }
`;

// Catégorie de prévision choisie pour une récurrence détectée (null = revenir
// à la catégorie détectée). Commune à tous les scénarios.
export const SET_DETECTED_RECURRENCE_CATEGORY = gql`
  mutation SetDetectedRecurrenceCategory(
    $id: ID!
    $category: ForecastCategory
  ) {
    setDetectedRecurrenceCategory(id: $id, category: $category) {
      id
      category
      categoryOverride
      forecastCategory
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

// Supprime une seule occurrence (un mois) d'une prévision récurrente
// (saisie manuelle ou récurrence détectée) sans affecter les autres mois.
// Avec scenarioId : supprimée dans ce scénario uniquement.
export const EXCLUDE_FORECAST_OCCURRENCE = gql`
  mutation ExcludeForecastOccurrence(
    $kind: ForecastOccurrenceKind!
    $id: ID!
    $month: String!
    $scenarioId: ID
  ) {
    excludeForecastOccurrence(
      kind: $kind
      id: $id
      month: $month
      scenarioId: $scenarioId
    )
  }
`;
