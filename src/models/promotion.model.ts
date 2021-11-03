import { model, property} from '@loopback/repository';
import { TimestampEntity } from '../lib/timestamp-entity';

@model()
export class Promotion extends TimestampEntity {
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
    type: 'number',
    required: true,
  })
  service: number;
  
  @property({
    type: 'string'
  })
  description?: string;

  @property({
    type: 'string'
  })
  conditions?: string;

  @property({
    type: 'boolean',
    required: true,
  })
  available: boolean;

  @property({
    type: 'string',
  })
  imagePath?: string;

  @property({
    type: 'string'
  })
  createdBy: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Promotion>) {
    super(data);
  }
}

export interface PromotionRelations {
  // describe navigational properties here
}

export type PromotionWithRelations = Promotion & PromotionRelations;
