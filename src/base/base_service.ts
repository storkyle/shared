/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeepPartial, FindOneOptions, FindOptionsWhere, ObjectLiteral } from 'typeorm';

// *INFO: Internal modules
import { ERecordStatus } from '../enum';
import { ActorType, IListOptions, IListWithPagingOptions, IPagingResult } from '../interfaces';
import { BaseRepo } from './base_repo';

export class BaseService<TypeOfEntity extends ObjectLiteral> {
  protected _repo: BaseRepo<TypeOfEntity>;
  constructor(props: { repository: BaseRepo<TypeOfEntity> }) {
    this._repo = props.repository;
  }

  async createSingle(
    payload: DeepPartial<TypeOfEntity>,
    actor: ActorType
  ): Promise<TypeOfEntity | null> {
    return this._create(payload, actor);
  }

  async createMultiple(
    payload: DeepPartial<TypeOfEntity[]>,
    actor: ActorType
  ): Promise<TypeOfEntity[] | null> {
    return this._create(payload, actor);
  }

  private async _create(
    payload: DeepPartial<TypeOfEntity>,
    actor: ActorType
  ): Promise<TypeOfEntity | null>;
  private async _create(
    payload: DeepPartial<TypeOfEntity[]>,
    actor: ActorType
  ): Promise<TypeOfEntity[] | null>;
  private async _create(
    payload: any,
    actor: ActorType
  ): Promise<TypeOfEntity | TypeOfEntity[] | null> {
    const entity = this._repo.buildEntity(payload);

    return this._repo.create(entity, actor);
  }

  async edit(
    options: FindOneOptions<TypeOfEntity>,
    payload: DeepPartial<TypeOfEntity>,
    actor: ActorType
  ): Promise<TypeOfEntity | null> {
    const entity = await this._repo.detail(options);

    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);

    return this._repo.edit(entity, actor) as Promise<TypeOfEntity | null>;
  }

  async list(payload: IListOptions<TypeOfEntity>): Promise<TypeOfEntity[]> {
    return this._repo.list(payload);
  }

  async listWithPaging(
    payload: IListWithPagingOptions<TypeOfEntity>
  ): Promise<IPagingResult<TypeOfEntity>> {
    return await this._repo.listWithPaging(payload);
  }

  async detail(options: FindOneOptions<TypeOfEntity>): Promise<TypeOfEntity | null> {
    return this._repo.detail(options);
  }

  async setStatus<T = ERecordStatus>(
    criteria: string | string[] | number | number[] | FindOptionsWhere<TypeOfEntity>,
    status: T,
    actor: ActorType
  ): Promise<boolean> {
    return this._repo.setStatus<T>(criteria, status, actor);
  }

  async remove(
    criteria: string | string[] | number | number[] | FindOptionsWhere<TypeOfEntity>,
    actor: ActorType
  ): Promise<boolean> {
    return this._repo.remove(criteria, actor);
  }
}
