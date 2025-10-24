import { gql } from '@apollo/client';

export const CREATE_COMMUNITY_SUGGESTION = gql`
  mutation CreateCommunitySuggestion($input: CreateSuggestionInput!) {
    createCommunitySuggestion(input: $input) {
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
      createdAt
    }
  }
`;

export const UPDATE_COMMUNITY_SUGGESTION = gql`
  mutation UpdateCommunitySuggestion($id: ID!, $input: UpdateSuggestionInput!) {
    updateCommunitySuggestion(id: $id, input: $input) {
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
      updatedAt
    }
  }
`;

export const DELETE_COMMUNITY_SUGGESTION = gql`
  mutation DeleteCommunitySuggestion($id: ID!) {
    deleteCommunitySuggestion(id: $id)
  }
`;

export const VOTE_COMMUNITY_SUGGESTION = gql`
  mutation VoteCommunitySuggestion($id: ID!, $voteType: VoteType!) {
    voteCommunitySuggestion(id: $id, voteType: $voteType) {
      id
      upvoteCount
      downvoteCount
      netScore
      userVote
    }
  }
`;

export const VALIDATE_COMMUNITY_SUGGESTION = gql`
  mutation ValidateCommunitySuggestion($id: ID!) {
    validateCommunitySuggestion(id: $id) {
      id
      status
      validationCount
      userHasValidated
      validatedAt
    }
  }
`;

export const UNVALIDATE_COMMUNITY_SUGGESTION = gql`
  mutation UnvalidateCommunitySuggestion($id: ID!) {
    unvalidateCommunitySuggestion(id: $id) {
      id
      status
      validationCount
      userHasValidated
    }
  }
`;
