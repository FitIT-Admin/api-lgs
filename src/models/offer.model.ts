import {hasOne, model, property} from '@loopback/repository';
import {UserCredentials} from '../models';
import {TimestampEntity} from '../lib/timestamp-entity';
import { SlugEntityTitle } from '../lib/slug-entity-title';

@model()
export class Offer extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  idOffer: string;

  @property({
    type: 'string',
    required: true,
  })
  createBy: string;

  @property({
    type: 'number',
    required: true,
  })
  status: number;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

  @property({
    type: 'string',
    required: true,
  })
  photo: string;
  
  @property({
    type: 'string',
    required: false,
  })
  comentario: string;
  
  @property({
    type: 'string',
    required: true,
  })
  despacho: string;

  @property({
    type: 'string',
    required: true,
  })
  company: string;
  
  @property({
    type: 'string',
    required: true,
  })
  origen: string;
  
  @property({
    type: 'string',
    required: true,
  })
  estado: string;
  
  
  @property({
    type: 'number',
    required: true,
  })
  cantidad: number;
  
  @property({
    type: 'string',
    required: true,
  })
  idOrder: string;
  
  @property({
    type: 'string',
    required: true,
  })
  idProduct: string;  
  
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Offer>) {
    super(data);
  }
}

export interface OfferRelations {
  // describe navigational properties here
}

export type OfferWithRelations = Offer & OfferRelations;
