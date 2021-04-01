import {model, property} from '@loopback/repository';
import {TimestampEntity} from './timestamp.model';

@model()
export class Commune extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  region: string;

  @property({
    type: 'string',
    required: true,
  })
  code: string;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'number',
    required: true,
  })
  status?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Commune>) {
    super(data);
  }
}

export interface CommuneRelations {
  // describe navigational properties here
}

export type CommuneWithRelations = Commune & CommuneRelations;
