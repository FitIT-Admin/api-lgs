import {model, property} from '@loopback/repository';
import {TimestampEntity} from './timestamp.model';

@model()
export class PrivilegeType extends TimestampEntity {
  @property({
    type: 'string',
    id: 1,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
  })
  description?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<PrivilegeType>) {
    super(data);
  }
}

export interface PrivilegeTypeRelations {
  // describe navigational properties here
}

export type PrivilegeTypeWithRelations = PrivilegeType & PrivilegeTypeRelations;
