import {model, property} from '@loopback/repository';
import {TimestampEntity} from '../lib/timestamp-entity';
@model()
export class ClaimedPointsNDC  extends TimestampEntity  {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'number',
    required: true,
    status: 0,
  })
  status?: number;

  @property({
    type: 'string',
  })
  createdBy?: string;
  
  @property({
    type: 'string',
    required: true,
  })
  ot?: string;
  
  @property({
    type: 'string',
  })
  assignedTo?: string;
  
  @property({
    type: 'string',
  })
  fechaTrabajo?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ClaimedPointsNDC>) {
    super(data);
  }
}

export interface ClaimedPointsNDCRelations {
  // describe navigational properties here
}

export type ClaimedPointsNDCWithRelations = ClaimedPointsNDC & ClaimedPointsNDCRelations;
