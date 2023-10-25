import {Entity, model, property} from '@loopback/repository';

@model()
export class trxLogs extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  userId?: string;

  @property({
    type: 'string',
    required: true,
  })
  module?: string;

  @property({
    type: 'string',
    required: true,
  })
  logLevel?: string;

  @property({
    type: 'string',
    required: true,
  })
  trxType?: string;

  @property({
    type: 'string',
    required: true,
  })
  details?: string;

  @property({
    type: 'date',
    required: true,
  })
  createdAt?: string;

  @property({
    type: 'date',
    required: true,
  })
  updatedAt?: string;


  constructor(data?: Partial<trxLogs>) {
    super(data);
  }
}

export interface trxLogsRelations {
  // describe navigational properties here
}

export type trxLogsWithRelations = trxLogs & trxLogsRelations;
