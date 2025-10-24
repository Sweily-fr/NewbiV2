import { gql } from '@apollo/client';

export const GET_COMMUNITY_SUGGESTIONS = gql`
  query GetCommunitySuggestions($type: SuggestionType, $status: SuggestionStatus, $sortBy: String) {
    getCommunitySuggestions(type: $type, status: $status, sortBy: $sortBy) {
      id
      type
      title
      description
      status
      severity
      stepsToReproduce
      upvoteCount
      downvoteCount
      validationCount
      netScore
      userVote
      userHasValidated
      isAnonymous
      createdByUser {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_COMMUNITY_SUGGESTION = gql`
  query GetCommunitySuggestion($id: ID!) {
    getCommunitySuggestion(id: $id) {
      id
      type
      title
      description
      status
      severity
      stepsToReproduce
      upvoteCount
      downvoteCount
      validationCount
      netScore
      userVote
      userHasValidated
      isAnonymous
      createdAt
      updatedAt
    }
  }
`;

export const GET_COMMUNITY_SUGGESTION_STATS = gql`
  query GetCommunitySuggestionStats {
    getCommunitySuggestionStats {
      totalIdeas
      totalBugs
      totalValidated
      totalPending
    }
  }
`;
