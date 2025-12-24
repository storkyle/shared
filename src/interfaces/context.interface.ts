import { IncomingMessage, ServerResponse } from 'http';

export interface IContextGraphql {
  req: IncomingMessage;
  res?: ServerResponse<IncomingMessage>;
  internalToken?: string;
  oid?: string;
  sid?: string;
  uid?: string;
  lang?: string;
  timezone?: string; // timezone of the request user
}
