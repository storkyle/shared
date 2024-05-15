/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from 'pino';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ILike,
  ObjectLiteral,
  Repository,
} from 'typeorm';

// *INFO: internal modules
import { DEFAULT_ORDER, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, SYSTEM_ACTOR } from '@constants';
import { ERecordStatus } from '@enum';
import {
  ActorType,
  IListOptions,
  IListWithPagingOptions,
  IPagingResult,
  TOrderTuple,
} from '@interfaces';
import { formatDate, trimData } from '@utilities';

type TSaveMode = 'create' | 'edit';

const getActorId = (actor: ActorType): string | number | undefined => {
  if (actor === SYSTEM_ACTOR) {
    return undefined;
  }

  return actor;
};

const getValidPageSize = (pageSize: number = DEFAULT_PAGE_SIZE): number => {
  const positivePageSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  return Math.min(positivePageSize, MAX_PAGE_SIZE);
};

/**
 * @description Abstract class for repository, which contains common methods for all repositories
 *
 */
export class BaseRepo<EntityType extends ObjectLiteral> {
  protected repository: Repository<EntityType>;
  protected _allow_field_search: string[];
  private entity: EntityTarget<EntityType>;
  private logger: Logger<never> | Console;

  constructor(props: {
    dataSource: DataSource;
    entity: EntityTarget<EntityType>;
    allowSearchFields: string[];
    logger?: Logger<never> | Console;
  }) {
    this.repository = props.dataSource.getRepository(props.entity);
    this._allow_field_search = props.allowSearchFields ?? [];
    this.entity = props.entity;
    this.logger = props.logger ?? console;
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
    page_size = DEFAULT_PAGE_SIZE,
    orders = DEFAULT_ORDER,
  }: IListWithPagingOptions<EntityType>): Promise<IPagingResult<EntityType>> {
    const currentPageSize = getValidPageSize(page_size);

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
    orders = DEFAULT_ORDER,
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

  public generateConditionGetList({
    searchValue,
    options,
    orders,
  }: {
    searchValue?: string;
    options: FindManyOptions<EntityType>;
    orders?: TOrderTuple[];
  }): FindOneOptions<EntityType> {
    const conditionsSearch: any[] = [];
    const conditions: any = {
      order: this._generateOrderConditions(orders ?? DEFAULT_ORDER),
      ...options,
    };
    const currentWhere = !Array.isArray(options.where) ? [options.where] : options.where ?? [];
    const currentWhereWithSearch: any[] = [];

    if (searchValue) {
      this._allow_field_search.forEach((field) => {
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

  private async _customSave(
    entityPayload: EntityType | EntityType[],
    actor: ActorType,
    saveMode: TSaveMode,
    manager?: EntityManager
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

    if (manager) {
      return manager.save(formattedPayload);
    }

    return this.repository.save(formattedPayload);
  }

  private async _save(
    entityPayload: EntityType | EntityType[],
    actor: ActorType,
    saveMode: TSaveMode
  ): Promise<EntityType | EntityType[] | null> {
    return this._customSave(entityPayload, actor, saveMode);
  }

  private async _saveWithTransaction(
    entityPayload: EntityType | EntityType[],
    actor: ActorType,
    saveMode: TSaveMode,
    entityManager: EntityManager
  ): Promise<EntityType | EntityType[] | null> {
    return this._customSave(entityPayload, actor, saveMode, entityManager);
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
    return this._saveWithTransaction(entityPayload, actor, 'create', entityManager);
  }

  public async editWithTransaction(
    entityPayload: EntityType | EntityType[],
    actor: ActorType,
    entityManager: EntityManager
  ): Promise<EntityType | EntityType[] | null> {
    return this._saveWithTransaction(entityPayload, actor, 'edit', entityManager);
  }

  public async edit(
    entityPayload: EntityType | EntityType[],
    actor: ActorType
  ): Promise<EntityType | EntityType[] | null> {
    return this._save(entityPayload, actor, 'edit');
  }

  private async _customSetStatus<T = ERecordStatus>(
    criteria: string | string[] | number | number[] | FindOptionsWhere<EntityType>,
    status: T,
    actor: ActorType,
    manager?: EntityManager
  ) {
    const formattedPayload = this.formatPayload({ status, updater: getActorId(actor) } as any);

    let response;
    if (manager) {
      response = await manager.update(this.entity, criteria, formattedPayload);
    } else {
      response = await this.repository.update(criteria, formattedPayload);
    }

    const { affected = 0 } = response;

    return affected > 0;
  }

  public async setStatus<T = ERecordStatus>(
    criteria: string | string[] | number | number[] | FindOptionsWhere<EntityType>,
    status: T,
    actor: ActorType
  ): Promise<boolean> {
    return this._customSetStatus(criteria, status, actor);
  }

  public async setStatusWithTransaction<T = ERecordStatus>(
    criteria: string | string[] | number | number[] | FindOptionsWhere<EntityType>,
    status: T,
    actor: ActorType,
    manager: EntityManager
  ): Promise<boolean> {
    return this._customSetStatus(criteria, status, actor, manager);
  }

  private async _customRemove(
    criteria: string | string[] | number | number[] | FindOptionsWhere<EntityType>,
    actor: ActorType,
    manager?: EntityManager
  ): Promise<boolean> {
    const formattedPayload = this.formatPayload({
      removed: true,
      removed_at: formatDate(new Date()),
      remover: getActorId(actor),
    } as any);

    let response;

    if (manager) {
      response = await manager.update(this.entity, criteria, formattedPayload);
    } else {
      response = await this.repository.update(criteria, formattedPayload);
    }

    const { affected = 0 } = response;

    return affected > 0;
  }

  public async remove(
    criteria: string | string[] | number | number[] | FindOptionsWhere<EntityType>,
    actor: ActorType
  ): Promise<boolean> {
    return this._customRemove(criteria, actor);
  }

  public async removeWithTransaction(
    criteria: string | string[] | number | number[] | FindOptionsWhere<EntityType>,
    actor: ActorType,
    manager: EntityManager
  ): Promise<boolean> {
    return this._customRemove(criteria, actor, manager);
  }

  public async destroy(id: string | number): Promise<boolean> {
    try {
      const r = await this.repository.delete(id);
      return !!r.affected;
    } catch (error) {
      this.logger.error('destroyRecord', { error, payload: { id } });
      return false;
    }
  }

  public buildEntity(deepPartial: DeepPartial<EntityType>): EntityType;
  public buildEntity(deepPartial: DeepPartial<EntityType>[]): EntityType[];
  public buildEntity(deepPartial: any): EntityType | EntityType[] {
    return this.repository.create(deepPartial);
  }
}
