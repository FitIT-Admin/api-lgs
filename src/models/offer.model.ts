import {hasOne, model, property} from '@loopback/repository';
import {UserCredentials} from '../models';
import {TimestampEntity} from '../lib/timestamp-entity';
import { SlugEntityTitle } from '../lib/slug-entity-title';
import {Product, Order} from '.';

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
    required: false,
  })
  photo: string;

  @property({
    type: 'string',
    required: false,
  })
  photoPaymentReceiptAtClaimant: string;

  @property({
    type: 'string',
    required: false,
  })
  photoPaymentReceiptAtAdmin: string;
  
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
  qty: number;

  @property({
    type: 'number',
    required: true,
  })
  qtyOfferAccepted: number;

  @property({
    type: 'number',
    required: true,
  })
  commission: number;
  
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
  
  @property.array(Object)
  order?: Order[];
  
  @property.array(Object)
  offer?: Offer[];

  @property({
    type: 'date',
  })
  confirmedAtAdmin?: Date | null;

  @property({
    type: 'date',
  })
  confirmedAtClaimant?: Date | null;

  @property({
    type: 'string',
  })
  acceptedByUser?: string;

  @property({
    type: 'string',
  })
  acceptedByCompany?: string;
    
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
