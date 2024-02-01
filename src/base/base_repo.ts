/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ILike,
  ObjectLiteral,
  Repository,
} from 'typeorm';

// *INFO: Internal modules
import { DEFAULT_ORDER, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants';
import { ERecordStatus } from '../enum';
import {
  ActorType,
  IListOptions,
  IListWithPagingOptions,
  IPagingResult,
  TOrderTuple,
} from '../interfaces';
import { formatDate, trimData } from '../utilities';

type TSaveMode = 'create' | 'edit';

const SYSTEM_ACTOR_KEY = 'system';

const getActorId = (actor: ActorType): string | number | undefined => {
  if (actor === SYSTEM_ACTOR_KEY) {
    return undefined;
  }

  return actor;
};
interface IRepoOptions {
  defaultOrder: TOrderTuple[];
  defaultPageSize: number;
  defaultMaxPageSize: number;
}

interface IProps<EntityType extends ObjectLiteral> {
  repository: Repository<EntityType>;
  allow_field_search?: string[];
  options?: Partial<IRepoOptions>;
}

/**
 * @description Abstract class for repository, which contains common methods for all repositories
 */
export class BaseRepo<EntityType extends ObjectLiteral> {
  protected options: IRepoOptions;
  protected repository: Repository<EntityType>;
  protected allow_field_search: string[] = [];

  constructor({ repository, options, allow_field_search }: IProps<EntityType>) {
    this.repository = repository;
    this.allow_field_search = allow_field_search ?? [];
    this.options = Object.assign(
      {
        defaultOrder: DEFAULT_ORDER,
        defaultPageSize: DEFAULT_PAGE_SIZE,
        defaultMaxPageSize: MAX_PAGE_SIZE,
      },
      options
    );
  }

  public getRepo(): Repository<EntityType> {
    return this.repository;
  }

  protected generateTrueWhereConditions(
    where?: FindOptionsWhere<EntityType>[] | FindOptionsWhere<EntityType>
  ): FindOptionsWhere<EntityType>[] | FindOptionsWhere<EntityType> {
    const DEFAULT_WHERE: any[] = [{ removed: false }];

    if (!where || (Array.isArray(where) && where.length === 0)) {
      return DEFAULT_WHERE;
    }

    const currentWhere = !Array.isArray(where) ? [where] : where;

    return currentWhere.map((el) => ({ ...el, removed: false })) as any;
  }

  protected formatPayload(payload: DeepPartial<EntityType>): EntityType {
    let formatted: any = { ...payload };
    for (const key in formatted) {
      if (formatted[key] === undefined) {
        delete formatted[key];
      }
      if (formatted[key] instanceof Date) {
        formatted[key] = formatDate(formatted[key]);
      }
    }
    formatted = trimData(formatted);

    return formatted;
  }

  public async detail(options: FindOneOptions<EntityType>): Promise<EntityType | null> {
    return this.repository.findOne({
      ...options,
      where: this.generateTrueWhereConditions(options.where),
    });
  }

  public async listWithPaging({
    options = {},
    search_value,
    page = 0,
    page_size = this.options.defaultPageSize!,
    orders = this.options.defaultOrder,
  }: IListWithPagingOptions<EntityType>): Promise<IPagingResult<EntityType>> {
    const currentPageSize = Math.min(page_size, this.options.defaultMaxPageSize!);

    const conditions: any = {
      skip: page * currentPageSize,
      take: currentPageSize,
      ...this.generateConditionGetList({ searchValue: search_value, options, orders }),
    };

    const [data, totalCount] = await this.repository.findAndCount(conditions);

    return {
      data,
      page_info: {
        filter: { page, page_size: currentPageSize, search_value },
        total_count: totalCount,
      },
    };
  }

  public async list({
    options = {},
    search_value,
    orders = this.options.defaultOrder,
  }: IListOptions<EntityType>): Promise<EntityType[]> {
    const conditions: any = this.generateConditionGetList({
      searchValue: search_value,
      options: options,
      orders,
    });

    return this.repository.find(conditions);
  }

  private _generateOrderConditions = (orders: TOrderTuple[]) => {
    const orderConditions: any = {};
    const listFields = this.repository.metadata.columns.map((el) => el.propertyName);

    orders.forEach(([field, order]) => {
      if (!listFields.includes(field)) {
        return;
      }
      orderConditions[field] = order;
    });
    return orderConditions;
  };

  private generateConditionGetList({
    searchValue,
    options,
    orders,
  }: {
    searchValue?: string;
    options: FindManyOptions<EntityType>;
    orders?: TOrderTuple[];
  }) {
    const conditionsSearch: any[] = [];
    const conditions: any = {
      order: this._generateOrderConditions(orders ?? this.options.defaultOrder!),
      ...options,
    };
    const currentWhere = !Array.isArray(options.where) ? [options.where] : options.where ?? [];
    const currentWhereWithSearch: any[] = [];

    if (searchValue) {
      this.allow_field_search.forEach((field) => {
        conditionsSearch.push({ [field]: ILike(`%${searchValue}%`) });
      });

      currentWhere.forEach((el) => {
        conditionsSearch.forEach((s) => {
          currentWhereWithSearch.push({ ...el, ...s });
        });
      });
      conditions.where = this.generateTrueWhereConditions(currentWhereWithSearch);
    } else {
      conditions.where = this.generateTrueWhereConditions(currentWhere as any[]);
    }

    return conditions;
  }

  private async _save(
    entityPayload: EntityType | EntityType[],
    actor: ActorType,
    saveMode: TSaveMode
  ): Promise<EntityType | EntityType[] | null> {
    const actorId = getActorId(actor);
    let formattedPayload: any;
    const actorField = saveMode === 'create' ? 'creator' : 'updater';

    const formatWithRelationship = (payload: EntityType) => {
      return Object.assign(payload, {
        ...this.formatPayload(payload as any),
        [actorField]: actorId,
      });
    };

    if (entityPayload instanceof Array) {
      formattedPayload = entityPayload.map((el) => {
        return formatWithRelationship(el);
      });
    } else {
      formattedPayload = formatWithRelationship(entityPayload);
    }

    return this.repository.save(formattedPayload);
  }

  public async create(
    entityPayload: EntityType | EntityType[],
    actor: ActorType
  ): Promise<EntityType | EntityType[] | null> {
    return this._save(entityPayload, actor, 'create');
  }

  public async createWithTransaction(
    entityPayload: EntityType | EntityType[],
    actor: ActorType,
    entityManager: EntityManager
  ): Promise<EntityType | EntityType[] | null> {
    const actorId = getActorId(actor);
    let formattedPayload: any;

    const formatWithRelationship = (payload: EntityType) => {
      return Object.assign(payload, {
        ...this.formatPayload(payload as any),
        creator: actorId,
      });
    };

    if (entityPayload instanceof Array) {
      formattedPayload = entityPayload.map((el) => {
        return formatWithRelationship(el);
      });
    } else {
      formattedPayload = formatWithRelationship(entityPayload);
    }

    return entityManager.save(formattedPayload);
  }

  public async edit(
    entityPayload: EntityType | EntityType[],
    actor: ActorType
  ): Promise<EntityType | EntityType[] | null> {
    return this._save(entityPayload, actor, 'edit');
  }

  public async setStatus<T = ERecordStatus>(
    criteria: string | string[] | number | number[] | FindOptionsWhere<EntityType>,
    status: T,
    actor: ActorType
  ): Promise<boolean> {
    const { affected = 0 } = await this.repository.update(
      criteria,
      this.formatPayload({ status, updater: getActorId(actor) } as any)
    );

    return affected > 0;
  }

  public async remove(
    criteria: string | string[] | number | number[] | FindOptionsWhere<EntityType>,
    actor: ActorType
  ): Promise<boolean> {
    const { affected = 0 } = await this.repository.update(
      criteria,
      this.formatPayload({
        removed: true,
        removed_at: formatDate(new Date()),
        remover: getActorId(actor),
      } as any)
    );

    return affected > 0;
  }

  public async destroy(id: string | number): Promise<boolean> {
    const r = await this.repository.delete(id);
    return !!r.affected;
  }

  public buildEntity(deepPartial: DeepPartial<EntityType>): EntityType;
  public buildEntity(deepPartial: DeepPartial<EntityType>[]): EntityType[];
  public buildEntity(deepPartial: any): EntityType | EntityType[] {
    return this.repository.create(deepPartial);
  }
}
