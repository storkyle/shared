import { TOrderTuple } from '@interfaces';

export const ISO_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ssZ';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const DEFAULT_ORDER: TOrderTuple[] = [['created_at', 'DESC']];
