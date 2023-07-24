import {hasOne, model, property} from '@loopback/repository';
import {Offer, UserCredentials} from '.';
import {TimestampEntity} from '../lib/timestamp-entity';
import { SlugEntityTitle } from '../lib/slug-entity-title';

@model()
export class Product extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    id: true,
  })
  idOrder: string;

  @property({
    type: 'string',
  })
  title: string;

  @property({
    type: 'number',
    required: true,
  })
  qty: number;

  @property({
    type: 'number',
    required: true,
  })
  originalQty: number;

  @property({
    type: 'number',
    required: true,
  })
  status: number;

  @property({
    type: 'string',
    required: true,
  })
  createBy: string;

  @property({
    type: 'string',
    required: true,
  })
  company: string;
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Product>) {
    super(data);
  }
}

export interface ProductRelations {
  // describe navigational properties here
}

export type ProductWithRelations = Product & ProductRelations;
