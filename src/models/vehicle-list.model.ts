import {hasOne, model, property} from '@loopback/repository';
import {TimestampEntity} from '../lib/timestamp-entity';

@model()
export class VehicleList extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  make: string;

  @property({
    type: 'string',
    required: true,
  })
  model: string;

  @property({
    type: 'string',
    required: true,
  })
  year: string;

  @property({
    type: 'string',
    required: true,
  })
  motor: string;
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<VehicleList>) {
    super(data);
  }
}

export interface VehicleListRelations {
  // describe navigational properties here
}

export type VehicleListWithRelations = VehicleList & VehicleListRelations;
