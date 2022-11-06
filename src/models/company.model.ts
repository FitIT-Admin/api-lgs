import {hasOne, model, property} from '@loopback/repository';
import {UserCredentials} from '../models';
import {TimestampEntity} from '../lib/timestamp-entity';

@model()
export class Company extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  rut: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  direction: string;

  @property({
    type: 'string',
    required: true,
  })
  phone: string;

  @property({
    type: 'number',
    required: true,
  })
  accountNumber: number;

  @property({
    type: 'string',
    required: true,
  })
  accountType: string;

  @property({
    type: 'string',
    required: true,
  })
  bank: string;

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
