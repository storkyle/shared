import { castBoolean } from '../utilities';
import { BaseEntity } from './base_entity';

export const baseTypeResolver = {
  creator: (parent: BaseEntity) => {
    return castBoolean(parent.creator) ? { __typename: 'User', id: parent.creator } : null;
  },
  updater: (parent: BaseEntity) => {
    return castBoolean(parent.updater) ? { __typename: 'User', id: parent.updater } : null;
  },
};
