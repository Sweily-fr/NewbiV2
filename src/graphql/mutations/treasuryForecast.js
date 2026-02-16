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
