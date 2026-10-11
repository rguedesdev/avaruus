import { GraphQLError } from "graphql";

type ErrorCode =
  | "BAD_USER_INPUT"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PRECONDITION_FAILED";

const graphQLError = (message: string, code: ErrorCode) =>
  new GraphQLError(message, { extensions: { code } });

export { graphQLError };
