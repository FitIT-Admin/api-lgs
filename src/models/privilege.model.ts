import {model, property} from '@loopback/repository';
import {TimestampEntity} from './timestamp.model';

@model()
export class Privilege extends TimestampEntity {
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
    required: true,
  })
  type?: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'number',
    required: true,
  })
  status?: number;

  @property.array(Privilege)
  privilege: Privilege[];

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Privilege>) {
    super(data);
  }
}

export interface PrivilegeRelations {
  // describe navigational properties here
}

export type PrivilegeWithRelations = Privilege & PrivilegeRelations;
