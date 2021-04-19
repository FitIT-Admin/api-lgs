import {model, property} from '@loopback/repository';
import {SlugEntityTitle} from '../lib/slug-entity-title';

@model()
export class Privilege extends SlugEntityTitle {
  @property({
    type: 'string',
    id: 1,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  page?: string

  @property({
    type: 'string',
  })
  icon?: string

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'boolean',
    required: true,
  })
  canRead: boolean;

  @property({
    type: 'boolean',
    required: true,
  })
  canWrite: boolean;

  @property({
    type: 'string'
  })
  createdBy?: string;


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
