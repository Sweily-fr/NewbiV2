import { gql } from "@apollo/client";

export const GET_WORKSPACE_STORAGE = gql`
  query GetWorkspaceStorage($workspaceId: ID) {
    workspaceStorage(workspaceId: $workspaceId) {
      workspaceId
      ready
      plan
      planLabel
      interval
      subscriptionActive
      usedBytes
      quotaBytes
      baseQuotaBytes
      remainingBytes
      percent
      level
      packs
      packBytes
      packSizeBytes
      packMonthlyPrice
      packYearlyPrice
      canViewDetails
      computedAt
      byCategory {
        category
        label
        bytes
      }
      byUser {
        userId
        name
        email
        bytes
      }
      offer {
        neededBytes
        currentMonthlyCost
        recommended
        packs {
          additionalPacks
          totalPacks
          monthlyCost
          extraMonthlyCost
          billedPrice
          interval
          addedBytes
        }
        upgrade {
          plan
          label
          packs
          planMonthlyPrice
          monthlyCost
          quotaBytes
        }
      }
    }
  }
`;
