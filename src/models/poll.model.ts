import {model, property} from '@loopback/repository';
import {TimestampEntity} from './timestamp.model';

@model()
export class Poll extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  createdBy: string;

  @property({
    type: 'string',
  })
  idRole: string;

  @property({
    type: 'string',
  })
  idOT: string;

  @property({
    type: 'number',
    required: true,
  })
  status: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Poll>) {
    super(data);
  }
}

export interface PollRelations {
  // describe navigational properties here
}

export type PollWithRelations = Poll & PollRelations;
