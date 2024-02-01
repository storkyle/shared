export enum EErrorCode {
  DATA_ERROR = 'DATA_ERROR',
  UNAUTHENTICATED = 'UNAUTHENTICATED', // <-- Server don't know who you are
  FORBIDDEN = 'FORBIDDEN', // <-- Server know who you are, but you don't have permission to access this resource
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST', // <-- Client send a bad request

  // *INFO: Gateway is a service that handle all request from client
  // *INFO: Gateway will check token, and forward request to micro service
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // *INFO: GraphQL built-in error code
  GRAPHQL_PARSE_FAILED = 'GRAPHQL_PARSE_FAILED',
  GRAPHQL_VALIDATION_FAILED = 'GRAPHQL_VALIDATION_FAILED',
  BAD_USER_INPUT = 'BAD_USER_INPUT',
}
