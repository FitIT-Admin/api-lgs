import {model, property} from '@loopback/repository';
import {SlugEntityTitle} from '../lib/slug-entity-title';

@model()
export class Group extends SlugEntityTitle  {
  @property({
    type: 'string',
    id: 1,
  })
  id: string;

  @property({
    type: 'string',
  })
  organization?: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'number',
    required: true,
  })
  status?: number;

  @property({
    type: 'string',
  })
  createdBy?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Group>) {
    super(data);
  }
}

export interface GroupRelations {
  // describe navigational properties here
}

export type GroupWithRelations = Group & GroupRelations;
