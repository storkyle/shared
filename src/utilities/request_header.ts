import { Request } from 'express';

export const getAcceptLanguageFromHeader = (req: Request) => {
  if (req.headers['accept-language']?.includes('en')) return 'en';
  if (req.headers['accept-language']?.includes('vi')) return 'vi';
  return 'vi';
};
