import {hasOne, model, property} from '@loopback/repository';
import {UserCredentials} from '../models';
import {TimestampEntity} from '../lib/timestamp-entity';
import { SlugEntityTitle } from '../lib/slug-entity-title';
import { SpareParts } from './spareParts.model';
import {Offer} from './offer.model';

@model()
export class Order extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  idOrder: string;

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

  @property({
    type: 'object',
    required: true,
  })
  sparePart: {brand: string, model: string, year: string, engine: string};

  @property({
    type: 'string',
    required: true,
  })
  productName: string;

  @property({
    type: 'string',
    required: true,
  })
  productBrand: string;

  @property({
    type: 'string',
    required: true,
  })
  productDetails: string;

  @property({
    type: 'number',
    required: true,
  })
  status: number;

  @property({
    type: 'number',
    required: true,
  })
  limitPrice: number;

  @property({
    type: 'number',
    required: true,
  })
  qty: number;

  @property({
    type: 'string',
    required: true,
  })
  photo: string;

  @property({
    type: 'Date',
  })
  closingDate?: Date;

  @property.array(Object)
  offers: Offer[];


  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Order>) {
    super(data);
  }
}

export interface OrderRelations {
  // describe navigational properties here
}

export type OrderWithRelations = Order & OrderRelations;
