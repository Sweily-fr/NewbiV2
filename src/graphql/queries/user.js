import { gql } from "@apollo/client";

export const LOOKUP_USERS_BY_EMAILS = gql`
  query LookupUsersByEmails($emails: [String!]!) {
    lookupUsersByEmails(emails: $emails) {
      email
      name
      image
    }
  }
`;
