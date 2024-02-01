import { FindManyOptions } from 'typeorm';

export interface IFilterRequest {
  search_value?: string;
  page_size?: number;
  page?: number;
  orders?: TOrderTuple[];
}

export interface IFilterResponse {
  filter: IFilterRequest;
  total_count: number;
}

export interface IPagingResult<T> {
  page_info: IFilterResponse;
  data: T[];
}

export type TOrderTuple = [string, 'ASC' | 'DESC'];

export interface IListOptions<EntityType> {
  options?: FindManyOptions<EntityType>;
  search_value?: string;
  orders?: TOrderTuple[];
}

export interface IListWithPagingOptions<EntityType> extends IListOptions<EntityType> {
  page?: number;
  page_size?: number;
}

export interface IGetResponse<T> {
  data: T;
}

export interface IDateRangeFilter {
  start_date: Date;
  end_date: Date;
}
