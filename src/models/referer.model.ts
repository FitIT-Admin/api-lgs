import { model, property} from '@loopback/repository';
import { TimestampEntity } from '../lib/timestamp-entity';

@model()
export class Referer extends TimestampEntity {
  @property({
    type: 'string',
    id: true
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  lastName: string;

  @property({
    type: 'string',
    required: true,
  })
  secondLastName: string;

  @property({
    type: 'string',
    required: true,
  })
  rut: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  phone: string;

  @property({
    type: 'number',
    required: true,
  })
  service: number;

  @property({
    type: 'number',
    required: false,
  })
  profit?: number;

  @property({
    type: 'number',
    required: true,
  })
  serviceType: number;

  @property({
    type: 'string',
  })
  information?: string;

  @property({
    type: 'number',
  })
  status: number;

  @property({
    type: 'string',
  })
  seller: string;

  @property({
    type: 'string',
  })
  promotion: string;

  @property({
    type: 'string',
  })
  referent: string;


  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Referer>) {
    super(data);
  }
}

export interface RefererRelations {
  // describe navigational properties here
}

export type RefererWithRelations = Referer & RefererRelations;
