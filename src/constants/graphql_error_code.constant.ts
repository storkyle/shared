import { EErrorCode } from '@enum';

export const ARR_GRAPHQL_ERROR_CODE = [
  EErrorCode.BAD_REQUEST,
  EErrorCode.DATA_ERROR,
  EErrorCode.FORBIDDEN,
  EErrorCode.TOKEN_EXPIRED,
  EErrorCode.UNAUTHENTICATED,

  // *INFO: GraphQL built-in error code
  EErrorCode.GRAPHQL_PARSE_FAILED,
  EErrorCode.GRAPHQL_VALIDATION_FAILED,
  EErrorCode.BAD_USER_INPUT,
];
