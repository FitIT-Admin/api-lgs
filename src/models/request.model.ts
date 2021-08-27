import {model, property} from '@loopback/repository';
import { TimestampEntity } from '../lib/timestamp-entity';

@model()
export class Request extends TimestampEntity {
  @property({
    type: 'string',
    id: 1,
  })
  id: string;

  @property({
    type: 'string',
  })
  createdBy: string

  @property({
    type: 'string',
  })
  assigToRole: string
  
  @property({
    type: 'string',
  })
  assignedAt: string

  @property({
    type: 'string',
    required: true
  })
  form: string

  @property({
    type: 'number',
  })
  latitude: number

  @property({
    type: 'number',
  })
  longitude: number

  @property.array(Object)
  questions: {title: string; answer: any[], tipo: string}[];

  @property({
    type: 'number',
  })
  status: number

  @property({
    type: 'date',
  })
  confirmatedAt?: Date;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  @property.array(Object)
  tracks:any[];

  constructor(data?: Partial<Request>) {
    super(data);
  }
}

