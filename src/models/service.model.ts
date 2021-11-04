import { model, property} from '@loopback/repository';
import { TimestampEntity } from '../lib/timestamp-entity';

@model()
export class Service extends TimestampEntity {
  @property({
    type: 'string',
    id: true
  })
  id: string;

  @property({
    type: 'number',
    required: true,
  })
  serviceID: number;

  @property({
    type: 'string',
    required: true,
  })
  serviceName: string;
  
  @property({
    type: 'number'
  })
  serviceType: number;


  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Service>) {
    super(data);
  }
}

export interface ServiceRelations {
  // describe navigational properties here
}

export type ServiceWithRelations = Service & ServiceRelations;
