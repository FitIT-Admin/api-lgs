import {hasOne, model, property} from '@loopback/repository';
import {UserCredentials} from '../models';
import {TimestampEntity} from '../lib/timestamp-entity';

@model()
export class Company extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  rut: string;

  @property({
    type: 'string',
    required: false,
  })
  billingType?: string;

  @property({
    type: 'string',
    required: false,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  type: string;

  @property({
    type: 'string',
    required: false,
  })
  createBy: string;

  @property({
    type: 'string',
    required: false,
  })
  direction: string;

  @property({
    type: 'string',
    required: false,
  })
  region: string;

  @property({
    type: 'string',
    required: false,
  })
  commune: string;

  @property({
    type: 'string',
    required: false,
  })
  phone: string;

  @property({
    type: 'number',
    required: false,
  })
  accountNumber: number;

  @property({
    type: 'string',
    required: false,
  })
  accountType: string;

  @property({
    type: 'string',
    required: false,
  })
  bank: string;

  @property.array(String)
  make: string[];

  @property({
    type: 'number',
    required: true,
  })
  status: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Company>) {
    super(data);
  }
}

export interface CompanyRelations {
  // describe navigational properties here
}

export type CompanyWithRelations = Company & CompanyRelations;
